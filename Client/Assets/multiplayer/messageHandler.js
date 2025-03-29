function processMessage(data) {
    switch (data.type) {
        case "youJoined":
            iJoined(data.player, data.existingPlayers);
            break;
        case "playerJoined":
            SpawnPlayer(
                new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
                false,
                data.player.UUID,
                data.player.name,
                false
            );
            break;
        case "playerLeft":
            removeEntity(getEntityByUUID(data.UUID));
            break;

        case "chat":
            chat.message(data.message, data.sender);
            break;
        case "playerUpdate":
            updatePlayerState(data);
            break;
        case "entityRPC":
            handleEntityRPC(data);
            break;
        default:
            console.log("Unknown message type:", data.type);
            break;
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
