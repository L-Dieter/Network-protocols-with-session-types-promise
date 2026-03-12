import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Client } from "../../classes/clientBase";


// the session for a arithmetic client
const session: Session =
    { kind: "def", name: "arith", cont:
        { kind: "choice", dir: "send", alternatives:
            {
                "Add": { kind: "single", dir: "send", payload: { type: "number" }, cont:
                            { kind: "single", dir: "send", payload: { type: "number" }, cont:
                                { kind: "single", dir: "recv", payload: { type: "number" }, cont: 
                                    { kind: "ref", name: "arith" }
                                }
                            }
                        },
                "Neg": { kind: "single", dir: "send", payload: { type: "number" }, cont:
                            { kind: "single", dir: "recv", payload: { type: "number" }, cont: 
                                { kind: "ref", name: "arith" }
                            }
                        },
                "Quit": { kind: "end" }
            }
        }
    };


// create the config to initialize a client
const config: Config = mkConfig(session);

// a simple arithmetic client
export class ArithClient extends Client {
    constructor() {
        super(config);
    }

    // add two numbers and return the sum
    async add(numbers: [number, number]) : Promise<number> {
        await this.select("Add");
        await this.send(numbers[0]);
        await this.send(numbers[1]);
        let sum = await this.receive();
        return sum;
    }

    // negate a number and return it
    async neg(num: number) : Promise<number> {
        await this.select("Neg");
        await this.send(num);
        let sum = await this.receive();
        return sum;
    }

    // close the connection
    async quit() : Promise<void> {
        await this.select("Quit");
        await this.close();
    }

}
