// usage: change the default values with a json

import { Session } from "./protocol";

const defaultSession: Session = { kind: 'end' };
const defaultPort: number = 3000;

export const defaultConfig = {
    session: defaultSession,
    port: defaultPort
};
export type Config = {
    session: Session,
    port: number
};
export function mkConfig(
    session: Session = defaultSession,
    port: number = defaultPort
): Config {
    return { session, port };
}
export function getSession(config: Config): Session {
    return config.session;
}
export function getPort(config: Config): number {
    return config.port;
}
