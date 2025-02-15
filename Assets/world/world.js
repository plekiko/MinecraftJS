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
    updatingBlocks.forEach((block) => {
        // Get the updateSpeed for this block
        let speed = GetBlock(block.blockType).updateSpeed; // e.g., 1 or 0.5

        // Initialize an accumulator property if it doesn't exist
        if (block._updateAccumulator === undefined) {
            block._updateAccumulator = 0;
        }

        // Add the speed value each tick
        block._updateAccumulator += speed;

        // When the accumulator reaches at least 1, perform an update
        if (block._updateAccumulator >= 1) {
            block.update();
            block._updateAccumulator -= 1; // subtract 1, preserving any remainder
        }
    });
}
