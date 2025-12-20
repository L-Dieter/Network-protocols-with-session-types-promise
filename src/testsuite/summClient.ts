import { Config, mkConfig } from "../../input";
import { Session } from "../../protocol";
import { Client } from "../classes/clientBase";


const session: Session =
    { kind: "def", name: "sum", cont:
        { kind: "choice", dir: "send", alternatives: {
            "Next": { kind: "single", dir: "send", payload: { type: "number" }, cont: { kind: "ref", name: "sum" }},
            "Quit": { kind: "single", dir: "recv", payload: { type: "number" }, cont: { kind: "end" }}
            // "Quit": { kind: "end" }
        }
        }
    }

const config: Config = mkConfig(session);

export class SummationClient extends Client {
    numbers: number[];
    constructor(numbers: number[]) {
        // super(new Session()); // dummy session
        super(config);
        this.numbers = numbers;
    }

    async start() : Promise<number> {
        for (let n of this.numbers) {
            await this.select("Next");
            await this.send(n);
        }
        await this.select("Quit");
        let sum = await this.receive();
        await this.close();
        return sum;
    }
}
