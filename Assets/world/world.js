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

    globalRecalculateRedstone();
}

function globalRecalculateRedstone() {
    // 1. Reset power on all redstone dust in loaded chunks.
    for (const chunk of chunks_in_render_distance.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                const def = GetBlock(block.blockType);
                if (def.specialType === SpecialType.RedstoneDust) {
                    block.metaData.props.power = 0;
                }
            }
        }
    }

    // 2. Seed a global queue with constant power sources and any dust that already has power.
    // We work in global (world) pixel coordinates.
    let queue = [];
    // We consider all 8 directions (cardinal + diagonal).
    const offsets = [
        { dx: -BLOCK_SIZE, dy: 0 },
        { dx: BLOCK_SIZE, dy: 0 },
        { dx: 0, dy: -BLOCK_SIZE },
        { dx: 0, dy: BLOCK_SIZE },
        { dx: -BLOCK_SIZE, dy: -BLOCK_SIZE },
        { dx: BLOCK_SIZE, dy: -BLOCK_SIZE },
        { dx: -BLOCK_SIZE, dy: BLOCK_SIZE },
        { dx: BLOCK_SIZE, dy: BLOCK_SIZE },
    ];

    for (const chunk of chunks_in_render_distance.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                const def = GetBlock(block.blockType);
                // Constant sources (e.g. redstone blocks) provide a fixed power.
                if (def.baseRedstoneOutput && def.baseRedstoneOutput > 0) {
                    queue.push({
                        globalX: block.transform.position.x,
                        globalY: block.transform.position.y,
                    });
                }
                // Also seed any redstone dust that already has a positive power.
                else if (
                    def.specialType === SpecialType.RedstoneDust &&
                    block.metaData.props.power > 0
                ) {
                    queue.push({
                        globalX: block.transform.position.x,
                        globalY: block.transform.position.y,
                    });
                }
            }
        }
    }

    // 3. Propagate redstone power via a global flood-fill.
    while (queue.length > 0) {
        const { globalX, globalY } = queue.shift();
        const block = GetBlockAtWorldPosition(globalX, globalY, false);
        if (!block) continue;
        const currentPower = block.metaData.props.power;
        if (currentPower <= 1) continue; // Cannot propagate further

        // Check all eight neighbors (cardinal + diagonal)
        for (const offset of offsets) {
            const nx = globalX + offset.dx;
            const ny = globalY + offset.dy;
            const neighbor = GetBlockAtWorldPosition(nx, ny, false);
            if (!neighbor) continue;
            const nDef = GetBlock(neighbor.blockType);
            // Only propagate through redstone dust.
            if (nDef.specialType !== SpecialType.RedstoneDust) continue;

            // A neighbor should get power one less than the current.
            const candidatePower = currentPower - 1;
            if (candidatePower > neighbor.metaData.props.power) {
                neighbor.metaData.props.power = candidatePower;
                queue.push({
                    globalX: neighbor.transform.position.x,
                    globalY: neighbor.transform.position.y,
                });
            }
        }
    }

    // 4. Finally, update the visual connection state for every redstone dust.
    for (const chunk of chunks_in_render_distance.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                const def = GetBlock(block.blockType);
                if (def.specialType === SpecialType.RedstoneDust) {
                    block.redstoneDustUpdateState();
                }
            }
        }
    }
}

function globalRecalculateLight() {
    // Build a global queue from every light source.
    const queue = [];
    for (let chunk of chunks_in_render_distance.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                const inherent = GetBlock(block.blockType).lightLevel || 0;
                if (inherent > 0) {
                    if (block.lightLevel < inherent)
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
