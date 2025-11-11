// Start a WebSocket server

import { Session, Program } from './protocol';
import { Marker } from "./src/interfaces/marker";
import { checkSession } from "./src/check/checkSession";
import * as input from "./input";
import { Server } from "./src/classes/serverBase";


// start the server with a given program and session
async function mk_server (cmd_line: input.Config): Promise<void> {

    let program: Program = input.getProgram(cmd_line);
    let session: Session = input.getSession(cmd_line);

    // a set of marker to store the references
    let markerDb: Marker[] = [];

    // loop over the programm and session to check if they fit together
    if (!checkSession(session, program, markerDb)) { return; }

    // initialize server
    const wss: Server = new Server(cmd_line);
    
    try {
        
        // start the server
        await wss.start();
        await wss.handleConnection();

    } catch (error) {
        console.error("Server failed: ", error);
    }

}

// get the session, program and port out of a file if the name is given
async function getConfig (file?: string, name?: string): Promise<void> {

    if (file && name) {
        const file_name: string = file;
        const string_name: string = name;

        const mod: input.Config = (await import(file_name))[string_name] as input.Config;
    
        mk_server(mod);
    }
    else {
        mk_server(input.mkConfig());
    }

}

getConfig(process.argv[2], process.argv[3]);