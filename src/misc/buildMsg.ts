import { Session } from "../../protocol"

// create a request to send to the client
export function buildRequest (requestId: number, session: Session): string {

    let requestMessage: Record<string, number | string> = {"id": 0, "type": "default"};

    if (session.kind === "single") {
        requestMessage.id = requestId;
        requestMessage.type = session.payload.type;
    }
    else if (session.kind === "choice") {
        requestMessage.id = requestId;
        requestMessage.type = `Label:${Object.keys(session.alternatives)}`;
    }

    return JSON.stringify(requestMessage);
}