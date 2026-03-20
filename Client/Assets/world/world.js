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
        this.updateBlocks();
        animateFrame();
        updatePositionalAudioVolumes();
        updateEntities(true);
        this.chunks_in_render_distance.forEach((chunk) => {
            chunk.updateChunk();
        });
        if (settings.lighting) {
            this.globalUpdateSkyLight();
            this.globalRecalculateLight();
        }
        this.globalRecalculateRedstone();
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
        return dimensions[index];
    }

    getDimensionChunks(index = activeDimension) {
        return dimensions[index].chunks;
    }

    setBlockType(block, type, updateAdjacent = true) {
        const chunk = this.getDimensionChunks(activeDimension).get(
            block.chunkX,
        );
        if (!chunk) return;
        return chunk.setBlockTypeLocal(
            block.x,
            block.y,
            type,
            block.wall,
            null,
            updateAdjacent,
        );
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

        if (!dimensions[dimensionIndex].pendingBlocks.has(targetChunkX)) {
            dimensions[dimensionIndex].pendingBlocks.set(targetChunkX, {
                dimensionIndex: dimensionIndex,
                blocks: [],
            });
        }
        dimensions[dimensionIndex].pendingBlocks.get(targetChunkX).blocks.push({
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
        if (!entity) return;
        if (entity.myChunkX !== null) {
            if (
                this.getDimensionChunks(entity.dimension).has(entity.myChunkX)
            ) {
                this.getDimensionChunks(entity.dimension)
                    .get(entity.myChunkX)
                    .removeEntityFromChunk(entity);
            }
        }
        const index = this.entities.findIndex((e) => e.UUID === entity.UUID);
        if (index !== -1) {
            removeParticleEmitter(entity.footstepEmitter);
            this.entities.splice(index, 1);
        }
        if (sync) {
            server.send({
                type: "removeEntity",
                message: { UUID: entity.UUID },
            });
        }
    }
    updateParticleEmitters() {
        for (const emitter of this.particleEmitters) {
            emitter.update();
        }
    }
    globalRecalculateRedstone() {
        // 1. Reset power on all redstone dust blocks.
        for (const chunk of this.chunks_in_render_distance.values()) {
            for (let row of chunk.blocks) {
                for (let block of row) {
                    const def = getBlock(block.blockType);
                    if (def.specialType === SpecialType.RedstoneDust) {
                        block.redstoneOutput = 0;
                        block.powered = false;
                    }
                }
            }
        }
        let queue = [];
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
        for (const chunk of this.chunks_in_render_distance.values()) {
            for (let row of chunk.blocks) {
                for (let block of row) {
                    const def = getBlock(block.blockType);
                    if (block.redstoneOutput && block.redstoneOutput > 0) {
                        queue.push({
                            globalX: block.transform.position.x,
                            globalY: block.transform.position.y,
                        });
                    } else if (
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
        while (queue.length > 0) {
            const { globalX, globalY } = queue.shift();
            const block = this.getBlockAtWorldPosition(globalX, globalY, false);
            if (!block) continue;
            const currentPower = block.redstoneOutput;
            if (currentPower <= 1) continue;
            for (const offset of offsets) {
                const nx = globalX + offset.dx;
                const ny = globalY + offset.dy;
                const neighbor = this.getBlockAtWorldPosition(nx, ny, false);
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
        const neighborOffsets = [
            { dx: 0, dy: 0 },
            { dx: -BLOCK_SIZE, dy: 0 },
            { dx: BLOCK_SIZE, dy: 0 },
            { dx: 0, dy: -BLOCK_SIZE },
            { dx: 0, dy: BLOCK_SIZE },
        ];
        for (const chunk of this.chunks_in_render_distance.values()) {
            for (let row of chunk.blocks) {
                for (let block of row) {
                    let powered = false;
                    if (block.redstoneOutput > 0) {
                        powered = true;
                    }
                    const globalX = block.transform.position.x;
                    const globalY = block.transform.position.y;
                    for (const off of neighborOffsets) {
                        const nb = this.getBlockAtWorldPosition(
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
    updateBlockAfterTick(block, amount = 1) {
        this.blocksToUpdate.push({ block: block, after: amount });
    }
    globalRecalculateLight() {
        const queue = [];
        for (let chunk of this.chunks_in_render_distance.values()) {
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
        const offsets = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
        ];
        while (queue.length > 0) {
            const current = queue.shift();
            const currentLevel = current.lightLevel;
            if (currentLevel <= 1) continue;
            const currentPosX = current.transform.position.x;
            const currentPosY = current.transform.position.y;
            for (const offset of offsets) {
                const nx = currentPosX + offset.dx * BLOCK_SIZE;
                const ny = currentPosY + offset.dy * BLOCK_SIZE;
                const neighbor = this.getBlockAtWorldPosition(nx, ny, false);
                if (!neighbor) continue;
                const decayFactor = 0.8;
                const newLight = Math.max(
                    1,
                    Math.floor(currentLevel * decayFactor),
                );
                if (neighbor.lightLevel < newLight) {
                    neighbor.lightLevel = newLight;
                    neighbor.sunLight = false;
                    queue.push(neighbor);
                }
            }
        }
    }
    globalUpdateSkyLight() {
        for (let chunk of this.chunks_in_render_distance.values()) {
            chunk.updateSkyLight();
        }
    }
    updateBlocks() {
        for (let i = updatingBlocks.length - 1; i >= 0; i--) {
            let block = updatingBlocks[i];
            let speed = getBlock(block.blockType).updateSpeed;
            if (block._updateAccumulator === undefined) {
                block._updateAccumulator = 0;
            }
            block._updateAccumulator += speed;
            if (block._updateAccumulator >= 1) {
                block.update();
                block._updateAccumulator -= 1;
            }
        }
    }
    getEntityByUUID(uuid) {
        return this.entities.find((entity) => entity.UUID == uuid);
    }
}
