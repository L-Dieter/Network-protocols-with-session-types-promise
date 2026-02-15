import { WebSocket } from "ws";
import { Label, Session } from "../../protocol";
import { Marker } from "../interfaces/marker";
import { updateSession } from "../update/updateSession";
import { checkPayload } from "../check/checkPayload";

// create a new channel for a server or client
export abstract class Channel {

    // connection values
    public socket: WebSocket | null = null;

    // the session to work with on a server
    public session: Session = { kind: "end" };

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

        return await this.waitForMessage().catch((e) => console.error("Error thrown at .receive(): ", e));

    }

    // stringyfy and send any message
	async send(x : any) : Promise<void> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "single" || this.session.dir !== "send") {
            throw new Error(`Invalid method **SEND** for the given session type`);
        }

        this.next();
        
        // check if the message can be transformed to JSON
        try {
            const msg: string = JSON.stringify(x);
            this.socket?.send(msg);
        } catch (error) {
            throw error;
        }


    }

    // try to match the first string of the input array with a tag of the choices
	async choice<T>(chs : Record<string, () => T>) : Promise<T> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "choice" || this.session.dir !== "recv") {
            throw new Error(`Invalid method **CHOICE** for the given session type`);
        }
        
        return await this.waitForMessage(chs).catch((e) => console.error("Error thrown at .choice(): ", e));

    }

    // send a message with the selected tag
	async select(tag: string) : Promise<void> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "choice" || this.session.dir !== "send") {
            throw new Error(`Invalid method **SELECT** for the given session type`);
        }

        // check if the tag exists in the session
        try {
            this.next(tag);
        } catch (error) {
            throw new Error("Not a valid tag");
        }

        this.socket?.send(JSON.stringify(tag));

    }

    // close the connection
	async close() : Promise<void> {

        // throw an exception if the session type does not fit the method
        if (this.session.kind !== "end") {
            throw new Error(`Invalid method **CLOSE** for the given session type`);
        }

        this.socket?.close();
    }

    // first check if the session starts with a definition and if so
    // immediately go to the next step
    public initSession(): void {

        if (this.session.kind === "def") {
            const update: [Session, Marker[]] = updateSession(this.session, this.markerDb);
            this.session = update[0];
            this.markerDb = update[1];
        }

        console.log("--- Session initialized ---");
    }



    // update the session and the markers if needed
    private next(label?: Label) : void {
        const update: [Session, Marker[]] = updateSession(this.session, this.markerDb, label);
        this.session = update[0];
        this.markerDb = update[1];
    }

    // check the stack of messages and wait until one arrives if needed
    private waitForMessage<T>(chs: Record<string, () => T> = {}) : Promise<any> {
        return new Promise (async (resolve, reject) => {
            if (this.messages.length === 0) {
                setTimeout(() => {
                    resolve(this.waitForMessage(chs));
                }, 100);
            }
            else {
                const recv: any = this.messages.shift();
                let msg: any;
                
                // check if the message can be transformed from JSON
                try {
                    msg = JSON.parse(recv);
                } catch (error) {
                    throw new Error("Not a valid JSON");
                }

                // check if the message is of the correct type
                if (this.session.kind === "single") {
                    if (!checkPayload(msg, this.session.payload)) {
                        reject(`Payload is not of { type: ${this.session.payload.type} }`);
                    }

                    this.next();
                    resolve(msg);
                }
                else if (this.session.kind === "choice") {
                    if (!checkPayload(msg, { type: "string" })) {
                        reject("Payload is not of { type: string }");
                    }

                    // check if the tag exists in the choice object
                    if (chs.hasOwnProperty(msg)) {
                        this.next(msg);
                        resolve(chs[msg]());
                    }
                    else {
                        // throw an exception if there is no match
                        throw new Error("No match in CHOICE found!");
                    }
                }
            }
        });
    }

}
