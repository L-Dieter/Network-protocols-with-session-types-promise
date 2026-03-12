import { Config, mkConfig } from "../../../input";
import { Session } from "../../../protocol";
import { Client } from "../../classes/clientBase";

// a client-side session to store, change or delete user data
const session: Session = {
    kind: "def", name: "loop", cont: {
        kind: "choice", dir: "send", alternatives: {
            "NewUser": { kind: "single", dir: "send", payload: { type: "record", payload: { "name": { type: "string" }, "data": { type: "record", payload:  { "isAdmin": { type: "bool" }, "id": { type: "number" } } } }}, cont: {
                kind: "ref", name: "loop"
            }},
            "ChangeUser": { kind: "single", dir: "send", payload: { type: "string" }, cont: {
                kind: "single", dir: "send", payload: { type: "string" }, cont: {
                    kind: "single", dir: "send", payload: { type: "union", components: [{ type: "bool" }, { type: "number" }] }, cont: {
                        kind: "ref", name: "loop"
                    }
                }
            }},
            "DeleteUser": {
                kind: "single", dir: "send", payload: { type: "string" }, cont: {
                    kind: "ref", name: "loop"
                }
            },
            "GetUserData": {
                kind: "single", dir: "send", payload: { type: "string" }, cont: {
                    kind: "single", dir: "recv", payload: { type: "record", payload: { "isAdmin": { type: "bool" }, "id": { type: "number" } } }, cont: {
                        kind: "ref", name: "loop"
                    }
                }
            },
            "Quit": { kind: "end" }
        }
    }
}

// create the config to initialize a client
const config: Config = mkConfig(session);

// a simple client to store, change or delete user data
export class UserClient extends Client {
    constructor() {
        super(config);
    }

    // add a new user
    addUser = async (newUser: { "name": string, "data": { "isAdmin": boolean, "id": number }}) : Promise<void> => {
        await this.select("NewUser");
        await this.send(newUser);
    }

    // change the date of an existing user
    changeUser = async (name: string, key: string, value: boolean | number) : Promise<void> => {
        await this.select("ChangeUser");
        await this.send(name);
        await this.send(key);
        await this.send(value);
    }

    // delete the data of a specific user
    deleteUser = async (username: string) : Promise<void> => {
        await this.select("DeleteUser");
        await this.send(username);
    }

    // get the data of a user
    getUserData = async (username: string) : Promise<Record<string, { "isAdmin": boolean, "id": number }>> => {
        await this.select("GetUserData");
        await this.send(username);
        let data = await this.receive();
        return data;
    }

    // close the connection
    quit = async () : Promise<void> => {
        await this.select("Quit");
        await this.close();
    }
}
