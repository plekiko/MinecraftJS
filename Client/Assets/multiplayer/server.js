class Server {
    constructor(ip, port) {
        this.suppressCloseWarning = false;
        this.ws = new WebSocket(`ws://${ip}:${port}`);

        this.ws.onopen = () => {
            console.log("Connected to server!");

            this.send({
                type: "playerData",
                message: {
                    name: settings?.username || "Player",
                    skin: null,
                },
            });
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.ws.onclose = () => {
            if (
                this.suppressCloseWarning ||
                window.suppressServerCloseWarning
            ) {
                return;
            }

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

let multiplayerLeaveSyncSent = false;
window.suppressServerCloseWarning = false;

function buildMultiplayerLeaveSnapshot() {
    if (!player) return null;

    const inventoryPayload =
        player.inventory &&
        typeof player.inventory.serializeInventoryForMultiplayer === "function"
            ? player.inventory.serializeInventoryForMultiplayer()
            : [];

    return {
        position: {
            x: typeof player.position?.x === "number" ? player.position.x : 0,
            y: typeof player.position?.y === "number" ? player.position.y : 0,
        },
        dimension: typeof player.dimension === "number" ? player.dimension : 0,
        gamemode: typeof player.gamemode === "number" ? player.gamemode : 0,
        health: typeof player.health === "number" ? player.health : 20,
        food:
            typeof player.foodLevel === "number"
                ? player.foodLevel
                : typeof player.food === "number"
                ? player.food
                : 20,
        inventory: inventoryPayload,
    };
}

function sendMultiplayerLeaveSync(closeSocket = false) {
    if (!multiplayer || !server || !server.ws || !player) return;
    if (multiplayerLeaveSyncSent) return;

    window.suppressServerCloseWarning = true;
    server.suppressCloseWarning = true;

    if (server.ws.readyState !== WebSocket.OPEN) {
        multiplayerLeaveSyncSent = true;
        return;
    }

    const snapshot = buildMultiplayerLeaveSnapshot();
    if (!snapshot) return;

    multiplayerLeaveSyncSent = true;

    server.send({
        type: "playerUpdate",
        sender: player.UUID,
        message: {
            position: snapshot.position,
            gamemode: snapshot.gamemode,
            health: snapshot.health,
            food: snapshot.food,
        },
    });

    server.send({
        type: "playerInventory",
        sender: player.UUID,
        message: {
            inventory: snapshot.inventory,
        },
    });

    server.send({
        type: "playerSyncOnLeave",
        sender: player.UUID,
        message: snapshot,
    });

    if (closeSocket) {
        setTimeout(() => {
            if (server.ws.readyState === WebSocket.OPEN) {
                server.ws.close();
            }
        }, 60);
    }
}

window.sendMultiplayerLeaveSync = sendMultiplayerLeaveSync;

window.leaveGameToTitle = function () {
    if (!multiplayer) {
        if (typeof saveWorld === "function") saveWorld(false);
        window.location.href = "index.html";
        return;
    }

    window.suppressServerCloseWarning = true;
    if (server) server.suppressCloseWarning = true;

    sendMultiplayerLeaveSync(true);
    setTimeout(() => {
        window.location.href = "index.html";
    }, 120);
};

window.addEventListener("pagehide", () => {
    window.suppressServerCloseWarning = true;
    if (server) server.suppressCloseWarning = true;
    sendMultiplayerLeaveSync(true);
});

window.addEventListener("beforeunload", () => {
    window.suppressServerCloseWarning = true;
    if (server) server.suppressCloseWarning = true;
    sendMultiplayerLeaveSync(true);
});

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
