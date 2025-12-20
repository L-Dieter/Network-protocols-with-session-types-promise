import { WebSocket, WebSocketServer } from "ws";
import { Label, Session } from "../../protocol";
import { Marker } from "../interfaces/marker";
import { Choice } from "./choice";
import { updateSession } from "../update/updateSession";
import { resolve } from "path";

// create a new channel for a server or client
export abstract class Channel {

    // connection values
    abstract server: WebSocketServer | null;
    abstract client: WebSocket | null;

    // the session to work with on a server
    abstract session: Session;

    // input array (collects the incoming messages)
    public messages: string[] = new Array<string>;

    // store the references
    public markerDb: Marker[] = [];

    // parse and return the first message of the input array
    async receive() : Promise<any> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "single" || this.session.dir !== "recv") {
            throw new Error(`Invalid method **RECEIVE** for the given session type`);
        }
      
        await this.next();
        const recv: any = this.messages.shift();

        // check if the message can be transformed from JSON
        try {
            return JSON.parse(recv);
        } catch (error) {
            throw new Error("Not a valid JSON");
        }

    }

    // stringyfy and send any message
	async send(x : any) : Promise<void> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "single" || this.session.dir !== "send") {
            throw new Error(`Invalid method **SEND** for the given session type`);
        }

        await this.next();

        let msg: string = "";

        // check if the message can be transformed to JSON
        try {
            msg = JSON.stringify(x);
        } catch (error) {
            throw error;
        }

        if (this.client) {
            this.client.send(msg);
        }
    }

    // try to match the first string of the input array with a tag of the choices
	async choice<T>(chs : Array<Choice<T>>) : Promise<T> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "choice" || this.session.dir !== "recv") {
            throw new Error(`Invalid method **CHOICE** for the given session type`);
        }

        const label: string | undefined = this.messages.shift();

        await this.next(label);

        // check if a given tag by the input array matches a tag in the choice array
        for (var ch of chs) {
            if (ch.tag === label) {
                return ch.callback();
            }
        }

        // throw an exception if there is no match
        throw new Error("No match in CHOICE found!");
    }

    // send a message with the selected tag
	async select(tag: string) : Promise<void> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "choice" || this.session.dir !== "send") {
            throw new Error(`Invalid method **SELECT** for the given session type`);
        }

        await this.next(tag);

        if (this.client) {
            this.client.send(JSON.stringify(tag));
        }
    }

    // close the connection
	async close() : Promise<void> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "end") {
            throw new Error(`Invalid method **CLOSE** for the given session type`);
        }

        if (this.server) {
            this.server.close();
            return;
        }
        else if (this.client) {
            this.client.close();
            return;
        }

        throw new Error("This method is not implemented yet!");
    }

    // update the session and the markers if needed
    private async next(label?: Label) : Promise<void> {
        const update: [Session, Marker[]] = updateSession(this.session, this.markerDb, label);
        this.session = update[0];
        this.markerDb = update[1];
    }

}
