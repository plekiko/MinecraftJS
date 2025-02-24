let entities = [];

let chunks_in_render_distance = new Map();

let player;

function removeEntity(entity) {
    if (!entity) return;
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

    updatePositionalAudioVolumes();

    chunks_in_render_distance.forEach((chunk) => {
        chunk.updateChunk();
    });

    globalUpdateSkyLight();
    globalRecalculateLight();
}

function globalRecalculateLight() {
    // Build a global queue from every light source.
    const queue = [];
    for (let chunk of chunks.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                const inherent = GetBlock(block.blockType).lightLevel || 0;
                if (inherent > 0) {
                    block.lightLevel = inherent;
                    queue.push(block);
                }
            }
        }
    }

    // Define 4-way neighbor offsets.
    const offsets = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
    ];

    // Global flood–fill: propagate light from all sources across chunk boundaries.
    while (queue.length > 0) {
        const current = queue.shift();
        const currentLevel = current.lightLevel;
        if (currentLevel <= 1) continue;
        const currentPosX = current.transform.position.x;
        const currentPosY = current.transform.position.y;
        for (const offset of offsets) {
            const nx = currentPosX + offset.dx * BLOCK_SIZE;
            const ny = currentPosY + offset.dy * BLOCK_SIZE;
            const neighbor = GetBlockAtWorldPosition(nx, ny, false);
            if (!neighbor) continue;
            const newLight = currentLevel - 1;
            if (neighbor.lightLevel < newLight) {
                neighbor.lightLevel = newLight;
                queue.push(neighbor);
            }
        }
    }
}

function globalUpdateSkyLight() {
    for (let chunk of chunks.values()) {
        chunk.updateSkyLight();
    }
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
