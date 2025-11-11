// Starts a WebSocket client and connects to a server

import { getHelpText } from "./src/misc/helpText";
import { Client } from "./src/classes/clientBase";

// create a new client
async function mk_client (cmd_line: string[]): Promise<void> {

    // check if the initial amount of arguments is correct
    if (cmd_line.length === 2) {
        console.log(getHelpText());
        return;
    }
    else if (cmd_line.length !== 3) {
        console.error("Invalid parameter. Check your input!");
        return;
    }

    // the url to connect to the server
    const url: string = cmd_line[2];

    // initialize client
    const client: Client = new Client(url);

    try {

        // open a connection with a server
        await client.connect();

        // wait for messages
        client.handleMessage();

    } catch (error) {
        console.error(error);
    }

}

mk_client(process.argv);