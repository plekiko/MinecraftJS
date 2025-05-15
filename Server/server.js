import { uuidv4, Vector2, RandomRange } from "./Classes/helper.js";
import { Player } from "./Classes/player.js";
import { WebSocketServer } from "ws";
import { World } from "./Classes/world.js";
import { createInterface } from "readline";
import fs from "fs";

const propertiesFile = "server.properties";
const userCacheFile = "usercache.json";
const bannedIPsFile = "banned-ips.json";
const iconPaths = [
    { path: "server-icon.png", mime: "image/png" },
    { path: "server-icon.gif", mime: "image/gif" },
];
const maxIconSize = 1 * 1024 * 1024; // 1 MB

let serverIcon = null;
let userCache = [];
let bannedIPs = [];
let players = [];

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

function loadUserCache() {
    try {
        if (fs.existsSync(userCacheFile)) {
            const stats = fs.statSync(userCacheFile);
            if (stats.isDirectory()) {
                console.error(
                    `Error: ${userCacheFile} is a directory, expected a file.`
                );
                userCache = [];
                return;
            }
            const fileContent = fs.readFileSync(userCacheFile, "utf8");
            if (!fileContent) {
                console.error(`Error: ${userCacheFile} is empty.`);
                userCache = [];
                return;
            }
            userCache = JSON.parse(fileContent);
            if (!Array.isArray(userCache)) {
                console.error(
                    `Error: ${userCacheFile} contains invalid data, expected an array.`
                );
                userCache = [];
            }
        } else {
            serverLog(
                `No user cache found at ${userCacheFile}. Initializing empty cache.`
            );
            userCache = [];
            saveUserCache();
        }
    } catch (error) {
        console.error(
            `Error loading user cache from ${userCacheFile}: ${error.message}`
        );
        userCache = [];
    }
}

function saveUserCache() {
    try {
        fs.writeFileSync(userCacheFile, JSON.stringify(userCache, null, 2));
    } catch (error) {
        console.error(
            `Error saving user cache to ${userCacheFile}: ${error.message}`
        );
    }
}

function updateUserCache(username, ip) {
    userCache = userCache.filter((entry) => entry.ip !== ip);
    userCache.push({ username, ip });
    saveUserCache();
}

function loadBannedIPs() {
    try {
        if (fs.existsSync(bannedIPsFile)) {
            const stats = fs.statSync(bannedIPsFile);
            if (stats.isDirectory()) {
                console.error(
                    `Error: ${bannedIPsFile} is a directory, expected a file.`
                );
                bannedIPs = [];
                return;
            }
            const fileContent = fs.readFileSync(bannedIPsFile, "utf8");
            if (!fileContent) {
                console.error(`Error: ${bannedIPsFile} is empty.`);
                bannedIPs = [];
                return;
            }
            bannedIPs = JSON.parse(fileContent);
            if (!Array.isArray(bannedIPs)) {
                console.error(
                    `Error: ${bannedIPsFile} contains invalid data, expected an array.`
                );
                bannedIPs = [];
            }
        } else {
            serverLog(
                `No banned IPs found at ${bannedIPsFile}. Initializing empty list.`
            );
            bannedIPs = [];
            fs.writeFileSync(bannedIPsFile, JSON.stringify(bannedIPs, null, 2));
        }
    } catch (error) {
        console.error(
            `Error loading banned IPs from ${bannedIPsFile}: ${error.message}`
        );
        bannedIPs = [];
    }
}

function beforeInit() {
    serverLog("Welcome to the Minecraft JS server panel!");
    loadProperties();
    loadUserCache();
    loadBannedIPs();
    if (loadWorldFromDir()) {
        serverLog("World loaded successfully!");
    } else {
        serverLog("No world save found. Creating a new world!");
    }
    serverLog(
        `Server started at "${properties.serverIp}:${properties.serverPort}". Press Ctrl+C to stop the server.`
    );

    setInterval(() => {
        if (players.length > 0) saveWorldToDir();
    }, 1000);
}

function parseMotd(motd) {
    const validCodes = /[§][0-9a-fklmnor]/gi;
    motd = motd.replace(/§[^0-9a-fklmnor]/gi, "");
    return motd.substring(0, 50); // Limit to 50 characters
}

beforeInit();

const wss = new WebSocketServer({ port: properties.serverPort });

wss.on("connection", (ws) => {
    const connectionTimeout = setTimeout(() => {
        ws.close();
    }, 5000);

    ws.on("message", (message) => {
        clearTimeout(connectionTimeout);
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            ws.close();
            return;
        }

        if (!players.some((p) => p.ws === ws)) {
            if (data.type === "status") {
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

                playerJoined(ws, data.message);
            }
        }

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

function getSafeIp(ip) {
    // Sanitize IP address for use as a filename (replace : with _ for IPv6)
    return ip.replace(/[^0-9a-fA-F.]/g, "_");
}

function savePlayerData(player, ip) {
    if (!player || !ip || !player.position || !player.inventory) {
        serverLog(`Cannot save player data: Invalid player object or IP`);
        return;
    }

    const playerDir = `./${properties.levelName}/players`;
    const safeIp = getSafeIp(ip);
    const playerFile = `${playerDir}/${safeIp}.json`;
    try {
        fs.mkdirSync(playerDir, { recursive: true });
        const playerData = {
            position: {
                x: player.position.x || 0,
                y: player.position.y || 0,
            },
            health: player.health || 20,
            food: player.food || 20,
            dimension: player.dimension || 0,
            inventory: Array.isArray(player.inventory?.items)
                ? player.inventory.map((row) =>
                      Array.isArray(row)
                          ? row.map((item) => ({
                                blockId: item?.blockId || null,
                                itemId: item?.itemId || null,
                                count: item?.count || 0,
                                props: item?.props || {},
                            }))
                          : []
                  )
                : [],
            gamemode:
                player.gamemode !== undefined
                    ? player.gamemode
                    : properties.gamemode,
        };
        fs.writeFileSync(playerFile, JSON.stringify(playerData, null, 2));
        // serverLog(`Saved player data for ${player.name} to ${playerFile}`);
    } catch (error) {
        console.error(
            `Error saving player data for ${player.name} to ${playerFile}: ${error.message}`
        );
    }
}

function loadPlayerData(player, ip) {
    if (!player || !ip) {
        serverLog(`Cannot load player data: Invalid player object or IP`);
        return;
    }

    const playerDir = `./${properties.levelName}/players`;
    const safeIp = getSafeIp(ip);
    const playerFile = `${playerDir}/${safeIp}.json`;
    try {
        if (fs.existsSync(playerFile)) {
            const stats = fs.statSync(playerFile);
            if (stats.isDirectory()) {
                console.error(
                    `Error: ${playerFile} is a directory, expected a file.`
                );
                return;
            }
            const fileContent = fs.readFileSync(playerFile, "utf8");
            if (!fileContent) {
                console.error(`Error: ${playerFile} is empty.`);
                return;
            }
            const playerData = JSON.parse(fileContent);

            // Load position
            if (
                playerData.position &&
                typeof playerData.position.x === "number" &&
                typeof playerData.position.y === "number"
            ) {
                player.position = new Vector2(
                    playerData.position.x,
                    playerData.position.y
                );
            } else {
                player.position = new Vector2(0, 0);
            }

            // Load inventory
            if (Array.isArray(playerData.inventory)) {
                player.inventory = player.inventory || [[]];
                player.inventory = playerData.inventory.map((row) =>
                    Array.isArray(row)
                        ? row.map((item) => ({
                              blockId: item?.blockId || null,
                              itemId: item?.itemId || null,
                              count: item?.count || 0,
                              props: item?.props || {},
                          }))
                        : []
                );
            } else {
                player.inventory = player.inventory || [[]];
                player.inventory = Array(4)
                    .fill()
                    .map(() =>
                        Array(9).fill({
                            blockId: null,
                            itemId: null,
                            count: 0,
                            props: {},
                        })
                    );
            }

            // Load gamemode
            if (typeof playerData.gamemode === "number") {
                player.gamemode = playerData.gamemode;
            } else {
                player.gamemode = properties.gamemode;
            }

            serverLog(
                `Loaded player data for ${player.name} from ${playerFile}`
            );
        } else {
            // Set default values for new players
            player.inventory = Array(4)
                .fill()
                .map(() =>
                    Array(9).fill({
                        blockId: null,
                        itemId: null,
                        count: 0,
                        props: {},
                    })
                );
            player.gamemode = properties.gamemode;
            serverLog(
                `No player data found for ${player.name}, using defaults`
            );
        }
    } catch (error) {
        console.error(
            `Error loading player data for ${player.name} from ${playerFile}: ${error.message}`
        );
        // Fallback to defaults
        player.position = new Vector2(0, 0);
        player.inventory = player.inventory || [[]];
        player.inventory = Array(4)
            .fill()
            .map(() =>
                Array(9).fill({
                    blockId: null,
                    itemId: null,
                    count: 0,
                    props: {},
                })
            );
        player.gamemode = properties.gamemode;
        serverLog(`Using default player data for ${player.name}`);
    }

    // Send player data to player
    sendToPlayer(player.UUID, {
        type: "playerDataFromFile",
        message: {
            UUID: player.UUID,
            position: player.position,
            dimension: player.dimension,
            inventory: player.inventory,
            gamemode: player.gamemode,
            health: player.health,
            food: player.food,
        },
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
    const ip = ws._socket.remoteAddress.replace(/^::ffff:/, "") || "127.0.0.1";
    if (bannedIPs.includes(ip)) {
        ws.send(
            JSON.stringify({
                type: "disconnect",
                message: "You are banned from this server.",
            })
        );
        serverLog(`Banned IP ${ip} attempted to join.`);
        ws.close();
        return;
    }

    const newPlayer = new Player({
        UUID: uuidv4(),
        name: playerData?.name || `Player ${players.length + 1}`,
        ws: ws,
        skin: playerData?.skin || null,
    });

    players.push(newPlayer);

    updateUserCache(newPlayer.name, ip);

    sendToPlayer(newPlayer.UUID, {
        type: "youJoined",
        message: {
            player: newPlayer,
            existingPlayers: players.filter((p) => p.UUID !== newPlayer.UUID),
            gamemode: newPlayer.gamemode || properties.gamemode,
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
    // Save player data before removing
    const ip =
        player.ws._socket.remoteAddress.replace(/^::ffff:/, "") || "127.0.0.1";
    savePlayerData(player, ip);
    players = players.filter((p) => p.UUID !== player.UUID);
    serverLog(player.name + " left the game!");
    broadcast({
        type: "playerLeft",
        message: player.UUID,
    });
}

function loadServerIcon() {
    for (const { path, mime } of iconPaths) {
        if (fs.existsSync(path)) {
            try {
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
                    continue;
                }

                const iconBuffer = fs.readFileSync(path);
                const base64Icon = iconBuffer.toString("base64");
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

            const player = getPlayerByUUID(data.sender);

            if (!player) break;

            if (data.message.position) {
                player.position = data.message.position;
            }
            if (data.message.gamemode) {
                player.gamemode = data.message.gamemode;
            }
            if (data.message.health) {
                player.health = data.message.health;
            }
            if (data.message.food) {
                player.food = data.message.food;
            }

            break;

        case "playerData": {
            const player = getPlayerByUUID(data.message.UUID);
            if (player) {
                const oldName = player.name;
                player.skin = data.message.skin;
                player.name = data.message.name;
                broadcast(data, [data.sender]);

                serverLog(`${player.name} joined the game!`);

                const ip =
                    ws._socket.remoteAddress.replace(/^::ffff:/, "") ||
                    "127.0.0.1";
                updateUserCache(player.name, ip);

                loadPlayerData(player, ip);
            }
            break;
        }

        case "chat": {
            const player = getPlayerByUUID(data.sender);
            serverLog(player.name + ": " + data.message);
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

function loadWorldFromDir() {
    const worldDir = `./${properties.levelName}`;
    const worldFile = `${worldDir}/world.save`;
    try {
        if (fs.existsSync(worldFile)) {
            const stats = fs.statSync(worldFile);
            if (stats.isDirectory()) {
                console.error(
                    `Error: ${worldFile} is a directory, expected a file.`
                );
                return false;
            }
            const fileContent = fs.readFileSync(worldFile, "utf8");
            if (!fileContent) {
                console.error(`Error: ${worldFile} is empty.`);
                return false;
            }
            const worldData = JSON.parse(fileContent);
            const success = world.loadWorld(worldData);
            if (success) {
                return true;
            } else {
                console.error("Failed to load world data from", worldFile);
                return false;
            }
        } else {
            saveWorldToDir();
            return false;
        }
    } catch (error) {
        console.error(
            "Error loading world from",
            worldFile,
            ":",
            error.message
        );
        return false;
    }
}

function serverLog(log = "") {
    if (!log) return;

    const date = new Date();

    date.setHours(date.getHours() + 2);

    const formattedDate = date
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "");

    const formattedLog = `[${formattedDate}] ${log}`;

    console.log(formattedLog);
}

function saveWorldToDir() {
    const worldDir = `./${properties.levelName}`;
    const worldFile = `${worldDir}/world.save`;
    const worldSave = world.saveWorld();
    try {
        if (fs.existsSync(worldFile)) {
            const stats = fs.statSync(worldFile);
            if (stats.isDirectory()) {
                console.error(
                    `Error: ${worldFile} is a directory, cannot save world.`
                );
                return false;
            }
        }
        fs.mkdirSync(worldDir, { recursive: true });
        fs.writeFileSync(worldFile, JSON.stringify(worldSave, null));

        // Save all player data during autosave
        if (Array.isArray(players)) {
            players.forEach((player) => {
                const ip =
                    player.ws._socket.remoteAddress.replace(/^::ffff:/, "") ||
                    "127.0.0.1";
                savePlayerData(player, ip);
            });
        } else {
            serverLog(
                "Warning: players array is not initialized, skipping player data save"
            );
        }

        return true;
    } catch (error) {
        console.error(`Error saving world to ${worldFile}: ${error.message}`);
        return false;
    }
}
