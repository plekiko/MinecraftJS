class Chunk {
    constructor(
        x = 0,
        width = 8,
        biome = Biomes.Planes,
        previousChunk = null,
        pendingBlocks = new Map(),
        worldGrassNoiseMap = new Noise(),
        generated = false
    ) {
        this.biome = biome;
        this.previousChunk = previousChunk;
        this.x = x;
        this.blocks = [];
        this.walls = [];
        this.width = width;
        this.height = CHUNK_HEIGHT;
        this.generated = generated;
        this.pendingBlocks = pendingBlocks;
        this.grassNoiseMap = worldGrassNoiseMap;

        this.entities = [];
        this.update = [];
        this.spawnTime = 0;

        this.lightSources = [];

        this.generateChunk();
    }

    generateArray() {
        // Initialize blocks array for chunk
        for (let y = 0; y < this.height; y++) {
            this.blocks[y] = [];
            this.walls[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.blocks[y][x] = new Block(x, y, Blocks.Air, this.x);
                this.walls[y][x] = new Block(x, y, Blocks.Air, this.x, true);

                this.blocks[y][x].setBlockType(Blocks.Air, true);
                this.walls[y][x].setBlockType(Blocks.Air, true);
            }
        }
    }

    generateChunk() {
        if (this.generated) return;
        this.generateArray(); // Initialize blocks
        this.generateHeight(); // Generate terrain height
    }

    getHeight(x) {
        // Compute the world x coordinate for noise sampling.
        const worldX = this.x / BLOCK_SIZE + x;
        let heightNoise = this.biome.heightNoise;

        // Determine left and right neighbor chunks.
        // Only use leftChunk if its x is less than this.x.
        let leftChunk = null;
        if (
            this.previousChunk &&
            this.previousChunk.x < this.x &&
            this.previousChunk.biome.heightNoise !== heightNoise
        ) {
            leftChunk = this.previousChunk;
        }

        // Look up the right neighbor chunk.
        const rightChunkX = this.x + CHUNK_WIDTH * BLOCK_SIZE;
        let rightChunk = chunks.get(rightChunkX);
        if (
            rightChunk &&
            rightChunk.x > this.x &&
            rightChunk.biome.heightNoise === heightNoise
        ) {
            // If the biome is the same, we don't need blending.
            rightChunk = null;
        }

        // Determine blend factors based on how far the block is from the chunk edges.
        let leftBlend = 0;
        if (leftChunk) {
            // Near the left edge, blend factor is high (1 at edge, 0 in the middle)
            leftBlend = (CHUNK_WIDTH - x) / CHUNK_WIDTH;
        }

        let rightBlend = 0;
        if (rightChunk) {
            // Near the right edge, blend factor is high (0 at left edge, 1 at edge)
            rightBlend = x / CHUNK_WIDTH;
        }

        // Helper function: blend a given noise layer with a neighbor if needed.
        const blendLayer = (offset, scale) => {
            const currentVal = heightNoise.getNoise(worldX, offset, scale);
            if (leftBlend > 0 && leftChunk) {
                const leftVal = leftChunk.biome.heightNoise.getNoise(
                    worldX,
                    offset,
                    scale
                );
                return lerpEaseInOut(leftVal, currentVal, 1 - leftBlend);
            }
            if (rightBlend > 0 && rightChunk) {
                const rightVal = rightChunk.biome.heightNoise.getNoise(
                    worldX,
                    offset,
                    scale
                );
                return lerpEaseInOut(currentVal, rightVal, rightBlend);
            }
            return currentVal;
        };

        // Blend each noise layer.
        const layer1 = blendLayer(0, 1);
        const layer2 = blendLayer(100000, 3);
        const layer3 = blendLayer(500000, 5);
        const layer4 = blendLayer(1000000, 7);
        const noiseAverage = (layer1 + layer2 + layer3 + layer4) / 4;

        // Blend the biome's minimum height value.
        let currentMin = heightNoise.min;
        let blendedMin = currentMin;
        if (leftBlend > 0 && leftChunk) {
            blendedMin = lerpEaseInOut(
                leftChunk.biome.heightNoise.min,
                currentMin,
                1 - leftBlend
            );
        } else if (rightBlend > 0 && rightChunk) {
            blendedMin = lerpEaseInOut(
                currentMin,
                rightChunk.biome.heightNoise.min,
                rightBlend
            );
        }

        return Math.floor(blendedMin + noiseAverage);
    }

    getWorldX(x) {
        return this.x + x;
    }

    applyBufferedBlocks() {
        const chunkX = this.x; // The x position of this chunk in world space
        if (pendingBlocks.has(chunkX)) {
            const blocksToPlace = pendingBlocks.get(chunkX);
            blocksToPlace.forEach((block) => {
                // console.log("Placed buffered " + block.blockType.name + " at " + block.x + " - " + block.y);

                if (block.blockType !== Blocks.Air)
                    this.setBlockTypeAtPosition(
                        block.x,
                        block.y,
                        block.blockType,
                        block.metaData,
                        block.wall
                    );
            });
            // Once the blocks are placed, remove them from the buffer
            pendingBlocks.delete(chunkX);
        }
    }

    generateHeight() {
        for (let x = 0; x < this.width; x++) {
            const height = this.getHeight(x);

            // Draw the top layer (first level) with a constant thickness.
            for (let y = height; y > height - this.biome.firstLayerWidth; y--) {
                this.setBlockType(x, y, this.biome.topLayer);
            }

            // Draw the second layer immediately below the top layer.
            for (
                let y = height - this.biome.firstLayerWidth;
                y >
                height -
                    this.biome.firstLayerWidth -
                    this.biome.secondLayerWidth;
                y--
            ) {
                this.setBlockType(x, y, this.biome.secondLayer);
            }

            // Fill the remaining depth with stone.
            for (
                let y =
                    height -
                    this.biome.firstLayerWidth -
                    this.biome.secondLayerWidth;
                y > 0;
                y--
            ) {
                this.setBlockType(x, y, Blocks.Stone);
                // Optionally set additional properties (e.g., variant) if needed.
                this.setBlockType(x, y, Blocks.Stone, true);
            }
        }
    }

    generateWater() {
        const maxWaterLevel = TERRAIN_HEIGHT + this.biome.waterLevel; // Calculate max water height

        for (let x = 0; x < this.width; x++) {
            const terrainHeight = this.getHeight(x); // Get terrain height at this x

            // Loop from one level above the terrain up to the max water level
            for (let y = terrainHeight + 1; y <= maxWaterLevel; y++) {
                const blockType = this.getBlockType(x, y);

                // Place water only if the block is air (empty)
                if (GetBlock(blockType).air) {
                    this.setBlockType(x, y, Blocks.Water);
                }

                if (
                    this.getDown(x, y) &&
                    this.getDown(x, y).blockType == this.biome.topLayer
                )
                    this.setBlockType(x, y - 1, Blocks.Sand);
                if (
                    this.getLeft(x, y) &&
                    this.getLeft(x, y).blockType == this.biome.topLayer
                )
                    this.setBlockType(x - 1, y, Blocks.Sand);
                if (
                    this.getRight(x, y) &&
                    this.getRight(x, y).blockType == this.biome.topLayer
                )
                    this.setBlockType(x + 1, y, Blocks.Sand);
            }
        }
    }

    spawnMobs(passive = true) {
        if (
            (this.biome.mobs.length == 0 && passive) ||
            (this.biome.googlies.length == 0 && !passive)
        )
            return;

        const count = RandomRange(-this.biome.maxMobs, this.biome.maxMobs);

        if (count <= 0) {
            this.setMobSpawnTime();
            return;
        }

        for (let i = 0; i < count; i++) {
            const randomX = RandomRange(0, CHUNK_WIDTH);

            const randomEntity = passive
                ? this.biome.mobs[RandomRange(0, this.biome.mobs.length)]
                : this.biome.googlies[
                      RandomRange(0, this.biome.googlies.length)
                  ];

            const entity = summonEntity(
                Entities[randomEntity],
                new Vector2(randomX * BLOCK_SIZE + this.x, 0),
                { myChunkX: this.x }
            );

            this.entities.push(entity);

            setTimeout(() => {
                entity.setOnGround();
            }, 500);
        }
    }

    removeEntityFromChunk(entity) {
        const index = this.entities.indexOf(entity);
        this.entities.splice(index, 1);

        if (this.spawnTime) return;

        if (this.entities.length === 0) {
            this.setMobSpawnTime();
        }
    }

    setMobSpawnTime() {
        // chat.message("set spawn");

        this.spawnTime = RandomRange(mobSpawnDelay.min, mobSpawnDelay.max);
    }

    updateChunk() {
        // Iterate backwards in case blocks remove themselves from the update array.
        for (let i = this.update.length - 1; i >= 0; i--) {
            const block = this.update[i];
            // Retrieve the block's updateSpeed from its block data.
            const speed = GetBlock(block.blockType).updateSpeed || 1;

            // Initialize the accumulator if it doesn't exist.
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

    checkForBlockWithAirBeneath(x, y) {
        const blockData = this.getBlockTypeData(x, y - 1, false);

        if (!blockData) return;

        const block = this.getBlock(x, y - 1, false);

        if (blockData.breakWithoutBlockUnderneath)
            block.breakBlock(blockData.dropWithoutTool);

        if (blockData.fall) block.gravityBlock();
    }

    getAllBlocks(blockType) {
        const returnBlocks = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const block = this.blocks[y][x];
                if (block.blockType === blockType) returnBlocks.push(block);
            }
        }

        return returnBlocks;
    }

    getDown(x, y) {
        return this.getBlock(x, y - 1); // Block below
    }

    getUp(x, y) {
        y = this.calculateY(y);
        return this.getBlock(x, y + 1); // Block above
    }

    getLeft(x, y) {
        return this.getBlock(x - 1, y); // Block to the left
    }

    getRight(x, y) {
        return this.getBlock(x + 1, y); // Block to the right
    }

    generateBedrock() {
        for (let i = 0; i < this.width; i++) {
            this.setBlockType(i, 0, Blocks.Bedrock); // Set bedrock at the bottom
        }
    }

    generateTrees() {
        if (!this.biome.treeType) return;
        if (this.biome.treeType.length == 0) return;
        for (
            let i = this.x;
            i < this.x + CHUNK_WIDTH * BLOCK_SIZE;
            i += BLOCK_SIZE
        ) {
            const noiseOutput = worldTreeNoiseMap.getNoise(i);
            if (noiseOutput >= this.biome.treeThreshold) {
                this.spawnTree(this.getLocalX(i, this));
            }
        }
    }

    generateGrass() {
        if (!this.biome.grassType) return;
        if (this.biome.grassType.length == 0) return;
        for (let x = 0; x < CHUNK_WIDTH; x++) {
            if (this.grassNoiseMap.getNoise(this.getWorldX(x)) >= 1) {
                const y = this.findGroundLevel(x, false, true);
                if (!GetBlock(this.getBlockType(x, y)).air) continue;
                const randomGrass =
                    this.biome.grassType[
                        RandomRange(0, this.biome.grassType.length)
                    ];
                this.setBlockType(x, y, randomGrass);
            }
        }
    }

    spawnTree(x) {
        const y = this.findGroundLevel(x, false, true); // Find valid ground level
        if (!GetBlock(this.getBlockType(x, y)).air) return;
        const randomTree = this.getRandomTreeFromBiome(); // Pick a random tree
        this.spawnTreeAt(randomTree, x, y); // Spawn the tree at the position
    }

    findGroundLevel(x, correctY = false, validGround = false) {
        for (let y = this.height - 1; y >= 0; y--) {
            const blockAtPos = this.getBlockType(x, y);
            if (
                blockAtPos != Blocks.GrassBlock &&
                blockAtPos != Blocks.SnowedGrassBlock &&
                blockAtPos != Blocks.Sand &&
                blockAtPos != Blocks.Podzol
            ) {
                if (validGround) continue;
            }
            if (!GetBlock(blockAtPos).collision) continue;
            if (correctY) return CHUNK_HEIGHT - y - 1;
            return y + 1;
        }
        return 0;
    }

    generateCaves() {
        const halfwayPoint = this.biome.heightNoise.min / 1.2;

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let x = 0; x < CHUNK_WIDTH; x++) {
                const noiseValue = worldCaveNoiseMap.getNoise(
                    x + this.x / BLOCK_SIZE,
                    y
                );

                let dynamicThreshold = CAVES_THRESHOLD;

                // Apply linear adjustment only from halfway up to the top
                if (y >= halfwayPoint) {
                    const heightFactor =
                        (y - halfwayPoint) /
                        (this.biome.heightNoise.min - halfwayPoint);
                    dynamicThreshold =
                        CAVES_THRESHOLD * (1 - Math.min(heightFactor, 1));
                }

                // Check if the noise value meets the adjusted threshold
                if (noiseValue <= dynamicThreshold) {
                    this.setBlockType(x, y, Blocks.Air); // Create cave openings
                }
            }
        }
    }

    generateOres() {
        this.generateOre(
            worldCoalNoiseMap,
            ORE_THRESHOLDS.coal,
            Blocks.CoalOre,
            0
        );
        this.generateOre(
            worldIronNoiseMap,
            ORE_THRESHOLDS.iron,
            Blocks.IronOre,
            100000
        );
        this.generateOre(
            worldDiamondNoiseMap,
            ORE_THRESHOLDS.diamond,
            Blocks.DiamondOre,
            200000,
            25
        );
    }

    generateOre(noise, threshold, block, offset, height = CHUNK_HEIGHT) {
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let x = 0; x < CHUNK_WIDTH; x++) {
                const noiseValue = noise.getNoise(
                    x + this.x / BLOCK_SIZE,
                    y + offset
                );

                if (this.getBlockType(x, y) != Blocks.Stone) continue;

                if (noiseValue > threshold) continue;

                if (y > height) continue;

                this.setBlockType(x, y, block);
            }
        }
    }

    getRandomTreeFromBiome() {
        const trees = this.biome.treeType;
        const variants = trees[RandomRange(0, trees.length)].variants;
        return variants[RandomRange(0, variants.length)];
    }

    spawnTreeAt(tree, x, y) {
        if (y <= 3) return;

        // Randomly choose to flip (mirroring) the structure.
        const flip = RandomRange(0, 2) === 1; // flip is true 50% of the time

        const treeHeight = tree.length;
        for (let i = 0; i < treeHeight; i++) {
            const layerWidth = tree[i].length;
            for (let j = 0; j < layerWidth; j++) {
                const block = tree[i][j];
                // If flipped, mirror the column index.
                if (block === Blocks.Air) continue;
                const columnIndex = flip ? layerWidth - 1 - j : j;

                // Calculate the world x-coordinate using the (possibly flipped) column index.
                const worldX =
                    this.x +
                    x * BLOCK_SIZE -
                    Math.floor(layerWidth / 2) * BLOCK_SIZE +
                    columnIndex * BLOCK_SIZE;

                const worldY = y * BLOCK_SIZE + i * BLOCK_SIZE;
                this.setBlockTypeAtPosition(worldX, worldY, block);
            }
        }
    }

    setBlockTypeAtPosition(
        worldX,
        worldY,
        blockType,
        metaData = null,
        wall = false
    ) {
        // Compute the target chunk's x-coordinate in world space.
        const chunkWidthPixels = CHUNK_WIDTH * BLOCK_SIZE;
        const targetChunkX =
            Math.floor(worldX / chunkWidthPixels) * chunkWidthPixels;
        const targetChunk = chunks.get(targetChunkX);

        if (targetChunk && worldY < targetChunk.height * BLOCK_SIZE) {
            // Calculate local X relative to the target chunk.
            const localX = Math.floor((worldX - targetChunk.x) / BLOCK_SIZE);
            const localY = Math.floor(worldY / BLOCK_SIZE);

            targetChunk.setBlockType(localX, localY, blockType, wall, metaData);
        } else {
            // Buffer the block to place it once the chunk is generated.
            if (!pendingBlocks.has(targetChunkX)) {
                pendingBlocks.set(targetChunkX, []);
            }
            pendingBlocks
                .get(targetChunkX)
                .push({ x: worldX, y: worldY, blockType, metaData, wall });
            // Optionally log: console.log(`Buffered block at worldX: ${worldX}, worldY: ${worldY}`);
        }
    }

    getChunkForBlock(worldX) {
        const chunkX =
            Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
            CHUNK_WIDTH *
            BLOCK_SIZE;
        return chunks.get(chunkX); // Use the Map to get the chunk by its x-coordinate
    }

    getLocalX(worldX, targetChunk = this) {
        return (worldX - targetChunk.x) / BLOCK_SIZE; // Scale the position to the block grid using BLOCK_SIZE
    }

    getBlockType(x, y, calculated = true) {
        if (calculated) y = this.calculateY(y);
        if (!this.blocks[y]) return null;
        return this.blocks[y][x].blockType;
    }

    getBlock(x, y, calculated = true, wall = false) {
        if (calculated) y = this.calculateY(y);

        if (!wall) {
            if (!this.blocks[y]) return null;
            if (!this.blocks[y][x]) return null;

            return this.blocks[y][x];
        } else {
            if (!this.walls[y]) return null;
            if (!this.walls[y][x]) return null;

            return this.walls[y][x];
        }
    }

    getBlockTypeData(x, y, calculate = true, wall = false) {
        if (calculate) y = this.calculateY(y);

        if (!wall) {
            if (!this.blocks[y]) return null;
            if (!this.blocks[y][x]) return null;
            return GetBlock(this.blocks[y][x].blockType);
        } else {
            if (!this.walls[y]) return null;
            if (!this.walls[y][x]) return null;
            return GetBlock(this.walls[y][x].blockType);
        }
    }

    setBlockType(
        x,
        y,
        blockType,
        wall = false,
        metaData = null,
        calculate = true
    ) {
        const array = wall ? this.walls : this.blocks;

        if (calculate) y = this.calculateY(y);
        if (array[y] && array[y][x]) {
            const block = array[y][x];
            if (block.blockType !== blockType) {
                block.setBlockType(blockType);

                if (GetBlock(blockType).chunkUpdate) {
                    if (!this.update.includes(block)) {
                        this.update.push(block);
                    }
                } else {
                    const index = this.update.indexOf(block);
                    if (index !== -1) {
                        this.update.splice(index, 1);
                    }
                }

                block.dark = wall;
                block.wall = wall;
                if (metaData !== null) block.metaData = metaData;
            }
        }
    }

    //#region Lighting

    updateSkyLight() {
        // Loop over every column in the chunk.
        for (let x = 0; x < this.width; x++) {
            // Start at full sky light (15) at the top.
            let skyLight = 15;
            let stopped = false;
            // Loop from the top (row 0) downward.
            for (let y = 0; y < this.height; y++) {
                const block = this.blocks[y][x];
                // Set the current block's light level.
                block.lightLevel = skyLight;

                // Get the block definition.
                const def = GetBlock(block.blockType);

                // If the block is opaque (i.e. not air and not transparent),
                // degrade sky light faster (for example, subtract 3).
                // Otherwise, if it is air or transparent, degrade it by 1.
                if (
                    (!def.air && !def.transparent && def.collision) ||
                    y > this.biome.heightNoise.min * 1.8
                ) {
                    skyLight = Math.max(skyLight - 1, 1);
                    stopped = true;
                } else {
                    if (stopped) continue;
                    skyLight = 15;
                }
            }
        }
    }

    addLightSource(pos, level, calculate = true) {
        // If there already is a light source at this position, remove it.
        this.lightSources = this.lightSources.filter(
            (source) => source.pos.x !== pos.x || source.pos.y !== pos.y
        );

        this.lightSources.push({ pos, level });

        if (calculate) this.calculateLighting();
    }

    removeLightSource(pos, calculate = true) {
        const oldLength = this.lightSources.length;

        this.lightSources = this.lightSources.filter(
            (source) => source.pos.x !== pos.x || source.pos.y !== pos.y
        );

        if (this.lightSources.length !== oldLength)
            if (calculate) this.calculateLightingAround();
    }

    calculateLighting() {
        this.updateSkyLight();

        this.calculateSources();
    }

    calculateLightingAround() {
        // Get chunks around this chunk
        const leftChunk = chunks.get(this.x - CHUNK_WIDTH * BLOCK_SIZE);
        const rightChunk = chunks.get(this.x + CHUNK_WIDTH * BLOCK_SIZE);

        // Calculate lighting for the chunks around this chunk
        if (leftChunk) leftChunk.calculateLighting();
        if (rightChunk) rightChunk.calculateLighting();
    }

    calculateSources() {
        this.lightSources.forEach((source) => {
            this.calculateLightSource(source.pos, source.level);
        });
    }

    calculateLightSource(localPos, level) {
        // Convert the local chunk position to global coordinates.
        // (Assuming each block is BLOCK_SIZE pixels wide, and the chunk's x position is stored in this.x.)
        const globalPos = {
            x: this.x + localPos.x * BLOCK_SIZE,
            y: localPos.y * BLOCK_SIZE,
        };

        const queue = [];
        queue.push({ x: globalPos.x, y: globalPos.y, level: level });

        const offsets = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
        ];

        while (queue.length > 0) {
            const { x, y, level } = queue.shift();
            if (level <= 0) continue;

            // Get the block at the global position.
            const block = GetBlockAtWorldPosition(x, y, false);
            if (!block) continue;

            // Only update if the new level is greater than the current light level.
            if (block.lightLevel >= level) continue;
            block.lightLevel = level;

            // Enqueue the 4 neighbors with a decremented light level.
            for (const offset of offsets) {
                queue.push({
                    x: x + offset.dx * BLOCK_SIZE,
                    y: y + offset.dy * BLOCK_SIZE,
                    level: level - 1,
                });
            }
        }
    }

    setLightLevel(x, y, level) {
        if (level <= 0) return;
        const block = this.getBlock(x, y);
        if (block && block.lightLevel < level) {
            block.lightLevel = level;
        }
    }

    //#endregion

    calculateY(y) {
        return this.height - 1 - y;
    }

    countAirBlockArea(startX, startY) {
        if (!GetBlock(this.getBlockType(startX, startY)).air) {
            return 0;
        }

        const queue = [];
        const visited = new Set();
        let areaSize = 0;

        const tryAddToQueue = (x, y) => {
            const key = `${x},${y}`;
            if (
                x >= 0 &&
                x < this.width &&
                y >= 0 &&
                y < this.height &&
                !visited.has(key) &&
                GetBlock(this.getBlockType(x, y)).air
            ) {
                queue.push([x, y]);
                visited.add(key);
            }
        };

        queue.push([startX, startY]);
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            areaSize++;

            tryAddToQueue(x + 1, y);
            tryAddToQueue(x - 1, y);
            tryAddToQueue(x, y + 1);
            tryAddToQueue(x, y - 1);
        }

        return areaSize;
    }

    //#region Drawing

    draw(ctx, camera) {
        this.drawBlocks(ctx, this.walls, camera);
        this.drawBlocks(ctx, this.blocks, camera);
    }

    drawBlocks(ctx, blocks, camera) {
        for (let i = 0; i < blocks.length; i++) {
            for (let j = 0; j < blocks[i].length; j++) {
                const block = blocks[i][j];

                const worldX = j * BLOCK_SIZE; // Use j for x (horizontal)

                const worldY = i * BLOCK_SIZE; // Use i for y (vertical)

                this.drawBlockAtPosition(ctx, block, worldX, worldY, camera);
            }
        }
    }

    drawBlockAtPosition(ctx, block, x, y, camera) {
        block.transform.position.x = x + this.x;
        block.transform.position.y = y;

        block.draw(ctx, camera);
    }

    //#endregion
}
