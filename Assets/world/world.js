let entities = [];

let player;

function removeEntity(entity) {
    if (entity.myChunkX !== null) {
        chunks.get(entity.myChunkX).removeEntityFromChunk(entity);
    }

    const index = entities.indexOf(entity);

    entities.splice(index, 1);
}

setInterval(() => {
    tick();
}, 1000 / TICK_SPEED);

function tick() {
    updateBlocks();
}

function updateBlocks() {
    // Iterate backwards so removal doesn't affect indexing.
    for (let i = updatingBlocks.length - 1; i >= 0; i--) {
        let block = updatingBlocks[i];

        // if (!isBlockInRenderDistance(block)) {
        //     continue;
        // }

        // Get the updateSpeed for this block.
        let speed = GetBlock(block.blockType).updateSpeed; // e.g., 1 or 0.5

        // Initialize an accumulator property if it doesn't exist.
        if (block._updateAccumulator === undefined) {
            block._updateAccumulator = 0;
        }

        // Add the speed value each tick.
        block._updateAccumulator += speed;

        // When the accumulator reaches at least 1, perform an update.
        if (block._updateAccumulator >= 1) {
            block.update();
            block._updateAccumulator -= 1; // subtract 1 while preserving any remainder.
        }
    }
}

function isBlockInRenderDistance(block) {
    // Convert the block's position to world coordinates.
    const worldPos = getBlockWorldPosition(block);

    // Get the camera's world position.
    const camX = camera.getWorldX();
    const camY = camera.getWorldY();

    // Define a render radius based on your settings.
    // Adjust margin as needed. (Try a higher value if necessary.)
    const margin = 100;
    const renderRadiusX = RENDER_DISTANCE * CHUNK_WIDTH * BLOCK_SIZE + margin;
    const renderRadiusY = RENDER_DISTANCE * CHUNK_HEIGHT * BLOCK_SIZE + margin;

    // Use absolute differences instead of inequality comparisons.
    return (
        Math.abs(worldPos.x - camX) <= renderRadiusX &&
        Math.abs(worldPos.y - camY) <= renderRadiusY
    );
}
