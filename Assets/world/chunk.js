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
        this.spawnTime = 0;

        this.generateChunk();
    }

    generateArray() {
        // Initialize blocks array for chunk
        for (let y = 0; y < this.height; y++) {
            this.blocks[y] = [];
            this.walls[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.blocks[y][x] = new Block(x, y, Blocks.Air, this.x); // Set default as air block
                this.walls[y][x] = new Block(x, y, Blocks.Air, this.x, true);
            }
        }
    }

    generateChunk() {
        if (this.generated) return;
        this.generateArray(); // Initialize blocks
        this.generateHeight(); // Generate terrain height
    }

    getHeight(x) {
        const worldX = this.x / BLOCK_SIZE + x;
        let heightNoise = this.biome.heightNoise;
      
        // Try to get the left and right neighbor chunks.
        const leftChunk = this.previousChunk; // Assume this is set for chunk 0 as chunk -1.
        const rightChunkX = this.x + CHUNK_WIDTH * BLOCK_SIZE;
        const rightChunk = chunks.get(rightChunkX); // Using your global chunks Map
      
        // Determine blend factors for left and right edges.
        // Near the left edge, use the left neighbor if its biome is different.
        let leftBlend = 0;
        if (leftChunk && leftChunk.biome.heightNoise !== heightNoise) {
          leftBlend = (CHUNK_WIDTH - x) / CHUNK_WIDTH; // 1 at left edge, 0 at right edge.
        }
      
        // Near the right edge, use the right neighbor if its biome is different.
        let rightBlend = 0;
        if (rightChunk && rightChunk.biome.heightNoise !== heightNoise) {
          rightBlend = x / CHUNK_WIDTH; // 0 at left edge, 1 at right edge.
        }
      
        // Create a helper to blend a given noise layer.
        const blendLayer = (offset, scale) => {
          const currentVal = heightNoise.getNoise(worldX, offset, scale);
          // If we are near the left edge, blend with the left neighbor's noise.
          if (leftBlend > 0) {
            const leftVal = leftChunk.biome.heightNoise.getNoise(worldX, offset, scale);
            return lerpEaseInOut(leftVal, currentVal, 1 - leftBlend);
          }
          // If we are near the right edge, blend with the right neighbor's noise.
          if (rightBlend > 0) {
            const rightVal = rightChunk.biome.heightNoise.getNoise(worldX, offset, scale);
            return lerpEaseInOut(currentVal, rightVal, rightBlend);
          }
          // Otherwise, just use the current biome's noise.
          return currentVal;
        };
      
        // Blend each noise layer.
        const layer1 = blendLayer(0, 1);
        const layer2 = blendLayer(100000, 3);
        const layer3 = blendLayer(500000, 5);
        const layer4 = blendLayer(1000000, 7);
        const noiseAverage = (layer1 + layer2 + layer3 + layer4) / 4;
      
        // Also blend the biome's minimum height.
        let currentMin = heightNoise.min;
        let blendedMin = currentMin;
        if (leftBlend > 0) {
          blendedMin = lerpEaseInOut(leftChunk.biome.heightNoise.min, currentMin, 1 - leftBlend);
        } else if (rightBlend > 0) {
          blendedMin = lerpEaseInOut(currentMin, rightChunk.biome.heightNoise.min, rightBlend);
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

                this.setBlockTypeAtPosition(block.x, block.y, block.blockType);
            });
            // Once the blocks are placed, remove them from the buffer
            pendingBlocks.delete(chunkX);
        }
    }

    generateHeight() {
        for (let x = 0; x < this.width; x++) {
            const height = this.getHeight(x);

            for (let y = height; y > 0; y--) {
                if (y > height - this.biome.secondLayerWidth) {
                    this.setBlockType(x, y, this.biome.secondLayer);
                } else {
                    this.setBlockType(x, y, Blocks.Stone);
                    this.setBlockType(x, y, Blocks.Stone, this.walls);
                }
            }
            this.setBlockType(x, height, this.biome.topLayer);
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
                if (blockType === Blocks.Air) {
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

            entity.setOnGround();
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
        this.updateWater();
    }

    checkForBlockWithAirBeneath(x, y) {
        const blockData = this.getBlockTypeData(x, y - 1, false);

        if (!blockData) return;

        const block = this.getBlock(x, y - 1, false);

        if (blockData.breakWithoutBlockUnderneath)
            block.breakBlock(blockData.dropWithoutTool);

        if (blockData.fall) block.gravityBlock();
    }

    updateWater() {
        this.getAllBlocks(Blocks.Water).forEach((water) => {
            water.setBlockType(Blocks.Water, true);
        });
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
                const y = this.findGroundLevel(x);
                if (this.getBlockType(x, y) != Blocks.Air) continue;
                const randomGrass =
                    this.biome.grassType[
                        RandomRange(0, this.biome.grassType.length)
                    ];
                this.setBlockType(x, y, randomGrass);
            }
        }
    }

    spawnTree(x) {
        const y = this.findGroundLevel(x); // Find valid ground level
        if (this.getBlockType(x, y) != Blocks.Air) return;
        const randomTree = this.getRandomTreeFromBiome(); // Pick a random tree
        this.spawnTreeAt(randomTree, x, y); // Spawn the tree at the position
    }

    findGroundLevel(x) {
        for (let y = this.height - 1; y >= 0; y--) {
            const blockAtPos = this.getBlockType(x, y);
            if (
                blockAtPos == Blocks.GrassBlock ||
                blockAtPos == Blocks.SnowedGrassBlock ||
                blockAtPos == Blocks.Sand ||
                blockAtPos == Blocks.Podzol
            ) {
                return y + 1;
            }
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
    }

    generateOre(noise, threshold, block, offset) {
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let x = 0; x < CHUNK_WIDTH; x++) {
                const noiseValue = noise.getNoise(
                    x + this.x / BLOCK_SIZE,
                    y + offset
                );

                if (this.getBlockType(x, y) != Blocks.Stone) continue;

                if (noiseValue > threshold) continue;

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
        const treeHeight = tree.length;
        for (let i = 0; i < treeHeight; i++) {
            const layerWidth = tree[i].length;
            for (let j = 0; j < layerWidth; j++) {
                const block = tree[i][j];
                const worldX =
                    this.x +
                    x * BLOCK_SIZE -
                    Math.floor(layerWidth / 2) * BLOCK_SIZE +
                    j * BLOCK_SIZE;
                const worldY = y * BLOCK_SIZE + i * BLOCK_SIZE;
                this.setBlockTypeAtPosition(worldX, worldY, block);
            }
        }
    }

    setBlockTypeAtPosition(worldX, worldY, blockType) {
        const targetChunk = this.getChunkForBlock(worldX);
        if (targetChunk && worldY < targetChunk.height * BLOCK_SIZE) {
            const localX = this.getLocalX(worldX, targetChunk);
            const localY = worldY / BLOCK_SIZE;

            targetChunk.setBlockType(localX, localY, blockType);
        } else {
            if (blockType == BlockType.Air) return;
            // Buffer the block to place it once the chunk is generated
            const chunkX =
                Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
                CHUNK_WIDTH *
                BLOCK_SIZE;
            if (!pendingBlocks.has(chunkX)) {
                pendingBlocks.set(chunkX, []);
            }
            pendingBlocks.get(chunkX).push({ x: worldX, y: worldY, blockType });
            // console.log(`Buffered block at worldX: ${worldX}, worldY: ${worldY}`);
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

    getBlock(x, y, calculated = true) {
        if (calculated) y = this.calculateY(y);

        if (!this.blocks[y]) return null;
        if (!this.blocks[y][x]) return null;

        return this.blocks[y][x];
    }

    getBlockTypeData(x, y, calculated = true) {
        if (calculated) y = this.calculateY(y);

        if (!this.blocks[y]) return null;
        if (!this.blocks[y][x]) return null;

        return GetBlock(this.blocks[y][x].blockType);
    }

    setBlockType(x, y, blockType, blocks = this.blocks) {
        y = this.calculateY(y);
        if (blocks[y] && blocks[y][x]) {
            if (blocks[y][x].blockType !== blockType)
                blocks[y][x].setBlockType(blockType);
        }
    }

    calculateY(y) {
        return this.height - 1 - y;
    }

    countAirBlockArea(startX, startY) {
        if (this.getBlockType(startX, startY) !== Blocks.Air) {
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
                this.getBlockType(x, y) === Blocks.Air
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
}
