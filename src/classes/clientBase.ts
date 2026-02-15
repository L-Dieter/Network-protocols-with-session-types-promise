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
    private initListeners() : void {

        // get a notification when the client connects to the server
        this.socket?.on('open', () => {
            console.log(`[Connected to server with url: ${this.uri}]`);
        })

        // throws an error
        this.socket?.on('error', (e) => {
            console.error("Connection error: ", e);
        })

        // close the connection
        this.socket?.on('close', () => {
            console.log('Disconnected from WebSocket server');
        })

        // check for incoming messages, push them to the array and print them to the console
        this.socket?.on('message', (data: any) => {
            this.messages.push(data);
        })

        console.log("----- CLIENT LISTENERS INIT -----");
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
                this.initListeners();
                this.initSession();
                resolve();
            }
        });
    }

}
