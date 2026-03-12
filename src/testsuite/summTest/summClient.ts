import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Client } from "../../classes/clientBase";

// the client-side session for computing the sum
const session: Session =
    { kind: "def", name: "sum", cont:
        { kind: "choice", dir: "send", alternatives: {
            "Next": { kind: "single", dir: "send", payload: { type: "number" }, cont: { kind: "ref", name: "sum" }},
            "Quit": { kind: "single", dir: "recv", payload: { type: "number" }, cont: { kind: "end" }}
            }
        }
    }

// create the config to initialize a client
export const configSumClient: Config = mkConfig(session);

// a client to send numbers to a server
export class SummationClient extends Client {
    numbers: number[];
    sum: number;
    constructor(numbers: number[]) {
        super(configSumClient);
        this.numbers = numbers;
        this.sum = 0;
    }

    // keep sending all numbers inside of the list "numbers" and return the sum
    async start() : Promise<number> {
        for (let n of this.numbers) {
            await this.select("Next");
            await this.send(n);
        }
        await this.select("Quit");
        this.sum = await this.receive();
        await this.close();
        return this.sum;
    }
}
