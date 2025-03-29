// This object will store callbacks keyed by requestId
const callbacks = {};

function processMessage(data) {
    const message = data.message;
    const type = data.type;

    switch (type) {
        case "youJoined":
            console.log(data);
            iJoined(message.player, message.existingPlayers);
            break;
        case "playerJoined":
            console.log(data);
            SpawnPlayer(
                new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
                false,
                message.player.UUID,
                message.player.name,
                false
            );
            break;
        case "playerLeft":
            removeEntity(getEntityByUUID(message));
            break;

        case "chat":
            chat.message(message, data.sender);
            break;
        case "playerUpdate":
            updatePlayerState(data);
            break;
        case "entityRPC":
            handleEntityRPC(message);
            break;

        case "response":
            if (callbacks[data.message.requestId]) {
                callbacks[data.message.requestId](message); // Call the stored callback
                delete callbacks[data.message.requestId]; // Remove callback once executed
            }
            break;

        case "placeBlock":
            if (!chunks.has(message.chunkX))
                console.log("Chunk not loaded:", message.chunkX);

            console.log("Placing block:", message);

            chunks
                .get(message.chunkX)
                .setBlockType(
                    message.x,
                    message.y,
                    message.blockType,
                    message.isWall,
                    null,
                    false,
                    true
                );
            break;

        default:
            console.log("Unknown message type:", type);
            break;
    }
}

// Store callback for async get request
async function getChunk(x) {
    try {
        const chunk = await server.get({
            type: "getChunk",
            message: { x: x },
            sender: player.UUID,
        });

        console.log("Received chunk:", chunk);
    } catch (error) {
        console.error("Error getting chunk:", error);
    }
}

function updatePlayerState(data) {
    const player = getEntityByUUID(data.sender);
    if (player) {
        player.multiplayerReceivePlayerState(data.message);
    }
}

function iJoined(player, existingPlayers) {
    SpawnPlayer(
        new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
        true,
        player.UUID,
        player.name
    );

    // Spawn all existing players for the new player
    if (existingPlayers && existingPlayers.length > 0) {
        existingPlayers.forEach((p) => {
            SpawnPlayer(
                new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
                false,
                p.UUID,
                p.name,
                false
            );
        });
    }
}

function handleEntityRPC(data) {
    const entity = getEntityByUUID(data.sender);
    if (entity && typeof entity[data.message.method] === "function") {
        entity[data.message.method](...data.message.args);
    } else {
        console.warn(
            `Entity ${data.UUID} does not have method ${data.message.method}`
        );
    }
}
