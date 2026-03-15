// This object will store callbacks keyed by requestId
const callbacks = {};
const pendingPlayerDataFromFile = new Map();

function applyInventoryFromSave(targetPlayer, inventoryData) {
    if (!targetPlayer?.inventory?.items) return;
    if (!Array.isArray(inventoryData)) return;

    for (let y = 0; y < targetPlayer.inventory.items.length; y++) {
        const row = targetPlayer.inventory.items[y];
        const savedRow = Array.isArray(inventoryData[y])
            ? inventoryData[y]
            : [];

        for (let x = 0; x < row.length; x++) {
            const slot = row[x];
            const savedItem = savedRow[x] || {};

            const item = new InventoryItem({
                blockId: savedItem.blockId || null,
                itemId: savedItem.itemId || null,
                count:
                    typeof savedItem.count === "number" ? savedItem.count : 0,
                props:
                    savedItem.props && typeof savedItem.props === "object"
                        ? savedItem.props
                        : {},
            });

            if (slot && typeof slot === "object" && "item" in slot) {
                slot.item = item;
            }
        }
    }

    if (
        typeof targetPlayer.inventory.serializeInventoryForMultiplayer ===
        "function"
    ) {
        targetPlayer.inventory.lastSyncedInventoryPayload = JSON.stringify(
            targetPlayer.inventory.serializeInventoryForMultiplayer()
        );
    }
}

function applyPlayerDataFromFile(message) {
    const playerFromFile = getEntityByUUID(message.UUID);
    if (!playerFromFile) {
        return false;
    }

    playerFromFile.setGamemode(
        typeof message.gamemode === "number" &&
            message.gamemode <= 3 &&
            message.gamemode >= 0
            ? message.gamemode
            : 0
    );

    playerFromFile.dimension =
        typeof message.dimension === "number" ? message.dimension : 0;

    playerFromFile.position = new Vector2(
        typeof message.position?.x === "number" ? message.position.x : 0,
        typeof message.position?.y === "number" ? message.position.y : 0
    );

    playerFromFile.health =
        typeof message.health === "number" ? message.health : 20;
    playerFromFile.foodLevel =
        typeof message.food === "number" ? message.food : 20;
    playerFromFile.food = typeof message.food === "number" ? message.food : 20;

    applyInventoryFromSave(playerFromFile, message.inventory);

    gotoDimension(
        typeof message.dimension === "number" ? message.dimension : 0
    );

    return true;
}

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
            const newPlayer = spawnPlayer(
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
            loadChunk(message.x, message.chunk);
            break;
        case "seed":
            console.log("Received seed:", message);
            loadCustomSeed(message);
            multiplayerSeedLoaded = true;
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

            if (!applyPlayerDataFromFile(message)) {
                pendingPlayerDataFromFile.set(message.UUID, message);
            }

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
                .setBlockTypeLocal(
                    message.x,
                    message.y,
                    message.blockType,
                    message.isWall,
                    null,
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
                .getBlockLocal(message.x, message.y, message.isWall);

            if (!block) console.log("Block not found:", message.x, message.y);

            block.breakBlock(message.shouldDrop, message.isWall, true);
        case "playerDimension":
            const otherPlayer = getEntityByUUID(message.player);
            if (otherPlayer) otherPlayer.dimension = message.dimension;
            break;

        case "syncMetaData":
            const chunk = getDimensionChunks(message.dimensionIndex)?.get(
                message.chunkX
            );

            if (!chunk) break;

            const blockToChange = chunk.getBlockLocal(message.x, message.y);

            if (!blockToChange) break;

            blockToChange.recieveSyncMetaData(message.metaData);

            break;

        case "summonDrop":
            summonEntity(
                Drop,
                message.position,
                message.props,
                false,
                message.UUID
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

async function iJoined(player, existingPlayers, gamemode = 0) {
    // Wait until loadingWorld is false
    while (loadingWorld) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const myPlayer = spawnPlayer(
        new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
        false,
        player.UUID,
        settings.username
    );

    if (pendingPlayerDataFromFile.has(player.UUID)) {
        applyPlayerDataFromFile(pendingPlayerDataFromFile.get(player.UUID));
        pendingPlayerDataFromFile.delete(player.UUID);
    }

    // Set on ground AFTER save data is applied so it isn't overridden by a stale saved position
    const trySetOnGround = () => {
        if (myPlayer.getCurrentChunk()) {
            return myPlayer.setOnGround() === true;
        }
        return false;
    };
    if (!trySetOnGround()) {
        const intervalId = setInterval(() => {
            if (trySetOnGround()) clearInterval(intervalId);
        }, 100);
        setTimeout(() => clearInterval(intervalId), 10000);
    }

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
            const newPlayer = spawnPlayer(
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
