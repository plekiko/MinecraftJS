import { runtime } from "../utils/runtime.js";
import { callbacks, processMessage } from "./messageHandler.js";
import { uuidv4 } from "../utils/classes.js";
import { multiplayer } from "../utils/globals.js";
import { saveWorld } from "../world/saving.js";

export function getMultiplayerUsername() {
    const fallback = "Player";

    if (typeof runtime.game !== "undefined" && runtime.game?.settings?.username) {
        return runtime.game.settings.username;
    }

    try {
        const stored = JSON.parse(localStorage.getItem("settings") || "{}");
        if (stored && typeof stored.username === "string") {
            const trimmed = stored.username.trim();
            if (trimmed) return trimmed;
        }
    } catch (error) {
        console.warn("Failed to load multiplayer username:", error);
    }

    return fallback;
}

export class Server {
    constructor(ip, port) {
        this.suppressCloseWarning = false;
        this.ws = new WebSocket(`ws://${ip}:${port}`);

        this.ws.onopen = () => {
            console.log("Connected to server!");

            this.send({
                type: "playerData",
                message: {
                    name: getMultiplayerUsername(),
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
        const entity = runtime.world?.getEntityByUUID(data.sender);
        if (entity && typeof entity[data.message.method] === "function") {
            entity[data.message.method](data.message);
        }
    }
}

export let multiplayerLeaveSyncSent = false;
window.suppressServerCloseWarning = false;

export function buildMultiplayerLeaveSnapshot() {
    if (!runtime.world.player) return null;

    const inventoryPayload =
        runtime.world.player.inventory &&
        typeof runtime.world.player.inventory.serializeInventoryForMultiplayer ===
            "function"
            ? runtime.world.player.inventory.serializeInventoryForMultiplayer()
            : [];

    return {
        position: {
            x:
                typeof runtime.world.player.position?.x === "number"
                    ? runtime.world.player.position.x
                    : 0,
            y:
                typeof runtime.world.player.position?.y === "number"
                    ? runtime.world.player.position.y
                    : 0,
        },
        dimension:
            typeof runtime.world.player.dimension === "number"
                ? runtime.world.player.dimension
                : 0,
        gamemode:
            typeof runtime.world.player.gamemode === "number"
                ? runtime.world.player.gamemode
                : 0,
        health:
            typeof runtime.world.player.health === "number" ? runtime.world.player.health : 20,
        food:
            typeof runtime.world.player.foodLevel === "number"
                ? runtime.world.player.foodLevel
                : typeof runtime.world.player.food === "number"
                  ? runtime.world.player.food
                  : 20,
        inventory: inventoryPayload,
    };
}

export function sendMultiplayerLeaveSync(closeSocket = false) {
    if (!multiplayer || !runtime.server || !runtime.server.ws || !runtime.world.player) return;
    if (multiplayerLeaveSyncSent) return;

    window.suppressServerCloseWarning = true;
    runtime.server.suppressCloseWarning = true;

    if (runtime.server.ws.readyState !== WebSocket.OPEN) {
        multiplayerLeaveSyncSent = true;
        return;
    }

    const snapshot = buildMultiplayerLeaveSnapshot();
    if (!snapshot) return;

    multiplayerLeaveSyncSent = true;

    runtime.server.send({
        type: "playerUpdate",
        sender: runtime.world.player.UUID,
        message: {
            position: snapshot.position,
            gamemode: snapshot.gamemode,
            health: snapshot.health,
            food: snapshot.food,
        },
    });

    runtime.server.send({
        type: "playerInventory",
        sender: runtime.world.player.UUID,
        message: {
            inventory: snapshot.inventory,
        },
    });

    runtime.server.send({
        type: "playerSyncOnLeave",
        sender: runtime.world.player.UUID,
        message: snapshot,
    });

    if (closeSocket) {
        setTimeout(() => {
            if (runtime.server.ws.readyState === WebSocket.OPEN) {
                runtime.server.ws.close();
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
    if (runtime.server) runtime.server.suppressCloseWarning = true;

    sendMultiplayerLeaveSync(true);
    setTimeout(() => {
        window.location.href = "index.html";
    }, 120);
};

window.addEventListener("pagehide", () => {
    window.suppressServerCloseWarning = true;
    if (runtime.server) runtime.server.suppressCloseWarning = true;
    sendMultiplayerLeaveSync(true);
});

window.addEventListener("beforeunload", () => {
    window.suppressServerCloseWarning = true;
    if (runtime.server) runtime.server.suppressCloseWarning = true;
    sendMultiplayerLeaveSync(true);
});

if (multiplayer) {
    const ip = localStorage.getItem("multiplayerIP");
    const port = localStorage.getItem("multiplayerPort");

    if (ip && port) {
        runtime.server = new Server(ip, port);
    } else {
        alert("Multiplayer server IP and port not set!");
        window.location.href = "./"; // Redirect to home if no server is set
    }
}
