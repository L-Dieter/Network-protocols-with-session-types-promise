import { WebSocket } from "ws";
import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Server } from "../../classes/serverBase";


const session: Session =
    { kind: "def", name: "sum", cont: 
        { kind: "choice", dir: "recv", alternatives:
            {
                "Next": { kind: "single", dir: "recv", payload: { type: "number" }, cont: { kind: "ref", name: "sum" }},
                "Quit": { kind: "end" }
            }
        }
    }

export const config: Config = mkConfig(session);


export class SummationServer extends Server {
    sum: number;
    constructor(session: Session, socket: WebSocket) {
        // super(new Session()); // dummy session
        super(session, socket);
		this.sum = 0;
	}

	doNext = async () : Promise<boolean> => {
	    let x = await this.receive();
		this.sum += x;
		return true;
	}

	doQuit = async () : Promise<boolean> => {
		return false;
	}

    async start() : Promise<number> {
        let r: boolean;
	    do {
			r = await this.choice({
				"Next": this.doNext,
				"Quit": this.doQuit});
        } while (r);
		await this.close();
		return this.sum;
    }
}
