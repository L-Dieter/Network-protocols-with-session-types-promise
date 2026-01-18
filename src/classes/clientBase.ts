import { WebSocket } from "ws";
import { Channel } from "./channel";
import { Session } from "../../protocol";
import { Config } from "../../input";
import { Marker } from "../interfaces/marker";
import { updateSession } from "../update/updateSession";

// create a new client
export class Client extends Channel {

    // the client we initialize in the constructor
    socket: WebSocket;
    // the session given by the config
    session: Session;

    // the uri we need to connect to the server
    private uri: string;

    constructor (config: Config) {
        super();

        this.session = config.session;
        
        this.uri = "ws://localhost:" + config.port;

        // open a connection with a server
        this.socket = new WebSocket(this.uri);

    }


    // initialize all needed listeners
    private initListeners(uri: string) : void {

        // check if the client exists
        if (!this.socket) {
            throw new Error("No client found");
        }

        // get a notification when the client connects to the server
        this.socket.on('open', () => {
            console.log(`[Connected to server with url: ${uri}]`);
        })

        // throws an error
        this.socket.on('error', (e) => {
            console.error("Connection error: ", e);
        })

        // close the connection
        this.socket.on('close', () => {
            console.log('Disconnected from WebSocket server');
        })

        // check for incoming messages, push them to the array and print them to the console
        this.socket.on('message', (data: any) => {
            this.messages.push(data);
        })
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

    // checks if the server is ready to connect
    public waitForConnection() : Promise<void> {
        return new Promise((resolve) => {
            if (this.socket.readyState !== 1) {
                setTimeout(() => {
                    resolve(this.waitForConnection());
                }, 200);
            }
            else {
                this.initListeners(this.uri);
                this.initSession();
                resolve();
            }
        });
    }

}
