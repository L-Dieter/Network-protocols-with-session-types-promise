import { WebSocket } from "ws";
import { Channel } from "./channel";
import { Config } from "../../input";

// create a new client
export class Client extends Channel {

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
    private initListeners(socket: WebSocket) : void {

        // get a notification when the client connects to the server
        socket.on('open', () => {
            console.log(`[Connected to server with url: ${this.uri}]`);
        })
        socket.onopen = () => { console.log("TEST"); }

        // throws an error
        socket.on('error', (e) => {
            console.error("Connection error: ", e);
        })

        // close the connection
        socket.on('close', () => {
            console.log('Disconnected from WebSocket server');
        })

        // check for incoming messages, push them to the array or resolve the data
        socket.on('message', (data: any) => {
            // check if the client is waiting for a message
            if (!this.resv) {
                this.messages.push(data);
            }
            else {
                // clear the timer if the message arrives in time
                if (this.timer) {
                    clearTimeout(this.timer);
                }
                const resolve = this.resv;
                this.resv = null;
                resolve(data);
            }
        })
    }

    // checks if the server is ready to connect
    public waitForConnection() : Promise<void> {
        return new Promise((resolve) => {
            if (this.socket?.readyState !== 1) {
                setTimeout(() => {
                    resolve(this.waitForConnection());
                }, 200);
            }
            else {
                this.initListeners(this.socket);
                this.initSession();
                resolve();
            }
        });
    }

}
