import { WebSocket } from "ws";
import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Server } from "../../classes/serverBase";

// a server-side session to store, change or delete user data
const session: Session = {
    kind: "def", name: "loop", cont: {
        kind: "choice", dir: "recv", alternatives: {
            "NewUser": { kind: "single", dir: "recv", payload: { type: "record", payload: { "name": { type: "string" }, "data": { type: "record", payload:  { "isAdmin": { type: "bool" }, "id": { type: "number" } } } }}, cont: {
                kind: "ref", name: "loop"
            }},
            "ChangeUser": { kind: "single", dir: "recv", payload: { type: "string" }, cont: {
                kind: "single", dir: "recv", payload: { type: "string" }, cont: {
                    kind: "single", dir: "recv", payload: { type: "union", components: [{ type: "bool" }, { type: "number" }] }, cont: {
                        kind: "ref", name: "loop"
                    }
                }
            }},
            "DeleteUser": {
                kind: "single", dir: "recv", payload: { type: "string" }, cont: {
                    kind: "ref", name: "loop"
                }
            },
            "GetUserData": {
                kind: "single", dir: "recv", payload: { type: "string" }, cont: {
                    kind: "single", dir: "send", payload: { type: "record", payload: { "isAdmin": { type: "bool" }, "id": { type: "number" } } }, cont: {
                        kind: "ref", name: "loop"
                    }
                }
            },
            "Quit": { kind: "end" }
        }
    }
}

// create the config to initialize a server
export const configUser: Config = mkConfig(session);

// a simple server to store, change or delete user data
export class UserServer extends Server {
    users: Record<string, { "isAdmin": boolean, "id": number }>;
    newUser: {"name": string, "data": { "isAdmin": boolean, "id": number }};

    constructor(session: Session, socket: WebSocket) {
        super(session, socket);
        this.users = {};
        this.newUser = {"name": "default", "data": {"isAdmin": false, "id": -1}};
    }

    // add a new user
    addUser = async () : Promise<boolean> => {
        this.newUser = await this.receive();
        this.users[this.newUser.name] = this.newUser.data;
        return true;
    }

    // change the data of an existing user
    changeUser = async () : Promise<boolean> => {
        let name = await this.receive();
        let valueToChange: string = await this.receive();
        if (valueToChange === "isAdmin") {
            this.users[name]["isAdmin"] = await this.receive();
        }
        else if (valueToChange === "id") {
            this.users[name]["id"] = await this.receive();
        }
        return true;
    }

    // delte the data of a specific user
    deleteUser = async () : Promise<boolean> => {
        let username = await this.receive();
        delete this.users[username];
        return true;
    }

    // get the data of a user
    getUserData = async () : Promise<boolean> => {
        let username = await this.receive();
        this.send(this.users[username]);
        return true;
    }

    // close the connection
    quit = async () : Promise<boolean> => {
        return false;
    }

    // choose one of the methods in choice to continue with
    start = async () : Promise<void> => {
        let r: boolean;
        do {
            r = await this.choice({
                "NewUser": this.addUser,
                "ChangeUser": this.changeUser,
                "DeleteUser": this.deleteUser,
                "GetUserData": this.getUserData,
                "Quit": this.quit});
        } while (r);
        await this.close();
    }
}
