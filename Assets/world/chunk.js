class Chunk {
    constructor(
        x = 0,
        width = 8,
        biome = Biomes.Planes,
        pendingBlocks = new Map(),
        worldGrassNoiseMap = new Noise()
    ) {
        this.biome = biome;
        this.x = x;
        this.blocks = [];
        this.walls = [];
        this.width = width;
        this.height = CHUNK_HEIGHT;
        this.generated = false;
        this.pendingBlocks = pendingBlocks;
        this.grassNoiseMap = worldGrassNoiseMap;

        this.generateChunk();
    }

    generateArray() {
        // Initialize blocks array for chunk
        for (let y = 0; y < this.height; y++) {
            this.blocks[y] = [];
            this.walls[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.blocks[y][x] = new Block(Blocks.Air); // Set default as air block
                this.walls[y][x] = new Block(Blocks.Air, true);
            }
        }
    }

    generateChunk() {
        this.generateArray(); // Initialize blocks
        this.generateHeight(); // Generate terrain height
    }

    getHeight(x) {
        const worldX = this.x / BLOCK_SIZE + x;
        const heightFirstPass = this.biome.heightNoise.getNoise(worldX, 0);
        const heightSecondPass = this.biome.heightNoise.getNoise(
            worldX,
            100000
        );

        const heightRaw = (heightFirstPass + heightSecondPass) / 2;

        return Math.floor(this.biome.heightNoise.min + heightRaw);
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
            this.setBlockType(x, height, this.biome.topLayer); // Topmost layer (grass/sand/etc.)
        }
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
        if (this.biome.grassType.length == 0) return;
        for (let x = 0; x < CHUNK_WIDTH; x++) {
            if (this.grassNoiseMap.getNoise(this.getWorldX(x)) >= 1) {
                const y = this.findGroundLevel(x);
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
                blockAtPos == Blocks.Cactus ||
                blockAtPos == Blocks.Podzol
            ) {
                return y + 1; // Place tree one block above ground
            }
        }
        return 0; // Default to 0 if no ground is found
    }

    generateCaves() {
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let x = 0; x < CHUNK_WIDTH; x++) {
                const noiseValue = worldCaveNoiseMap.getNoise(
                    x + this.x / BLOCK_SIZE,
                    y
                );
                if (
                    y <= this.biome.heightNoise.min * 1.5
                        ? noiseValue <= CAVES_THRESHOLD
                        : noiseValue <= CAVES_THRESHOLD * 0.5
                ) {
                    this.setBlockType(x, y, Blocks.Air); // Create cave openings
                }
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

    getLocalX(worldX, targetChunk) {
        return (worldX - targetChunk.x) / BLOCK_SIZE; // Scale the position to the block grid using BLOCK_SIZE
    }

    getBlockType(x, y) {
        y = this.calculateY(y);
        return this.blocks[y][x].blockType;
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
