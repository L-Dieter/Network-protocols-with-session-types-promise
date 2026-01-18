import { Session } from "../../protocol";
import { Marker } from "../interfaces/marker";
import { getMarker } from "../reference/getMarker";
import { setMarker } from "../reference/setMarker";

// update the session
export function updateSession (session: Session, marker: Marker[], label?: string): [Session, Marker[]] {

    if (session.kind === "single") {
        session = session.cont;
    }
    else if (session.kind === "choice" && label) {
        session = session.alternatives[label];
    }
    else if (session.kind === "def") {
        setMarker(session.name, marker, session);
        session = session.cont;
    }
    else if (session.kind === "ref") {
        session = getMarker(session.name, marker).session;
    }

    // if a def or ref is called continue updating the session  
    while (session.kind === "def" || session.kind === "ref") {
        if (session.kind === "def") {
            setMarker(session.name, marker, session);
            session = session.cont;
        }
        else if (session.kind === "ref") {
            session = getMarker(session.name, marker).session;
        }
    }

    return [session, marker];

}
