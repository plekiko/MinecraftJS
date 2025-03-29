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
            processMessage(data); // Process the message using the imported function
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
            console.log("WebSocket connection is not open");
        }
    }

    entityRPC(UUID, method, args) {
        this.send({
            type: "entityRPC",
            sender: UUID,
            message: { method: method, args: args ? args : [] },
        });
    }
}

if (multiplayer) {
    const ip = localStorage.getItem("multiplayerIP");
    const port = localStorage.getItem("multiplayerPort");

    if (!ip || !port) {
        alert(
            "You must set the multiplayer IP and port in the menu before joining a server!"
        );
        window.location.href = "./";
    }

    server = new Server(ip, port);
}
