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
    if (!world.player) return null;

    const inventoryPayload =
        world.player.inventory &&
        typeof world.player.inventory.serializeInventoryForMultiplayer ===
            "function"
            ? world.player.inventory.serializeInventoryForMultiplayer()
            : [];

    return {
        position: {
            x:
                typeof world.player.position?.x === "number"
                    ? world.player.position.x
                    : 0,
            y:
                typeof world.player.position?.y === "number"
                    ? world.player.position.y
                    : 0,
        },
        dimension:
            typeof world.player.dimension === "number"
                ? world.player.dimension
                : 0,
        gamemode:
            typeof world.player.gamemode === "number"
                ? world.player.gamemode
                : 0,
        health:
            typeof world.player.health === "number" ? world.player.health : 20,
        food:
            typeof world.player.foodLevel === "number"
                ? world.player.foodLevel
                : typeof world.player.food === "number"
                  ? world.player.food
                  : 20,
        inventory: inventoryPayload,
    };
}

function sendMultiplayerLeaveSync(closeSocket = false) {
    if (!multiplayer || !server || !server.ws || !world.player) return;
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
        sender: world.player.UUID,
        message: {
            position: snapshot.position,
            gamemode: snapshot.gamemode,
            health: snapshot.health,
            food: snapshot.food,
        },
    });

    server.send({
        type: "playerInventory",
        sender: world.player.UUID,
        message: {
            inventory: snapshot.inventory,
        },
    });

    server.send({
        type: "playerSyncOnLeave",
        sender: world.player.UUID,
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
