import { WebSocket, WebSocketServer } from "ws";

export class ServerConnection {

    // the server to initialize
    public server: WebSocketServer | null = null;
    // the client that connects to the server
    public socket: WebSocket | null = null;

    // receive a config with more information about the session
    // and start a new server
    constructor(port: number) {

        this.server = new WebSocketServer({ port: port }); 

        this.initListeners(port);
    }

    // initialize the listeners needed for a proper connection
    private initListeners(port: number): void {

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

            this.socket = ws;

        });
    }
}
