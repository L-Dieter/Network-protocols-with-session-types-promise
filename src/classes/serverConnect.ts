import { WebSocket, WebSocketServer } from "ws";
import { Session } from "../../protocol";
import { Config } from "../../input";
import { Server } from "./serverBase";

export class ServerConnection {

    // the server to initialize
    public server: WebSocketServer | null = null;
    // the port the server is initialized with
    private port: number;
    // the session to define the protocol on this server
    private session: Session;
    // the function to initialize a new channel for a client
    private channel: typeof Server;

    // receive a config with more information about the session
    // and start a new server
    constructor(config: Config, channelType: typeof Server) {

        this.port = config.port;
        this.session = config.session;

        this.server = new WebSocketServer({ port: this.port });

        this.channel = channelType;

        this.initListeners();
    }

    // initialize the listeners needed for a proper connection
    private initListeners(): void {

        // get a notification when the server is ready
        this.server?.on('listening', () => {
            console.log(`Listening at ${this.port}...`);
        });

        // throw an error is something went wrong
        this.server?.on('error', (e) => {
            console.error(e);
        });

        // get a notification if the connection gets closed
        this.server?.on('close', () => {
            console.log("Connection closed");
        });

        // check for connecting clients
        this.server?.on('connection', async (ws: WebSocket) => {

            // create a new channel for each client connecting to the server
            const channel: Server = new this.channel(this.session, ws);
            const r: any = await channel.start();
            console.log("RETURN: " + r);

        });

        console.log("--- Listeners initialized ---");

    }

}
