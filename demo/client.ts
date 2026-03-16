import { Config, mkConfig } from "../input";
import { Session } from "../protocol";
import { Client } from "../src/classes/clientBase";

class AdditionClient extends Client {
    constructor()  {
        super(configClient);
    }

    doAdd = async (x: number, y: number) : Promise<number> => {
        let r: number = 0;
        await this.select("Add");
        await this.send(x);
        await this.send(y);
        r = await this.receive();
        return r;
    }

    doQuit = async () : Promise<void> => {
        await this.select("Quit");
        await this.close();
    }
}

const sessionClient: Session = {
    kind: "def", name: "loop", cont: {
        kind: "choice", dir: "send", alternatives: {
            "Add": { kind: "single", dir: "send", payload: { type: "number" }, cont: {
                kind: "single", dir: "send", payload: { type: "number" }, cont: {
                    kind: "single", dir: "recv", payload: { type: "number" }, cont: {
                        kind: "ref", name: "loop"
                    }
                }
            }},
            "Quit": { kind: "end" }
        }
    }
}

const configClient: Config = mkConfig(sessionClient, 3000);

async function start() : Promise<void> {
    const client: AdditionClient = new AdditionClient();
    await client.waitForConnection();
    let r: number = await client.doAdd(5, 5);
    console.log(r);
    r = await client.doAdd(4, 8);
    console.log(r);
    await client.doQuit();
}

start();