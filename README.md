# Network-protocols-with-session-types-promise

A TypeScript implementation of Session Types based on promises.

**Start by installing the dependencies**

```
npm install
```

**Usage:**

Change 'input.ts' to use the desired session and port on the server or create a config with a session and port.<br/>
With the default settings the server will close the connection immediately after the client connects because the session terminates.<br/>

**1.) How to create a session:**<br/>

To create a session that fits the functionality of a program there are some rules to follow:

```
single: send ---> send()
single: recv ---> receive()
choice: send ---> select()
choice: recv ---> choice()
end          ---> close()

def          ---> can be used at any time
ref          ---> only after def with the same name
```

**2.) How to create a server:**<br/>


```
e.g.:

class SummationServer extends Server {
    sum: number;
    constructor(session: Session, socket: WebSocket) {
        super(session, socket);
		this.sum = 0;
	  }
}
```

**3.) How to start the server:**<br/>

```
e.g. new ServerConnection(config, SummationServer)
```

Opens a new connection on the server with the given session and port given by the config.<br/>
The server will be accessible after a short delay.<br/>
If a client connects to the server it will create a new channel to process the session.<br/>

**4.) How to create a client:**<br/>

```
e.g. class SummationClient extends Client {...}
```

**5.) How to start the client:**<br/>

```
e.g. new SummationClient([1, 2, 3, 4, 5, 6, 7, 8, 9])
```

The client tries to connect to the server with the given PORT. The PORT has to be the same as the one used to start the server.<br/>
If the connection is successful, the server starts the session and communicates with the client.

**6.) How to start the unit tests:**<br/>

***Test 1***:
```
Option 1: <PATH> npx tsx server.ts ./src/testsuite/test1.ts test1
```
```
Option 2: <PATH> npm run test1
```

***Test 2***:
```
Option 1: <PATH> npx tsx server.ts ./src/testsuite/test2.ts test2
```
```
Option 2: <PATH> npm run test2
```

This will open a connection to the server with a session, program and port which is given by the respective file.<br/>

```
<PATH> npx tsx client.ts ws://localhost:3000
```

*(Option 1 only)*: Afterwards connect the client to the server and the session will be processed.

Zunächst muss jedoch wieder eine Unterklasse angelegt werden, die diesmal den clientseitigen Channel erweitert. Der Konstruktor enthält standardmäßig keine Parameter. An die Superklasse muss jedoch die Session und ein Port übergeben werden, da sonst weder eine Verbindung stattfinden kann, noch ein Protokoll festgelegt ist. Abseits davon folgt die Session denselben Regeln wie oben beschrieben.<br/>

Die Funktionalität ist dabei wieder frei gestaltbar, sofern alle wichtigen Operationen zu denen eines Servers passen.
