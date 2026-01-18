import { WebSocket } from "ws";
import { Session } from "../../protocol";
import { Config } from "../../input";
import { Marker } from "../interfaces/marker";
import { Channel } from "./channel";
import { updateSession } from "../update/updateSession";
import { ServerConnection } from "./serverConnect";


// create a new server
export class Server extends Channel {

    // the client that connects to the server
    socket: WebSocket | null = null;
    // the session given by the config
    session: Session;
    // the server to initialise in the constructor
    server: ServerConnection;

    constructor(config: Config) {
        super();

        this.session = config.session;

        this.server = new ServerConnection(config.port);

    }

    // check if a client connects and initialize the needed listeners and session afterwards
    public waitForClientConnection() : Promise<void> {
        return new Promise((resolve) => {
            if (this.server.socket?.readyState !== 1) {
                setTimeout(() => {
                    resolve(this.waitForClientConnection());
                }, 100);
            }
            else {
                this.initListeners();
                this.initSession();
                resolve();
            }
        });
    }

    // initialize the listeners for a connected client
    private initListeners(): void {

        this.socket = this.server.socket;

        if (!this.socket) {
            return;
        }

        // store the incoming messages in the input array
        this.socket.on('message', (message: any) => {
            this.messages.push(message);
        })
    
        // short information if the client disconnects from the server
        this.socket.on('close', () => {
            console.log('Client disconnected');
        });
    }

    // close the server connection
    async close() : Promise<void> {
        this.server.server?.close();
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
