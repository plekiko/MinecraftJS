import { uuidv4, Vector2, RandomRange } from "./Classes/helper.js";
import { Player } from "./Classes/player.js";
import { WebSocketServer } from "ws";
import { World } from "./Classes/world.js";
import { createInterface } from "readline";

const world = new World();

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Create a WebSocket server
const wss = new WebSocketServer({ port: 25565 });

let players = [];

wss.on("connection", (ws) => {
    playerJoined(ws); // Pass ws to playerJoined function

    ws.on("message", (message) => {
        // Log the incoming message size in KB
        // const incomingSizeKB = (Buffer.byteLength(message) / 1024).toFixed(2); // Convert bytes to KB
        // console.log(`Received message size: ${incomingSizeKB} KB`);

        processMessage(message, ws); // Process the incoming message
    });

    ws.on("close", () => {
        const player = players.find((p) => p.ws === ws);
        playerLeft(player);
    });
});

function broadcast(data, exclude = []) {
    players.forEach((player) => {
        if (!exclude.includes(player.UUID)) {
            const message = JSON.stringify(data);
            // Log the outgoing message size in KB
            // const outgoingSizeKB = (Buffer.byteLength(message) / 1024).toFixed(
            //     2
            // ); // Convert bytes to KB
            // console.log(
            //     `Sent message size to ${player.name}: ${outgoingSizeKB} KB`
            // );

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

function playerJoined(ws) {
    const newPlayer = new Player({
        UUID: uuidv4(),
        name: `Player ${players.length + 1}`,
        ws: ws,
    });

    players.push(newPlayer);

    console.log(
        `Player ${newPlayer.name} joined the game with UUID ${newPlayer.UUID}`
    );

    // Send the new player their UUID and the list of existing players
    sendToPlayer(newPlayer.UUID, {
        type: "youJoined",
        message: {
            player: newPlayer,
            existingPlayers: players.filter((p) => p.UUID !== newPlayer.UUID),
        },
    });

    // Broadcast to all players that a new player has joined
    broadcast(
        {
            type: "playerJoined",
            message: { player: newPlayer },
        },
        [newPlayer.UUID]
    );
}

function playerLeft(player) {
    players = players.filter((p) => p.UUID !== player.UUID);

    broadcast({
        type: "playerLeft",
        message: player.UUID,
    });
}

function processMessage(message, ws) {
    const data = JSON.parse(message);

    // console.log("Received message from: " + ws, "data: " + data);

    switch (data.type) {
        case "playerUpdate":
            broadcast(data, [data.sender]);
            break;

        case "chat":
            console.log("Chat message from", data.sender, ":", data.message);
            broadcast({
                type: "chat",
                message: data.message,
                sender: getPlayerByUUID(data.sender).name,
            });
            break;
        case "entityRPC":
            broadcast(data, [data.sender]);
            break;

        case "getChunk":
            const chunk = world.getChunk(data.message.data.x);
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
            world.uploadChunk(data.message.chunk);
            break;

        case "placeBlock":
            broadcast(data, [data.sender]);
            break;

        default:
            console.log("Unknown message type:", data.type);
            break;
    }
}

function getPlayerByUUID(UUID) {
    return players.find((player) => player.UUID === UUID);
}

console.log("WebSocket server is running on ws://localhost:25565");

rl.question("Enter seed: ", (seed) => {
    if (seed) {
        world.seed = seed;
    } else {
        world.seed = Math.floor(RandomRange(-1000000, 1000000));
    }

    rl.close(); // Close the readline interface when done
});
