import { WebSocket } from "ws";
import * as readline from 'readline';
import { processClientMessage } from "../events/messageClient";

export class Client {
    private socket: WebSocket | null = null;
    private url: string;
    private rl: readline.Interface;

    constructor (url: string) {
        this.url = url;

        // Set up a readline interface to be able to answer a request from the server
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
    }

    // start a connection to the server
    connect = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            // open a connection with a server
            this.socket = new WebSocket(this.url);

            // get a notification when the client connects to the server
            this.socket.on('open', () => {
                console.log(`[Connected to server with url: ${this.url}]`);
                resolve();
            })

            // throws an error
            this.socket.on('error', (e) => {
                console.error("Connection error: ", e);
                reject(e);

            })

            // close the connection
            this.socket.on('close', () => {
                console.log('Disconnected from WebSocket server');
                this.rl.close();
            })

        });
    }

    // sends a message to the server
    sendMessage = (response: string): Promise<void> => {
        return new Promise((resolve) => {

            if (!this.socket) {
                throw new Error("Client is not connected");
            }
    
            this.socket.send(response);

            resolve();
        });
    }

    // handles incoming messages from the server
    handleMessage = (): void => {
        if (!this.socket) {
            throw new Error("Client is not connected");
        }
        
        this.socket.on('message', async (data: any) => {

            const response: string = await processClientMessage(data, this.rl);
            
            if (response) {
                this.sendMessage(response);
            }
    
        });

    }

    closeConnection = (): void => {
        if (!this.socket) {
            throw new Error("Client is not connected");
        }

        this.socket.close();
    }

}