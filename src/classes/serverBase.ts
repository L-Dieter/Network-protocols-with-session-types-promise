import { WebSocket, WebSocketServer } from "ws";
import { Program, Session } from "../../protocol";
import { buildRequest } from "../misc/buildMsg";
import { generateId } from "../misc/generateId";
import { Config } from "../../input";
import { Marker } from "../interfaces/marker";
import { doSteps } from "../program/continueProgram";
import { processServerMessage } from "../events/messageServer";

export class Server {
    private wss: WebSocketServer | null = null;

    private port: number;
    private session: Session;
    private program: Program;

    private markerDb: Marker[];

    private pendingRequests: Map<number, (response: string) => void>;

    constructor (config: Config) {
        this.port = config.port;
        this.session = config.session;
        this.program = config.program;

        this.pendingRequests = new Map();

        this.markerDb = [];
    }

    start = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            this.wss = new WebSocketServer({port: this.port});

            this.wss.on('listening', () => {
                console.log(`Listening at ${this.port}...`);
                resolve();
            });

            this.wss.on('error', (e) => {
                console.error();
                reject(e);
            });

            this.wss.on('close', () => {
                console.log("Connection closed");
            });
        })
    }

    handleConnection = (): Promise<void> => {
        return new Promise((resolve, reject) => {

            if (!this.wss) {
                throw new Error("No server found");
            }

            this.wss.on('connection', async (ws: WebSocket) => {

                if (!this.wss) {
                    throw new Error("No server found");
                }

                const client: any = ws;

                // do the steps and update the session, program and markerDb
                const state: [Session, Program, Marker[]] = doSteps(this.session, this.program, this.wss, client, this.markerDb);
                this.session = state[0];
                this.program = state[1];
                this.markerDb = state[2];

                this.handleMessage(ws);

                // send a request to the client
                try {
                    await this.request(client, this.session).catch();                   
                } catch (error) {
                    console.error("Failed sending a request: ", error);
                    reject(error);
                }

                // short information if the client disconnects from the server
                ws.on('close', () => {
                    console.log('Client disconnected');
                });

                resolve();

            })

        })
    }

    handleMessage = (ws: WebSocket): void => {
        ws.on('message', async (message: any) => {

            const msg: Record<string, any> = JSON.parse(message);

            const client: any = ws;

            // id#response
            const requestId: number = msg.id;
            const data: string = msg.message;

            if (this.pendingRequests.has(requestId)) {
                const response = this.pendingRequests.get(requestId);
                if (response) {
                    response(JSON.stringify(msg));
                }
                this.pendingRequests.delete(requestId);
            }
            else {
                ws.send("No pending request with the id: " + requestId);
                return;
            }

            if (!this.wss) {
                throw new Error("No server found");
            }

            // process the incoming message of the client
            const [session, program] = processServerMessage(client, this.session, this.program, this.markerDb, data, this.wss);
            this.session = session;
            this.program = program;

            // continue with the next steps
            const state: [Session, Program, Marker[]] = doSteps(this.session, this.program, this.wss, client, this.markerDb);
            this.session = state[0];
            this.program = state[1];
            this.markerDb = state[2];

            try {
                await this.request(client, this.session);
            } catch (error) {
                console.error("Failed sending a request: ", error);
            }
        })
    }

    request = (client: WebSocket, session: Session): Promise<string> => {
        // id#type
        const requestId: number = generateId(this.pendingRequests);

        return new Promise((resolve, reject) => {

            // save the id and a function to call if there is a response
            this.pendingRequests.set(requestId, resolve);

            // try to send a request
            try {
                client.send(buildRequest(requestId, session));
            } catch (error) {
                reject(`Failed to send the request`);
            }

            // timeout if there is no response after 60s
            setTimeout(() => {
                if (!this.wss) { throw new Error("No server found"); }
                if (this.pendingRequests.has(requestId)) {
                    reject("No response by the client");
                    this.pendingRequests.delete(requestId);
                    client.close();
                    this.wss.close();
                }
            }, 60000);

        })
    }

}