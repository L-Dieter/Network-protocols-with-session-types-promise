import { WebSocket } from "ws";
import { Server } from "../src/classes/serverBase";
import { Session } from "../protocol";
import { Config, mkConfig } from "../input";
import { ServerConnection } from "../src/classes/serverConnect";

class AdditionServer extends Server {

    constructor(session: Session, socket: WebSocket) {
        super(session, socket);
    }

    doAdd = async () : Promise<boolean> => {
        let sum: number = 0;
        sum += await this.receive();
        sum += await this.receive();
        await this.send(sum);
        sum = 0;
        return true;
    }

    doQuit = async () : Promise<boolean> => {
        return false;
    }

    doTimeout = async () : Promise<void> => {
        console.log("Timeout: NO MESSAGE");
        this.socket?.close();
    }

    async start(): Promise<void> {
        let r: boolean;
        do {
            r = await this.choice({
                "Add": this.doAdd,
                "Quit": this.doQuit
            }, { time: 1000, callback: this.doTimeout} )
        } while (r);
        this.close();
    }

}

const sessionServer: Session = {
    kind: "def", name: "loop", cont: {
        kind: "choice", dir: "recv", alternatives: {
            "Add": { kind: "single", dir: "recv", payload: { type: "number" }, cont: {
                kind: "single", dir: "recv", payload: { type: "number" }, cont: {
                    kind: "single", dir: "send", payload: { type: "number" }, cont: {
                        kind: "ref", name: "loop"
                    }
                }
            }},
            "Quit": { kind: "end" }
        }
    }
}

const configServer: Config = mkConfig(sessionServer, 3000);

const startServer: ServerConnection = new ServerConnection(configServer, AdditionServer);