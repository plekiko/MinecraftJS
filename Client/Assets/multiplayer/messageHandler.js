// This object will store callbacks keyed by requestId
const callbacks = {};

function processMessage(data) {
    const message = data.message;
    const type = data.type;

    switch (type) {
        case "serverFull":
            alert("Server is full. Please try again later.");
            break;

        case "youJoined":
            console.log(data);
            iJoined(message.player, message.existingPlayers, message.gamemode);
            break;
        case "playerJoined":
            console.log(data);
            const newPlayer = SpawnPlayer(
                new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
                false,
                message.player.UUID,
                message.player.name,
                false
            );
            newPlayer.setSkin(message.player.skin);
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
        case "uploadChunk":
            console.log("Received chunk:", message);
            LoadChunk(message.x, message.chunk);
            break;
        case "seed":
            console.log("Received seed:", message);
            LoadCustomSeed(message);
            break;
        case "removeEntity":
            console.log("Removing entity:", message);
            const entity = getEntityByUUID(message.UUID);
            if (entity) {
                removeEntity(entity);
            }
            break;
        case "summonEntity":
            console.log("Summoning entity:", message);
            const newEntity = summonEntity(
                message.entity,
                message.position,
                message.props,
                false,
                message.UUID
            );
            return;

        case "response":
            if (callbacks[data.message.requestId]) {
                callbacks[data.message.requestId](message); // Call the stored callback
                delete callbacks[data.message.requestId]; // Remove callback once executed
            }
            break;
        case "playerData":
            console.log("Received player data:", message);
            const player = getEntityByUUID(message.UUID);
            if (player) {
                player.setSkin(message.skin);
                player.name = message.name;
            }
            break;

        case "playerDataFromFile":
            console.log("Received player data from file:", message);

            const playerFromFile = getEntityByUUID(message.UUID);

            playerFromFile.setGamemode(
                message.gamemode &&
                    message.gamemode <= 3 &&
                    message.gamemode >= 0
                    ? message.gamemode
                    : 0
            );

            playerFromFile.dimension = message.dimension
                ? message.dimension
                : 0;

            playerFromFile.position = new Vector2(
                message.position.x ? message.position.x : 0,
                message.position.y ? message.position.y : 0
            );

            playerFromFile.health = message.health ? message.health : 20;
            playerFromFile.food = message.food ? message.food : 20;

            gotoDimension(message.dimension ? message.dimension : 0);

            break;

        case "placeBlock":
            if (
                !getDimensionChunks(message.dimensionIndex)?.has(message.chunkX)
            ) {
                console.log(
                    "Chunk not loaded:",
                    message.chunkX,
                    message.dimensionIndex
                );
                return;
            }

            console.log("Placing block:", message);

            getDimensionChunks(message.dimensionIndex)
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
        case "breakBlock":
            if (
                !getDimensionChunks(message.dimensionIndex)?.has(message.chunkX)
            ) {
                console.log(
                    "Chunk not loaded:",
                    message.chunkX,
                    message.dimensionIndex
                );
                return;
            }

            console.log("Breaking block:", message);

            // get the block at the given coordinates
            const block = getDimensionChunks(message.dimensionIndex)
                .get(message.chunkX)
                .getBlock(message.x, message.y, false, message.isWall);

            if (!block) console.log("Block not found:", message.x, message.y);

            block.breakBlock(message.shouldDrop, message.isWall);
        case "playerDimension":
            const otherPlayer = getEntityByUUID(message.player);
            if (otherPlayer) otherPlayer.dimension = message.dimension;
            break;

        case "syncMetaData":
            const chunk = getDimensionChunks(message.dimensionIndex)?.get(
                message.chunkX
            );

            if (!chunk) break;

            const blockToChange = chunk.getBlock(message.x, message.y, false);

            if (!blockToChange) break;

            blockToChange.recieveSyncMetaData(message.metaData);

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

async function iJoined(player, existingPlayers, gamemode = 0) {
    // Wait until loadingWorld is false
    while (loadingWorld) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const myPlayer = SpawnPlayer(
        new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
        true,
        player.UUID,
        settings.username
    );

    myPlayer.setGamemode(gamemode);

    // Upload skin to server
    server.send({
        type: "playerData",
        sender: player.UUID,
        message: {
            UUID: player.UUID,
            skin: myPlayer.body.sprite,
            name: settings.username,
        },
    });

    console.log("Uploaded skin to server", myPlayer.body.sprite);

    // Spawn all existing players for the new player
    if (existingPlayers && existingPlayers.length > 0) {
        existingPlayers.forEach((p) => {
            const newPlayer = SpawnPlayer(
                new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
                false,
                p.UUID,
                p.name,
                false
            );

            newPlayer.dimension = p.dimension;

            newPlayer.setSkin(p.skin);
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
