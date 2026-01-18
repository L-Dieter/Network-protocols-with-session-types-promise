import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Client } from "../../classes/clientBase";



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



const config: Config = mkConfig(session);


export class ArithClient extends Client {
    addNumbers: number[];
    negNumber: number;
    constructor() {
        super(config);

        this.addNumbers = [4, 8];
        this.negNumber = 12;
    }

    async add() : Promise<number> {
        await this.select("Add");
        await this.send(this.addNumbers[0]);
        await this.send(this.addNumbers[1]);
        let sum = await this.receive();
        await this.select("Quit");
        await this.close();
        return sum;
    }

    async neg() : Promise<number> {
        await this.select("Neg");
        await this.send(this.negNumber);
        let sum = await this.receive();
        await this.select("Quit");
        await this.close();
        return sum;
    }

}
