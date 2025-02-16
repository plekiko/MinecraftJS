let entities = [];

let chunks_in_render_distance = new Map();

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

    chunks_in_render_distance.forEach((chunk) => {
        chunk.updateChunk();
    });
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
