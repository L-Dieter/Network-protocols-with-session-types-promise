import { WebSocket } from "ws";
import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Server } from "../../classes/serverBase";
import { ServerConnection } from "../../classes/serverConnect";

// the session for computing the sum on a server
const session: Session =
    { kind: "def", name: "sum", cont: 
        { kind: "choice", dir: "recv", alternatives:
            {
                "Next": { kind: "single", dir: "recv", payload: { type: "number" }, cont: { kind: "ref", name: "sum" }},
                "Quit": { kind: "single", dir: "send", payload: { type: "number" }, cont: { kind: "end" }}
            }
        }
    }

// create the config to initialize a server
export const configSumServer: Config = mkConfig(session);

// a server to compute a sum of the given numbers
export class SummationServer extends Server {
    sum: number;
    constructor(session: Session, socket: WebSocket) {
        super(session, socket);
		this.sum = 0;
	}

	// add another number to the sum
	doNext = async () : Promise<boolean> => {
	    let x = await this.receive();
		this.sum += x;
		return true;
	}

	// quit the program
	doQuit = async () : Promise<boolean> => {
		return false;
	}

	// print a message
	doTimeout = async () : Promise<void> => {
		console.log("TIMEOUT: NO MESSAGE");
	}

	// start the computation and choose between the given methods
	// send the sum to the client before closing the connection
    async start() : Promise<void> {
        let r: boolean;
	    do {
			r = await this.choice({
				"Next": this.doNext,
				"Quit": this.doQuit},
				{ time: 1000, callback: this.doTimeout}
			);
        } while (r);
		await this.send(this.sum);
		await this.close();
    }
}
