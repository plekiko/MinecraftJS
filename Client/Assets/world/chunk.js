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

        if (specialWorldProps.void) {
            this.generated = true;

            if (specialWorldProps.skyblock && this.x == 0) {
                this.generateSkyBlock();
                return;
            }

            if (this.x == 0) this.generateVoidBlock();

            return;
        }

        this.generateHeight(); // Generate terrain height
    }

    generateVoidBlock() {
        this.setBlockType(0, CHUNK_HEIGHT / 2, Blocks.Glass);
    }

    generateSkyBlock() {
        const length = 4;

        // Grass layer
        for (
            let i = -BLOCK_SIZE * length;
            i < BLOCK_SIZE * length;
            i += BLOCK_SIZE
        ) {
            this.setBlockTypeAtPosition(
                i,
                (CHUNK_HEIGHT / 2) * BLOCK_SIZE,
                Blocks.GrassBlock
            );
        }

        // Dirt layers 2 thick
        for (
            let y = (CHUNK_HEIGHT / 2) * BLOCK_SIZE - BLOCK_SIZE;
            y > (CHUNK_HEIGHT / 2) * BLOCK_SIZE - BLOCK_SIZE * 3;
            y -= BLOCK_SIZE
        ) {
            for (
                let i = -BLOCK_SIZE * length;
                i < BLOCK_SIZE * length;
                i += BLOCK_SIZE
            ) {
                this.setBlockTypeAtPosition(i, y, Blocks.Dirt);
            }
        }

        // Chest
        GenerateChestWithLoot(
            new LootTable([
                new LootItem({ blockId: Blocks.IceBlock, maxCount: 1 }),
                new LootItem({ itemId: Items.LavaBucket, maxCount: 1 }),
                new LootItem({ itemId: Items.Seeds, maxCount: 3 }),
            ]),
            -BLOCK_SIZE * 3,
            (CHUNK_HEIGHT / 2) * BLOCK_SIZE + BLOCK_SIZE,
            this
        );

        // Tree
        setTimeout(() => {
            this.spawnTreeAt(Trees.Oak.variants[1], 2, CHUNK_HEIGHT / 2 + 1);
        }, 10);
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
            let height = this.getHeight(x);

            if (specialWorldProps.flat) {
                height = CHUNK_HEIGHT / 2;
            }

            if (specialWorldProps.redstone) {
                // Set all blocks to Sandstone
                for (let y = 0; y < height; y++) {
                    this.setBlockType(x, y, Blocks.SandStone);
                }
                continue;
            }

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
        if (!GAMERULES.doMobSpawning) return;

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
            }, 200);
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
        if (!randomTree) return;
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
        this.generateOre(
            worldRedstoneNoiseMap,
            ORE_THRESHOLDS.redstone,
            Blocks.RedstoneOre,
            300000,
            30
        );
        this.generateOre(
            worldGoldNoiseMap,
            ORE_THRESHOLDS.gold,
            Blocks.GoldOre,
            400000,
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

        // Select a random variant from the tree
        const structure = tree.blocks; // Get the block layout

        // Randomly choose to flip (mirroring) the structure.
        const flip = RandomRange(0, 2) === 1; // flip is true 50% of the time

        const treeHeight = structure.length;
        const treeWidth = structure[0].length;

        // Calculate the bottom center of the tree
        const offsetX = Math.floor(treeWidth / 2) * BLOCK_SIZE;
        const offsetY = 0; // Bottom-most row is the base

        for (let i = 0; i < treeHeight; i++) {
            const layerWidth = structure[i].length;
            for (let j = 0; j < layerWidth; j++) {
                const flippedI = treeHeight - i - 1;

                const block = structure[flippedI][j];

                if (block === Blocks.Air) continue; // Skip air blocks

                // If flipped, mirror the column index.
                const columnIndex = flip ? layerWidth - 1 - j : j;

                // Calculate the world coordinates
                const worldX =
                    this.x +
                    x * BLOCK_SIZE -
                    offsetX +
                    columnIndex * BLOCK_SIZE;
                const worldY = y * BLOCK_SIZE - offsetY + i * BLOCK_SIZE;

                if (GetBlock(block).noPriority) {
                    // Check if there already is a block at this position

                    const blockAtPos = GetBlockAtWorldPosition(
                        worldX,
                        CHUNK_HEIGHT * BLOCK_SIZE - worldY - BLOCK_SIZE
                    );

                    if (blockAtPos)
                        if (!GetBlock(blockAtPos.blockType)?.air) {
                            continue;
                        }
                }

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
        calculate = true,
        updateBlocks = false
    ) {
        const array = wall ? this.walls : this.blocks;

        if (calculate) y = this.calculateY(y); // y is now in chunk's internal bottom-up system
        if (!array[y] || !array[y][x]) return false; // Out of bounds check

        const block = array[y][x];
        if (block.blockType === blockType) return false; // No change needed

        const blockDef = GetBlock(blockType);
        let linkedBlocks = [];

        // Handle extended blocks
        if (blockDef.extendedBlock) {
            // First pass: Validate all extended block positions
            for (let i = 0; i < blockDef.extendedBlock.length; i++) {
                const extendedBlock = blockDef.extendedBlock[i];
                const xOff = extendedBlock.offset.x;
                const yOff = extendedBlock.offset.y;

                const xIndex = x + xOff;
                const yIndex = y - yOff;

                const worldX = this.x + xIndex * BLOCK_SIZE;
                const worldY = yIndex * BLOCK_SIZE; // Bottom-up world Y

                const targetChunk = this.getChunkForBlock(worldX);
                if (!targetChunk) {
                    // Buffer if chunk doesn’t exist (will handle linkedBlocks later)
                    this.setBlockTypeAtPosition(
                        worldX,
                        worldY,
                        extendedBlock.blockId,
                        metaData,
                        wall
                    );
                    continue;
                }

                const localX = Math.floor(
                    (worldX - targetChunk.x) / BLOCK_SIZE
                );
                const localY = Math.floor(worldY / BLOCK_SIZE);

                if (
                    localX < 0 ||
                    localX >= targetChunk.width ||
                    localY < 0 ||
                    localY >= targetChunk.height
                ) {
                    // Buffer if out of bounds
                    this.setBlockTypeAtPosition(
                        worldX,
                        worldY,
                        extendedBlock.blockId,
                        metaData,
                        wall
                    );
                    continue;
                }

                const blockAtPos = targetChunk.getBlock(
                    localX,
                    localY,
                    false,
                    wall
                );
                const blockAtPosDef = blockAtPos
                    ? GetBlock(blockAtPos.blockType)
                    : null;

                if (
                    !blockAtPosDef ||
                    (!blockAtPosDef.air && !blockAtPosDef.replaceable)
                ) {
                    return false; // Abort if any extended block can’t be placed
                }
            }

            // Second pass: Place extended blocks and collect references
            const extendedBlockRefs = [];
            for (let i = 0; i < blockDef.extendedBlock.length; i++) {
                const extendedBlock = blockDef.extendedBlock[i];
                const xOff = extendedBlock.offset.x;
                const yOff = extendedBlock.offset.y;

                const xIndex = x + xOff;
                const yIndex = y - yOff;

                const worldX = this.x + xIndex * BLOCK_SIZE;
                const worldY = yIndex * BLOCK_SIZE;

                const targetChunk = this.getChunkForBlock(worldX);
                if (!targetChunk) {
                    this.setBlockTypeAtPosition(
                        worldX,
                        worldY,
                        extendedBlock.blockId,
                        metaData,
                        wall
                    );
                    linkedBlocks.push({
                        x: worldX,
                        y: worldY,
                        blockType: extendedBlock.blockId,
                    });
                    continue;
                }

                const localX = Math.floor(
                    (worldX - targetChunk.x) / BLOCK_SIZE
                );
                const localY = Math.floor(worldY / BLOCK_SIZE);

                // Place the block and get its reference
                targetChunk.setBlockType(
                    localX,
                    localY,
                    extendedBlock.blockId,
                    wall,
                    metaData,
                    false
                );
                const extendedBlockRef = targetChunk.getBlock(
                    localX,
                    localY,
                    false,
                    wall
                );
                extendedBlockRefs.push(extendedBlockRef);
                linkedBlocks.push({
                    x: worldX,
                    y: worldY,
                    blockType: extendedBlock.blockId,
                });
            }

            // Set the main block
            block.setBlockType(blockType);
            linkedBlocks.push({ ...this.localToWorld(x, y, false), blockType });

            // Assign linkedBlocks to all affected blocks
            const allBlocks = [block, ...extendedBlockRefs];
            for (let linkedBlock of allBlocks) {
                if (linkedBlock) {
                    linkedBlock.linkedBlocks = linkedBlocks;
                }
            }
        } else {
            // No extended blocks, just set the main block
            block.setBlockType(blockType);
            linkedBlocks.push({ ...this.localToWorld(x, y, false), blockType });
            block.linkedBlocks = linkedBlocks;
        }

        // Update chunk logic
        if (blockDef.chunkUpdate) {
            if (!this.update.includes(block)) {
                this.update.push(block);
            }
        } else {
            const index = this.update.indexOf(block);
            if (index !== -1) {
                this.update.splice(index, 1);
            }
        }

        if (updateBlocks) {
            this.updateAdjacentBlocks(
                x,
                y,
                blockType,
                wall,
                metaData,
                calculate
            );
        }

        block.dark = wall;
        block.wall = wall;

        if (metaData !== null) block.setBlockMetaData(metaData);

        return true;
    }

    localToWorld(x, y, calculate = true) {
        if (calculate) y = this.calculateY(y);
        return { x: x * BLOCK_SIZE + this.x, y: y * BLOCK_SIZE };
    }

    updateAdjacentBlocks(x, y, blockType, wall, metaData, calculate) {
        const currentBlockDef = GetBlock(blockType);
        const blockBeneath = GetBlock(
            this.getBlock(x, y + 1, calculate, wall)?.blockType
        );
        const blockAbove = GetBlock(
            this.getBlock(x, y - 1, calculate, wall)?.blockType
        );

        // Case 1: Update block beneath (e.g., grass below turns to dirt)
        if (blockBeneath && blockBeneath.changeToBlockWithBlockAbove) {
            if (currentBlockDef?.collision) {
                this.setBlockType(
                    x,
                    y + 1,
                    blockBeneath.changeToBlockWithBlockAbove,
                    wall,
                    metaData,
                    calculate
                );
            }
        }

        // Case 2: Update the placed block itself (e.g., grass turns to dirt if block above)
        if (currentBlockDef?.changeToBlockWithBlockAbove) {
            if (blockAbove && blockAbove.collision) {
                this.setBlockType(
                    x,
                    y,
                    currentBlockDef.changeToBlockWithBlockAbove,
                    wall,
                    metaData,
                    calculate
                );
            }
        }
    }

    //#region Lighting

    updateSkyLight() {
        if (specialWorldProps.void) return;

        // Define key points and transition zones
        const dayStart = 1; // Full day
        const duskStart = 3; // Start of transition to night
        const nightStart = 3.5; // Full night begins
        const nightEnd = 6.5; // Full night ends
        const dawnStart = 6.7; // Start of transition to day
        const dayEnd = 7.3; // Full day, loops back to 1

        // Calculate dayNightFactor (1 = full day, 0 = full night)
        let dayNightFactor;

        if (time <= duskStart) {
            // Full day (1 to 3)
            dayNightFactor = 1;
        } else if (time < nightStart) {
            // Dusk transition (3 to 3.5)
            dayNightFactor = 1 - (time - duskStart) / (nightStart - duskStart);
        } else if (time <= nightEnd) {
            // Full night (3.5 to 6.5)
            dayNightFactor = 0;
        } else if (time < dawnStart) {
            // Dawn transition (6.5 to 6.7)
            dayNightFactor = (time - nightEnd) / (dawnStart - nightEnd);
        } else {
            // Full day (6.7 to 7.3)
            dayNightFactor = 1;
        }

        // Maximum skylight: 15 during day, 1 at night
        const maxSkyLight = Math.floor(1 + 14 * dayNightFactor);

        // Loop over every column in the chunk
        for (let x = 0; x < this.width; x++) {
            let skyLight = maxSkyLight;
            let stopped = false;

            for (let y = 0; y < this.height; y++) {
                const block = this.blocks[y][x];
                block.lightLevel = skyLight;
                block.sunLight = false;

                const def = GetBlock(block.blockType);

                if (
                    (!def.air && !def.transparent && def.collision) ||
                    y > CHUNK_HEIGHT - (TERRAIN_HEIGHT + this.biome.waterLevel)
                ) {
                    skyLight = Math.max(skyLight - 1, 1);
                    stopped = true;
                } else {
                    if (!stopped) {
                        skyLight = maxSkyLight;
                        block.sunLight = true;
                    } else {
                        skyLight = Math.max(skyLight - 1, 1);
                    }
                }
            }
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
