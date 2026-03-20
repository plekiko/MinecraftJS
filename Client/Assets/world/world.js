let world = null;

class World {
    constructor() {
        this.seed = 0;
        this.entities = [];
        this.particleEmitters = [];
        this.chunks_in_render_distance = new Map();
        this.player = null;
        this.blocksToUpdate = [];
        this.worldTickInterval = null;

        this.generator = new WorldGenerator(this);

        this.startTickLoop();
    }

    startTickLoop() {
        if (this.worldTickInterval) return;
        this.worldTickInterval = setInterval(() => {
            this.tick();
        }, 1000 / TICK_SPEED);
    }

    tick() {
        return tick();
    }

    async startGenerator(dimensionIndex = activeDimension) {
        return this.generator.generateWorld(dimensionIndex);
    }

    get activeDimension() {
        return activeDimension;
    }

    set activeDimension(value) {
        activeDimension = value;
    }

    getDimension(index = activeDimension) {
        return getDimension(index);
    }

    getDimensionChunks(index = activeDimension) {
        return getDimensionChunks(index);
    }

    setBlockType(block, type, updateAdjacent = true) {
        return setBlockType(block, type, updateAdjacent);
    }

    setBlockTypeAtPosition(
        worldX,
        worldY,
        blockType,
        wall = false,
        dimensionIndex = activeDimension,
        metaData = null,
        inputIsUserBlockY = true,
        updateAdjacent = false,
    ) {
        if (inputIsUserBlockY)
            worldY = this.userBlockYToWorld(worldY / BLOCK_SIZE);

        const chunk = this.getChunkForX(worldX, dimensionIndex);
        if (!chunk) {
            this.bufferBlock(
                worldX,
                worldY,
                blockType,
                dimensionIndex,
                metaData,
                wall,
                false,
            );
            return false;
        }

        const localX = Math.floor((worldX - chunk.x) / BLOCK_SIZE);
        const localY = Math.floor(worldY / BLOCK_SIZE);

        return chunk.setBlockTypeLocal(
            localX,
            localY,
            blockType,
            wall,
            metaData,
            updateAdjacent,
        );
    }

    getBlockAtWorldPosition(
        worldX,
        worldY,
        wall = false,
        dimensionIndex = activeDimension,
    ) {
        const targetChunk = this.getChunkForX(worldX, dimensionIndex);
        if (!targetChunk || worldY >= CHUNK_HEIGHT * BLOCK_SIZE) return null;

        const localX = Math.floor((worldX - targetChunk.x) / BLOCK_SIZE);
        const localY = Math.floor(worldY / BLOCK_SIZE);

        return targetChunk.getBlockLocal(localX, localY, wall);
    }

    getChunkForX(worldX, dimensionIndex = activeDimension) {
        const dimension = dimensions[dimensionIndex];
        const chunkX =
            Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
            (CHUNK_WIDTH * BLOCK_SIZE);
        return dimension.chunks.get(chunkX);
    }

    getChunkXForWorldX(worldX) {
        const chunkSize = CHUNK_WIDTH * BLOCK_SIZE;
        return Math.floor(worldX / chunkSize) * chunkSize;
    }

    bufferBlock(
        worldX,
        worldY,
        blockType,
        dimensionIndex = activeDimension,
        metaData = null,
        wall = false,
        inputIsUserBlockY = true,
    ) {
        if (inputIsUserBlockY)
            worldY = this.userBlockYToWorld(worldY / BLOCK_SIZE);

        const targetChunkX = this.getChunkXForWorldX(worldX);

        if (!getDimension(dimensionIndex).pendingBlocks.has(targetChunkX)) {
            getDimension(dimensionIndex).pendingBlocks.set(targetChunkX, {
                dimensionIndex: dimensionIndex,
                blocks: [],
            });
        }
        getDimension(dimensionIndex)
            .pendingBlocks.get(targetChunkX)
            .blocks.push({
                x: worldX,
                y: worldY,
                blockType,
                metaData,
                wall,
            });
    }

    worldToBlocks(position) {
        const blockX = Math.floor(position.x / BLOCK_SIZE);
        const blockY = this.worldToUserBlockY(position.y);
        return new Vector2(blockX, blockY);
    }

    worldToUserBlockY(worldY) {
        return CHUNK_HEIGHT - Math.floor(worldY / BLOCK_SIZE);
    }

    userBlockYToWorld(blockY) {
        return (CHUNK_HEIGHT - blockY) * BLOCK_SIZE;
    }

    userBlocksToWorldPosition(blockX, blockY) {
        return new Vector2(blockX * BLOCK_SIZE, this.userBlockYToWorld(blockY));
    }

    getBlockAtUserBlockPosition(
        blockX,
        blockY,
        wall = false,
        dimensionIndex = activeDimension,
    ) {
        const worldPos = this.userBlocksToWorldPosition(blockX, blockY);
        return this.getBlockAtWorldPosition(
            worldPos.x,
            worldPos.y,
            wall,
            dimensionIndex,
        );
    }

    setBlockTypeAtUserBlockPosition(
        blockX,
        blockY,
        blockType,
        wall = false,
        dimensionIndex = activeDimension,
        metaData = null,
        updateAdjacent = true,
    ) {
        const worldPos = this.userBlocksToWorldPosition(blockX, blockY);
        return this.setBlockTypeAtPosition(
            worldPos.x,
            worldPos.y,
            blockType,
            wall,
            dimensionIndex,
            metaData,
            false,
            updateAdjacent,
        );
    }

    worldToLocal(x, y) {
        const chunkX = this.getChunkXForWorldX(x);
        const localX = Math.floor((x - chunkX) / BLOCK_SIZE);
        const localY = Math.floor(y / BLOCK_SIZE);
        return new Vector2(localX, localY);
    }

    getChunkByIndex(index) {
        const chunkX = index * CHUNK_WIDTH * BLOCK_SIZE;
        return this.getDimensionChunks().get(chunkX);
    }

    getBlockWorldPosition(block) {
        return new Vector2(
            block.transform.position.x,
            block.transform.position.y,
        );
    }

    checkAdjacentBlocks(position, wall = false) {
        const directions = [
            { x: 0, y: -BLOCK_SIZE },
            { x: 0, y: BLOCK_SIZE },
            { x: -BLOCK_SIZE, y: 0 },
            { x: BLOCK_SIZE, y: 0 },
        ];

        for (const dir of directions) {
            const adjacentPos = new Vector2(
                position.x + dir.x,
                position.y + dir.y,
            );
            const block = this.getBlockAtWorldPosition(
                adjacentPos.x,
                adjacentPos.y,
                wall,
            );
            if (!block) continue;

            const type = getBlock(block.blockType);
            if (block && !type.fluid && !type.air) {
                return true;
            }
        }

        return false;
    }

    placePortalInDimension(dimension, position) {
        const range = 8;

        for (let x = -range; x <= range; x++) {
            const chunk = this.getChunkForX(
                position.x + x * BLOCK_SIZE,
                dimension,
            );

            if (chunk) {
                const portals = chunk.getAllBlocks(Blocks.NetherPortal);
                if (portals.length > 0) {
                    return portals[portals.length - 1].transform.position;
                }
            }
        }

        for (let i = 0; i < 4; i++) {
            this.setBlockTypeAtPosition(
                position.x + i * BLOCK_SIZE,
                position.y,
                Blocks.Obsidian,
                false,
                dimension,
                null,
                false,
            );
            this.setBlockTypeAtPosition(
                position.x + i * BLOCK_SIZE,
                position.y + BLOCK_SIZE * 4,
                Blocks.Obsidian,
                false,
                dimension,
                null,
                false,
            );
            this.setBlockTypeAtPosition(
                position.x,
                position.y + i * BLOCK_SIZE,
                Blocks.Obsidian,
                false,
                dimension,
                null,
                false,
            );
            this.setBlockTypeAtPosition(
                position.x + BLOCK_SIZE * 3,
                position.y + i * BLOCK_SIZE,
                Blocks.Obsidian,
                false,
                dimension,
                null,
                false,
            );
        }

        for (let i = 0; i < 6; i++) {
            this.setBlockTypeAtPosition(
                position.x + i * BLOCK_SIZE - BLOCK_SIZE,
                position.y + BLOCK_SIZE * 5,
                Blocks.Cobblestone,
                false,
                dimension,
                null,
                false,
            );
        }

        for (let y = 1; y < 4; y++) {
            for (let x = 1; x < 3; x++) {
                this.setBlockTypeAtPosition(
                    position.x + x * BLOCK_SIZE,
                    position.y + y * BLOCK_SIZE,
                    Blocks.NetherPortal,
                    false,
                    dimension,
                    null,
                    false,
                );
            }
        }

        return new Vector2(
            position.x + BLOCK_SIZE * 1.5,
            position.y + BLOCK_SIZE * 3,
        );
    }

    async getChunkFromServer(x, dimensionIndex = activeDimension) {
        try {
            const chunkData = await server.get({
                type: "getChunk",
                message: { x: x, dimensionIndex: dimensionIndex },
            });

            return chunkData.chunk;
        } catch (error) {
            return null;
        }
    }

    serverPlaceBlock(
        chunkX,
        x,
        y,
        blockType,
        isWall = false,
        dimensionIndex = activeDimension,
    ) {
        if (!multiplayer) return;
        server.send({
            type: "placeBlock",
            sender: this.player.UUID,
            message: {
                x: x,
                y: y,
                blockType: blockType,
                isWall: isWall,
                chunkX: chunkX,
                dimensionIndex: dimensionIndex,
            },
        });

        this.uploadChunkToServer(chunkX, dimensionIndex);
    }

    serverBreakBlock(
        chunkX,
        x,
        y,
        blockType,
        isWall = false,
        shouldDrop = false,
        dimensionIndex = activeDimension,
    ) {
        if (!multiplayer) return;
        server.send({
            type: "breakBlock",
            sender: this.player.UUID,
            message: {
                x: x,
                y: y,
                blockType: blockType,
                isWall: isWall,
                chunkX: chunkX,
                shouldDrop: shouldDrop,
                dimensionIndex: dimensionIndex,
            },
        });

        this.uploadChunkToServer(chunkX, dimensionIndex);
    }

    async uploadChunkToServer(chunkX, dimensionIndex = activeDimension) {
        if (!this.player) return;
        if (!multiplayer) return;
        const chunk = this.getChunkForX(chunkX, dimensionIndex);
        await server.send({
            type: "uploadChunk",
            message: {
                x: chunkX,
                chunk: saveChunk(chunk),
                dimensionIndex: dimensionIndex,
            },
            sender: this.player.UUID,
        });
        console.log(`Uploaded chunk ${chunkX} to server`);
    }

    removeEntity(entity, sync = false) {
        return removeEntity(entity, sync);
    }
}

function removeEntity(entity, sync = false) {
    if (!entity) return;
    if (entity.myChunkX !== null) {
        if (getDimensionChunks(entity.dimension).has(entity.myChunkX)) {
            getDimensionChunks(entity.dimension)
                .get(entity.myChunkX)
                .removeEntityFromChunk(entity);
        }
    }

    // use the UUID to find the entity in the array
    const index = world.entities.findIndex((e) => e.UUID === entity.UUID);

    if (index !== -1) {
        removeParticleEmitter(entity.footstepEmitter);
        world.entities.splice(index, 1);
    }

    if (sync) {
        server.send({ type: "removeEntity", message: { UUID: entity.UUID } });
    }
}

function tick() {
    updateBlocks();

    animateFrame();

    updatePositionalAudioVolumes();

    updateEntities(true);

    world.chunks_in_render_distance.forEach((chunk) => {
        chunk.updateChunk();
    });

    if (settings.lighting) {
        globalUpdateSkyLight();
        globalRecalculateLight();
    }

    globalRecalculateRedstone();
}

function updateParticleEmitters() {
    for (const emitter of world.particleEmitters) {
        emitter.update();
    }
}

function globalRecalculateRedstone() {
    // 1. Reset power on all redstone dust blocks.
    for (const chunk of world.chunks_in_render_distance.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                const def = getBlock(block.blockType);
                if (def.specialType === SpecialType.RedstoneDust) {
                    // Reset dust power.
                    block.redstoneOutput = 0;
                    block.powered = false;
                }
            }
        }
    }

    // 2. Build a global queue seeded with constant power sources and any dust that already has power.
    let queue = [];
    // Offsets for all eight directions.
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

    for (const chunk of world.chunks_in_render_distance.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                const def = getBlock(block.blockType);
                // For constant sources, their redstoneOutput is already set.
                if (block.redstoneOutput && block.redstoneOutput > 0) {
                    queue.push({
                        globalX: block.transform.position.x,
                        globalY: block.transform.position.y,
                    });
                }
                // Also seed any redstone dust that already has output.
                else if (
                    def.specialType === SpecialType.RedstoneDust &&
                    block.redstoneOutput > 0
                ) {
                    queue.push({
                        globalX: block.transform.position.x,
                        globalY: block.transform.position.y,
                    });
                }
            }
        }
    }

    // 3. Propagate redstone power via flood-fill.
    while (queue.length > 0) {
        const { globalX, globalY } = queue.shift();
        const block = world.getBlockAtWorldPosition(globalX, globalY, false);
        if (!block) continue;
        const currentPower = block.redstoneOutput;
        if (currentPower <= 1) continue; // Cannot propagate further

        for (const offset of offsets) {
            const nx = globalX + offset.dx;
            const ny = globalY + offset.dy;
            const neighbor = world.getBlockAtWorldPosition(nx, ny, false);
            if (!neighbor) continue;
            const nDef = getBlock(neighbor.blockType);
            if (nDef.specialType !== SpecialType.RedstoneDust) continue;
            const candidatePower = currentPower - 1;
            if (candidatePower > neighbor.redstoneOutput) {
                neighbor.redstoneOutput = candidatePower;
                queue.push({
                    globalX: neighbor.transform.position.x,
                    globalY: neighbor.transform.position.y,
                });
            }
        }
    }

    // 4. Update each redstone dust block’s "powered" state.
    // We check the block itself and its neighbors.
    const neighborOffsets = [
        { dx: 0, dy: 0 },
        { dx: -BLOCK_SIZE, dy: 0 },
        { dx: BLOCK_SIZE, dy: 0 },
        { dx: 0, dy: -BLOCK_SIZE },
        { dx: 0, dy: BLOCK_SIZE },
    ];

    for (const chunk of world.chunks_in_render_distance.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                let powered = false;
                // Constant sources are always powered.
                if (block.redstoneOutput > 0) {
                    powered = true;
                }
                const globalX = block.transform.position.x;
                const globalY = block.transform.position.y;
                for (const off of neighborOffsets) {
                    const nb = world.getBlockAtWorldPosition(
                        globalX + off.dx,
                        globalY + off.dy,
                        false,
                    );
                    if (nb && nb.redstoneOutput > 0) {
                        powered = true;
                    }
                }
                if (powered) {
                    block.power();
                } else {
                    block.unpower();
                }
                block.redstoneDustUpdateState();
            }
        }
    }
}

function updateBlockAfterTick(block, amount = 1) {
    world.blocksToUpdate.push({ block: block, after: amount });
}

function globalRecalculateLight() {
    // Build a global queue from every light source.
    const queue = [];
    for (let chunk of world.chunks_in_render_distance.values()) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                const inherent = block.lightSourceLevel || 0;
                if (inherent > 0) {
                    if (block.lightLevel < inherent) {
                        block.lightLevel = inherent;
                        block.sunLight = false;
                    }
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
            const neighbor = world.getBlockAtWorldPosition(nx, ny, false);
            if (!neighbor) continue;

            // Exponential decay: reduce light by a factor (e.g., 0.5)
            const decayFactor = 0.8; // Adjust this value to control the steepness of the curve
            const newLight = Math.max(
                1,
                Math.floor(currentLevel * decayFactor),
            ); // Ensure it doesn't go below 1

            if (neighbor.lightLevel < newLight) {
                neighbor.lightLevel = newLight;
                neighbor.sunLight = false;
                queue.push(neighbor);
            }
        }
    }
}

function globalUpdateSkyLight() {
    for (let chunk of world.chunks_in_render_distance.values()) {
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
        let speed = getBlock(block.blockType).updateSpeed; // e.g., 1 or 0.5

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

function getEntityByUUID(uuid) {
    return world.entities.find((entity) => entity.UUID == uuid);
}
