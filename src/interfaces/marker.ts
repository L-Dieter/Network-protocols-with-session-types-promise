import { Session } from "../../protocol";

// the interface to store a reference for session together with a name
export interface Marker {
    name: string,
    session: Session
}
