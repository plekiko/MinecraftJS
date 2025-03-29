class Server {
    constructor(ip, port) {
        this.ws = new WebSocket(`ws://${ip}:${port}`);

        this.ws.onopen = () => {
            console.log("Connected to server!");
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.ws.onclose = () => {
            alert("Could not connect to the server!");
            window.location.href = "./"; // Redirect to home if connection fails
        };

        // Handle incoming messages
        this.ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            processMessage(data);
        };
    }

    send({ type = "message", message, sender = null }) {
        const constructedMessage = JSON.stringify({
            type: type,
            message: message,
            sender: sender,
        });

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(constructedMessage);
        } else {
            // console.log("WebSocket connection is not open");
        }
    }

    async get({ type, message, sender }) {
        if (!this.ws.readyState === WebSocket.OPEN) return null;
        return new Promise((resolve, reject) => {
            const requestId = uuidv4(); // Generate a unique requestId
            const timeout = 5000;

            callbacks[requestId] = resolve;

            this.send({
                type: type,
                message: { data: message, requestId },
                sender: sender,
            });

            // Timeout handling if the request doesn't get a response in time
            setTimeout(() => {
                if (callbacks[requestId]) {
                    reject(new Error(`Request ${requestId} timed out`));
                    delete callbacks[requestId]; // Clean up callback
                }
            }, timeout);
        });
    }

    entityRPC(data) {
        const entity = getEntityByUUID(data.sender);
        if (entity && typeof entity[data.message.method] === "function") {
            entity[data.message.method](data.message);
        }
    }
}

if (multiplayer) {
    const ip = localStorage.getItem("multiplayerIP");
    const port = localStorage.getItem("multiplayerPort");

    if (ip && port) {
        server = new Server(ip, port);
    } else {
        alert("Multiplayer server IP and port not set!");
        window.location.href = "./"; // Redirect to home if no server is set
    }
}
