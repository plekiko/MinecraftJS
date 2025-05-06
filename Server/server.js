import { uuidv4, Vector2, RandomRange } from "./Classes/helper.js";
import { Player } from "./Classes/player.js";
import { WebSocketServer } from "ws";
import { World } from "./Classes/world.js";
import { createInterface } from "readline";
import fs from "fs";

const propertiesFile = "server.properties";
const iconPaths = [
    { path: "server-icon.png", mime: "image/png" },
    { path: "server-icon.gif", mime: "image/gif" },
];
const maxIconSize = 1 * 1024 * 1024; // 1 MB

let serverIcon = null;

const properties = {};

const defaultProperties = {
    serverIp: "",
    levelSeed: "",
    gamemode: 0,
    serverPort: 25565,
    allowNether: true,
    levelName: "world",
    motd: "A Minecraft Server",
    maxPlayers: 20,
};

const world = new World();

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

function loadProperties() {
    if (!fs.existsSync(propertiesFile)) {
        fs.writeFileSync(
            propertiesFile,
            Object.entries(defaultProperties)
                .map(([key, value]) => `${key}=${value}`)
                .join("\n")
        );
    }
    const data = fs.readFileSync(propertiesFile, "utf8");
    const lines = data.split("\n");
    for (const line of lines) {
        const [key, value] = line.split("=");
        if (key && value) {
            properties[key.trim()] = value.trim();
        }
    }
    for (const key in defaultProperties) {
        if (!properties[key]) {
            properties[key] = defaultProperties[key];
        }
    }
    properties.serverPort = parseInt(properties.serverPort);
    properties.gamemode = parseInt(properties.gamemode);
    properties.allowNether = properties.allowNether === "true";
    properties.maxPlayers = parseInt(properties.maxPlayers);
    properties.levelSeed = properties.levelSeed.trim();
    if (properties.levelSeed === "") {
        properties.levelSeed = Math.floor(
            RandomRange(-100000000, 100000000)
        ).toString();
    }

    properties.motd = parseMotd(properties.motd);
    properties.serverIp = properties.serverIp.trim() || "localhost";

    world.seed = properties.levelSeed;

    serverIcon = loadServerIcon();
}

function beforeInit() {
    console.log("Welcome to the Minecraft JS server panel!");
    loadProperties();
    console.log(
        `Server started at "${properties.serverIp}:${properties.serverPort}". Press Ctrl+C to stop the server.`
    );
}

function parseMotd(motd) {
    const validCodes = /[§][0-9a-fklmnor]/gi;
    motd = motd.replace(/§[^0-9a-fklmnor]/gi, "");
    return motd.substring(0, 50); // Limit to 50 characters
}

beforeInit();

// Create a WebSocket server
const wss = new WebSocketServer({ port: properties.serverPort });

let players = [];

wss.on("connection", (ws) => {
    // Set a timeout to close the connection if no initial message is received
    const connectionTimeout = setTimeout(() => {
        ws.close();
    }, 5000);

    ws.on("message", (message) => {
        clearTimeout(connectionTimeout); // Clear timeout once a message is received
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            ws.close();
            return;
        }

        // Handle the first message to determine connection type
        if (!players.some((p) => p.ws === ws)) {
            if (data.type === "status") {
                // Handle status request without creating a player
                ws.send(
                    JSON.stringify({
                        type: "statusResponse",
                        message: {
                            motd: properties.motd,
                            maxPlayers: properties.maxPlayers,
                            onlinePlayers: players.length,
                            version: "Minecraft JS 1.0",
                            icon: serverIcon,
                            requestId: data.message?.requestId || null,
                        },
                    })
                );
                return;
            } else {
                // Check for max players
                if (players.length >= properties.maxPlayers) {
                    ws.send(
                        JSON.stringify({
                            type: "serverFull",
                            message: "Server is full.",
                        })
                    );
                    ws.close();
                    return;
                }

                // Create a player for this connection
                playerJoined(ws, data.message);
            }
        }

        // Process subsequent messages as normal
        processMessage(message, ws);
    });

    ws.on("close", () => {
        clearTimeout(connectionTimeout);
        const player = players.find((p) => p.ws === ws);
        if (player) {
            playerLeft(player);
        }
    });
});

function broadcast(data, exclude = []) {
    players.forEach((player) => {
        if (!exclude.includes(player.UUID)) {
            const message = JSON.stringify(data);
            player.ws.send(message);
        }
    });
}

function sendToPlayer(UUID, data) {
    const player = players.find((p) => p.UUID === UUID);
    if (player) {
        const message = JSON.stringify(data);
        player.ws.send(message);
    }
}

function playerJoined(ws, playerData) {
    const newPlayer = new Player({
        UUID: uuidv4(),
        name: playerData?.name || `Player ${players.length + 1}`,
        ws: ws,
        skin: playerData?.skin || null,
    });

    players.push(newPlayer);

    sendToPlayer(newPlayer.UUID, {
        type: "youJoined",
        message: {
            player: newPlayer,
            existingPlayers: players.filter((p) => p.UUID !== newPlayer.UUID),
            gamemode: properties.gamemode,
        },
    });

    sendToPlayer(newPlayer.UUID, {
        type: "seed",
        message: world.seed,
    });

    broadcast(
        {
            type: "playerJoined",
            message: { player: newPlayer },
        },
        [newPlayer.UUID]
    );
}

function playerLeft(player) {
    if (!player) return;
    players = players.filter((p) => p.UUID !== player.UUID);
    console.log(player.name + " left the game!");
    broadcast({
        type: "playerLeft",
        message: player.UUID,
    });
}

function loadServerIcon() {
    // Find the first existing icon file
    for (const { path, mime } of iconPaths) {
        if (fs.existsSync(path)) {
            try {
                // Get file stats to check size before reading
                const stats = fs.statSync(path);
                if (stats.size > maxIconSize) {
                    console.error(
                        `Server icon ${path} exceeds maximum size of ${
                            maxIconSize / (1024 * 1024)
                        } MB (actual size: ${(
                            stats.size /
                            (1024 * 1024)
                        ).toFixed(2)} MB)`
                    );
                    continue; // Skip to next file
                }

                // Read the icon file
                const iconBuffer = fs.readFileSync(path);
                // Convert to base64
                const base64Icon = iconBuffer.toString("base64");
                // Verify base64 string is non-empty
                if (!base64Icon) {
                    console.error(`Empty base64 data for server icon ${path}`);
                    continue;
                }
                return `data:${mime};base64,${base64Icon}`;
            } catch (error) {
                console.error(
                    `Error loading server icon ${path}:`,
                    error.message
                );
                continue;
            }
        }
    }
    return null;
}

function processMessage(message, ws) {
    let data;
    try {
        data = JSON.parse(message);
    } catch (e) {
        return;
    }

    switch (data.type) {
        case "playerUpdate":
            broadcast(data, [data.sender]);
            break;

        case "playerData": {
            const player = getPlayerByUUID(data.message.UUID);
            if (player) {
                player.skin = data.message.skin;
                player.name = data.message.name;
                broadcast(data, [data.sender]);

                console.log(player.name + " joined the game!");
            }
            break;
        }

        case "chat": {
            const player = getPlayerByUUID(data.sender);
            console.log(player.name + ": " + data.message);
            broadcast(
                {
                    type: "chat",
                    message: data.message,
                    sender: player.name,
                },
                [data.sender]
            );
            break;
        }

        case "entityRPC":
            broadcast(data, [data.sender]);
            break;

        case "getChunk":
            const chunk = world
                .getDimension(data.message.data.dimensionIndex)
                .getChunk(data.message.data.x);
            ws.send(
                JSON.stringify({
                    type: "response",
                    message: {
                        chunk: chunk,
                        requestId: data.message.requestId,
                    },
                })
            );
            break;

        case "getSeed":
            ws.send(
                JSON.stringify({
                    type: "response",
                    message: {
                        seed: world.seed,
                        requestId: data.message.requestId,
                    },
                })
            );
            break;

        case "uploadChunk":
            world
                .getDimension(data.message.dimensionIndex)
                .uploadChunk(data.message.chunk, data.message.x);
            break;

        case "placeBlock":
            broadcast(data, [data.sender]);
            break;

        case "breakBlock":
            broadcast(data, [data.sender]);
            break;

        case "playerDimension": {
            const player = getPlayerByUUID(data.message.player);
            if (player) {
                player.dimension = data.message.dimension;
                broadcast(data, [data.sender]);
            }
            break;
        }

        default:
            broadcast(data, [data.sender]);
            break;
    }
}

function getPlayerByUUID(UUID) {
    return players.find((player) => player.UUID === UUID);
}
