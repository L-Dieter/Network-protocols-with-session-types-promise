import { WebSocket } from "ws";
import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Server } from "../../classes/serverBase";

// the session for a arithmetic server
const session: Session =
    { kind: "def", name: "arith", cont:
        { kind: "choice", dir: "recv", alternatives:
            {
                "Add": { kind: "single", dir: "recv", payload: { type: "number" }, cont:
                            { kind: "single", dir: "recv", payload: { type: "number" }, cont:
                                { kind: "single", dir: "send", payload: { type: "number" }, cont: 
                                    { kind: "ref", name: "arith" }
                                }
                            }
                        },
                "Neg": { kind: "single", dir: "recv", payload: { type: "number" }, cont:
                            { kind: "single", dir: "send", payload: { type: "number" }, cont: 
                                { kind: "ref", name: "arith" }
                            }
                        },
                "Quit": { kind: "end" }
            }
        }
    };

// create the config to initialize a server
export const configArith: Config = mkConfig(session);

// a simple arithmetic server
export class ArithServer extends Server {
    constructor(session: Session, ws: WebSocket) {
        super(session, ws);
    }

	// add two numbers
	doAdd = async () : Promise<boolean> => {
		let x1 = await this.receive(); // async method inherited from Server
		let x2 = await this.receive();
		await this.send(x1 + x2);
		return true;
	}
	// negate a number
	doNeg = async () : Promise<boolean> => {
		let x1 = await this.receive();
		await this.send(-x1);
		return true;
	}
	// quit the program
	doQuit = async () : Promise<boolean> => {
		return false;
	}

	// choose the next method and close the connection if finished
	async start() {
        let r: boolean;
		do {
			r = await this.choice({  // async method inherited from Server
                  "Add": this.doAdd
                , "Neg": this.doNeg
				, "Quit": this.doQuit});
	    } while (r);
		await this.close();
	}
}
