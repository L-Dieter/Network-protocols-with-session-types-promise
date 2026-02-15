import { WebSocket } from "ws";
import { Session } from "../../protocol";
import { Channel } from "./channel";


// create a new server
export class Server extends Channel {

    constructor(session: Session, socket: WebSocket) {
        super();

        this.session = session;
        this.socket = socket;

        this.initListeners();
        this.initSession();

    }

    async start() : Promise<any> {
        throw new Error("This method is not implemented yet: .start()");
    }

    // initialize the listeners for a connected client
    private initListeners(): void {

        // store the incoming messages in the input array
        this.socket?.on('message', (message: any) => {
            this.messages.push(message);
        })

        // short information if the client disconnects from the server
        this.socket?.on('close', () => {
            console.log('Client disconnected');
        });
    }

}
