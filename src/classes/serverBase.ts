import { WebSocket, WebSocketServer } from "ws";
import { Session } from "../../protocol";
import { Config } from "../../input";
import { Marker } from "../interfaces/marker";
import { Channel } from "./channel";
import { updateSession } from "../update/updateSession";


// create a new server
export class Server extends Channel {

    // the server to initialize
    server: WebSocketServer | null = null;
    // the client that connects to the server
    client: WebSocket | null = null;
    // the session given by the config
    session: Session;

    // receive a config with more information about the session
    // and start a new server
    constructor (config: Config) {

        super();

        this.session = config.session;
        
        this.server = new WebSocketServer({port: config.port});

        this.initListeners(config.port);
        this.initSession();
    }

    // initialize the listeners needed for a proper connection
    private initListeners(port: number) : void {

        // check if a server exists
        if (!this.server) {
            throw new Error("No server found");
        }

        // get a notification when the server is ready
        this.server.on('listening', () => {
            console.log(`Listening at ${port}...`);
        });

        // throw an error is something went wrong
        this.server.on('error', (e) => {
            console.error(e);
        });

        // get a notification if the connection gets closed
        this.server.on('close', () => {
            console.log("Connection closed");
        });

        // check for connecting clients
        this.server.on('connection', (ws: WebSocket) => {

            this.client = ws;

            // store the incoming messages in the input array
            this.client.on('message', (message: any) => {
                this.messages.push(JSON.parse(message));
            })

            // short information if the client disconnects from the server
            this.client.on('close', () => {
                console.log('Client disconnected');
            });
        });
    }

    // first check if the session starts with a definition and if so
    // immediately go to the next step
    private initSession(): void {

        if (this.session.kind === "def") {
            const update: [Session, Marker[]] = updateSession(this.session, this.markerDb);
            this.session = update[0];
            this.markerDb = update[1];
        }
    }
}
