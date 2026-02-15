import { WebSocket } from "ws";
import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Server } from "../../classes/serverBase";


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

export const config: Config = mkConfig(session);


export class ArithServer extends Server {
    constructor(session: Session, ws: WebSocket) {
        // super(); // dummy session
        super(session, ws);
    }

	doAdd = async () : Promise<boolean> => {
		let x1 = await this.receive(); // async method inherited from Server
		let x2 = await this.receive();
		await this.send(x1 + x2);
		return true;
	}
	doNeg = async () : Promise<boolean> => {
		let x1 = await this.receive();
		await this.send(-x1);
		return true;
	}
	doQuit = async () : Promise<boolean> => {
		return false;
	}

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
