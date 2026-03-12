import { WebSocket } from "ws";
import { Session } from "../../protocol";
import { Channel } from "./channel";


// create a new server-side channel
export abstract class Server extends Channel {

    constructor(session: Session, socket: WebSocket) {
        super();

        this.session = session;
        this.socket = socket;

        this.initListeners();
        this.initSession();

    }

    // the method to start a program after a client connects to the server
    abstract start() : Promise<any>;

    // initialize the listeners for a connected client
    private initListeners(): void {

        // store the incoming messages in the input array or resolve them
        this.socket?.on('message', (message: any) => {
            // check if the server is waiting for a message
            if (!this.resv) {
                this.messages.push(message);
            }
            else {
                // clear the timer if the message arrives in time
                if (this.timer) {
                    clearTimeout(this.timer);
                }
                const resolve = this.resv;
                this.resv = null;
                resolve(message);
            }
        })

        // short information if the client disconnects from the server
        this.socket?.on('close', () => {
            console.log('Client disconnected');
        });
    }

}
