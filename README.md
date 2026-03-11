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
Every method is build asynchronous so they have to be called with await.

**2.) How to create a server:**<br/>

To create your own server class it is important to extend the class named *Server*. Because of that the constructor takes two arguments. The first one is the session and the second one the socket of the client. Both will be used for creating a new intance of a server-side channel. Inside the constructor they are also used to call super() properly.<br/>
Every method inside the class (except start()) has to be an asynchronous arrow function to avoid problems using *this*.<br/>

e.g.:

```
class SummationServer extends Server {
    sum: number;
    constructor(session: Session, socket: WebSocket) {
        super(session, socket);
		this.sum = 0;
	  }

	doNext = async () : Promise<boolean> => {
		let x = await this.receive();
		this.sum += x;
		return true;
	}

	async start() : Promise<voide> { ... }
}
```

**3.) How to start the server:**<br/>

The *ServerConnection* class will be used to handle the connection.

e.g.:
```
new ServerConnection(config, SummationServer)
```

This opens a new connection on the server with the given session and port as a config.<br/>
The server will be accessible after a short delay.<br/>
If a client connects to the server it will create a new channel to process the session.<br/>
The type of a server provides the functionality.<br/>

**4.) How to create a client:**<br/>

The client is the dual of a server. Every method or session needs to be exactly the opposite like *send <-> receive*.<br/>
To create a new class for a client it needs to be extended from the class *Client*. This provides the methods of the channel.<br/>
There are no arguments in the constructor by default. The only thing that is required is to call super() with the configuration of the client.<br/>
The PORT has to be the same as the one used by the server to open a connection.<br/>

e.g.:

```
export class SummationClient extends Client {
    numbers: number[];
    sum: number;
    constructor(numbers: number[]) {
        super(configSumClient);
        this.numbers = numbers;
        this.sum = 0;
    }

	anyMethod = async () : Promise<any> => { ... }
}
```

**5.) How to start the client:**<br/>

e.g:

```
const sumClient: SummationClient = new SummationClient([1, 2, 3, 4, 5, 6, 7, 8, 9]);
await sumClient.waitForConnection();
```

By creating a new instance of a specific client, he tries to connect to the server. To be sure when it is connected we use the *.waitForConnection()* method. This is required to initialize the important stuff like the session after the connection. If this would not be called, there is a chance to run the session before the client is even connected, which leads to mistakes.<br/>

**6.) How to start the unit tests:**<br/>

```
npm test
```
