import * as readline from 'readline';

// handle the incoming message on the client
export function processClientMessage (data: any, rl: readline.Interface): Promise<string> {

    return new Promise((resolve) => {
        let request: { requestId: string, type: string } = { requestId: "", type: "" };
    
        let msg: any = JSON.parse(data);
        let info: string = "";
        let response: string = "";

        // check for requestId
        if (msg === null || !msg.id) {
            console.log(`Received a message from the server:\n ${msg}`);
        }
        else {
            request.requestId = msg.id;
            request.type = msg.type;
   
            if (request.type.split(":")[0] === "Label") {
                info = `Label of type '${request.type.split(":")[1]}' required: `;
            }
            else {
                info = `Input of type '${(request.type).toUpperCase()}' required: `;
            }

            rl.question(info, (msg: string) => {
    
                response = JSON.stringify({"id": request.requestId, "message": msg});
                resolve(response)
                
            });
        }
        
    });

}