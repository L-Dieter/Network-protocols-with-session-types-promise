import assert from "assert";
import { Channel } from "../../classes/channel";
import WebSocket, { WebSocketServer } from "ws";
import { Session } from "../../../protocol";



// -------------- TEST SESSIONS ----------------

const recvTest: Session = {
    kind: "single", dir: "recv", payload: { type: "number" }, cont: {
        kind: "end"
    }
}
const sendTest: Session = {
    kind: "single", dir: "send", payload: { type: "number" }, cont: {
        kind: "end"
    }
}
const selectTest: Session = {
    kind: "choice", dir: "send", alternatives: {
        close: { kind: "end" }
    }
}
const chooseTest: Session = {
    kind: "choice", dir: "recv", alternatives: {
        close: { kind: "end" }
    }
}

// -------------- TEST SESSIONS ----------------

class ChannelTest extends Channel {
    socket = null;
    session: Session;
    constructor () {
        super();
        this.session = { kind: "end" };
    }
}

class ServerTest extends Channel {
    session: Session;
    socket: WebSocket | null = null;
    private server: WebSocketServer;
    constructor () {
        super();
        this.session = { kind: "end" };

        this.server = new WebSocketServer({port: 3000});
        this.init();

    }

    private init () : void {
        this.server.on('connection', (ws) => {
            this.socket = ws;

            this.socket.on('message', (msg: any) => {
                this.messages.push(msg);
            });
        });
    }

    async close () : Promise<void> {
        this.server.close();
    }
}

class ClientTest extends Channel {
    session: Session;
    socket: WebSocket;
    constructor () {
        super();
        this.session = { kind: "end" };
        this.socket = new WebSocket("ws://localhost:3000");

        this.init()
    }

    private init () : void {
        this.socket?.on('message', (msg: any) => {
            this.messages.push(msg);
        })
    }
}

describe("Channel", function () {
    // create a new channel
    const channel: ChannelTest = new ChannelTest();

    // open a connection to test sending messages
    const server: ServerTest = new ServerTest();
    const client: ClientTest = new ClientTest();

    describe("#receive()", function () {
        // case any
        it("should return *ok*, type: any", async function () {
            channel.messages.push(JSON.stringify("ok"));
            recvTest.payload = { type: "any" };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.strictEqual(r, "ok");
        })
        // case string
        it("should return *test*, type: string", async function () {
            channel.messages.push(JSON.stringify("test"));
            recvTest.payload = { type: "string" };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.strictEqual(r, "test");
        })
        // case number
        it("should return *1*, type: number", async function () {
            channel.messages.push(JSON.stringify(1));
            recvTest.payload = { type: "number" };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.strictEqual(r, 1);
        })
        // case bool
        it("should return *true*, type: bool", async function () {
            channel.messages.push(JSON.stringify(true));
            recvTest.payload = { type: "bool" };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.strictEqual(r, true);
        })
        // case null
        it("should return *null*, type: null", async function () {
            channel.messages.push(JSON.stringify(null));
            recvTest.payload = { type: "null" };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.strictEqual(r, null);
        })
        // case union
        it("should return *42*, type: union", async function () {
            channel.messages.push(JSON.stringify(42));
            recvTest.payload = { type: "union", components: [{ type: "string" }, { type: "number" }] };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.strictEqual(r, 42);
        })
        // case record
        it("should return *{ 'isChannel': true }*, type: record", async function () {
            channel.messages.push(JSON.stringify({ "isChannel": true }));
            recvTest.payload = { type: "record", payload: { "isChannel": { type: "bool" }} };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.deepEqual(r, { "isChannel": true });
        })
        // case tuple
        it("should return *['test', true, 1, 2, 3]*, type: tuple", async function () {
            channel.messages.push(JSON.stringify(["test", true, 1, 2, 3]));
            recvTest.payload = { type: "tuple", payload: [{ type: "string" }, { type: "bool" }, { type: "number" }, { type: "number" }, { type: "number" }] };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.deepEqual(r, ["test", true, 1, 2, 3]);
        })
        // case array
        it("should return *['this', 'is', 'a', 'test']*, type: array", async function () {
            channel.messages.push(JSON.stringify(["this", "is", "a", "test"]));
            recvTest.payload = { type: "array", payload: { type: "string" } };
            channel.session = recvTest;
            const r: string = await channel.receive();
            assert.deepEqual(r, ["this", "is", "a", "test"]);
        })
    })
    describe("#send()", function () {
        it("should send *'toServer'*, client -> server", async function () {
            sendTest.payload = { type: "string" };
            client.session = sendTest;
            client.send("toServer");
            recvTest.payload = { type: "string" };
            server.session = recvTest;
            const r: any = await server.receive();
            assert.strictEqual(r, "toServer");
        })
        it("should send *'toClient'*, server -> client", async function () {
            server.session = sendTest;
            server.send("toClient");
            client.session = recvTest;
            const r: any = await client.receive();
            assert.strictEqual(r, "toClient");
        })
    })
    describe("#select()", function () {
        it("should return *'close'*, server.select()", async function () {
            server.session = selectTest;
            client.session = recvTest;
            await server.select("close");
            const r: any = await client.receive();
            assert.strictEqual(r, "close");
        })
        it("should return *'close'*, client.select()", async function () {
            client.session = selectTest;
            server.session = recvTest;
            await client.select("close");
            const r: any = await server.receive();
            assert.strictEqual(r, "close");
        })
    })
    describe("#choice()", function () {
        it("should return *42*, input label 'Test'", async function () {
            channel.messages.push(JSON.stringify("Test"));
            chooseTest.alternatives["Test"] = { kind: "end" };
            channel.session = chooseTest;
            const r: any = await channel.choice({"Test": () => { return 42 }});
            assert.strictEqual(r, 42);
        })
    })
    describe("#close()", function () {
        it("should close the connection to the server, client.close()", async function () {
            client.session = { kind: "end" };
            await client.close();
            assert.strictEqual(client.socket?.readyState, client.socket?.CLOSING);
        })
        it("should close the server, server.close()", async function () {
            server.session = { kind: "end" };
            server.close();
            assert.strictEqual(server.socket?.readyState, server.socket?.CLOSED);
        })
    })
});
