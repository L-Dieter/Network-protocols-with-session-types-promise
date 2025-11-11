import { Program, Session } from "../../protocol";
import { checkPayload } from "../check/checkPayload";
import { updateSession } from "../update/updateSession";
import { updateProgram } from "../update/updateProgram";
import { Marker } from "../interfaces/marker";
import * as commands from "../program/commands";
import { WebSocketServer } from "ws";

// handle the incoming message on the server
export function processServerMessage (client: WebSocket, session: Session, program: Program, markerDb: Marker[], message: string, wss: WebSocketServer): [Session, Program] {

    let msg: any = JSON.parse(message);

    let check: boolean = true;

    // check payload if possible
    if (session.kind === "single") {
        if (!checkPayload(msg, session.payload)) {
            check = false;
        }
    }
    // msg has to be a string if it is a "choice" session
    else if (session.kind === "choice") {
        if (!checkPayload(msg, { type: "string" })) {
            check = false;
        }
        else {
            // the msg has to be the same as an existing label in session.alternatives
            for (const key of Object.keys(session.alternatives)) {
                if (msg === key) {
                    check = true;
                    break;
                }
                else {
                    check = false;
                }
            }
        }

    }

    // if the payload check is successful continue, otherwise close the connection
    if (check) {

        if (program.command === "choose") {
            commands.choose(session, program, msg);
            session = updateSession(session, msg);
            program = updateProgram(program, msg);
        }
        else if (program.command === "recv") {
            commands.receive(session, program, msg);
            session = updateSession(session);
            program = updateProgram(program);
        }
    }
    else {
        console.log("Wrong input. Session terminates...");
        client.close();
        wss.close();
    }

    return [session, program];
}