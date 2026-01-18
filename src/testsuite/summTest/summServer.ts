import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Choice } from "../../classes/choice";
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

const config: Config = mkConfig(session);


export class SummationServer extends Server {
    sum: number;
    constructor() {
        // super(new Session()); // dummy session
        super(config);
		this.sum = 0;
	}
	
	// async doNext() : Promise<boolean> {
	//     let x = await this.receive();
	// 	this.sum += x;
	// 	return true;
	// }
	doNext = async () : Promise<boolean> => {
	    let x = await this.receive();
		this.sum += x;
		return true;
	}
	async doQuit() : Promise<boolean>  {
		return false;
	}

    async start() : Promise<number> {
        let r: boolean;
	    do {
			r = await this.choice([
				new Choice("Next", this.doNext),
				// new Choice("Next", this.doNext.bind(this)),
				new Choice("Quit", this.doQuit)]);
        } while (r);
		await this.close();
		return this.sum;
    }
}
