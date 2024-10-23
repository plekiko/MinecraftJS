class Chunk {
    constructor(x = 0, width = 8, biome = Biomes.Planes) {
        this.biome = biome;
        this.x = x;
        this.blocks = [];
        this.walls = [];
        this.width = width;
        this.height = CHUNK_HEIGHT;
        this.generated = false;
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

        this.generateArray();  // Initialize blocks

        this.generateHeight(); // Generate terrain height

        // this.generateTrees();  // Generate trees

        // this.generateBedrock(); // Generate bedrock layer
    }

    getHeight(x) {
        const worldX = this.getWorldX(x);

        const heightFirstPass = this.biome.heightNoise.getNoise(worldX, 0, 0);
        const heightSecondPass = this.biome.heightNoise.getNoise(worldX + 10000, 10000, 0, 2);

        const heightRaw = (heightFirstPass + heightSecondPass) / 2;

        return Math.round(this.biome.heightNoise.min + heightRaw);
    }

    getWorldX(x) {
        return this.x + x;
    }

    generateHeight() {
        for (let x = 0; x < this.width; x++) {
            const height = this.getHeight(x * 16);

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

    // Generate trees within the chunk
    generateTrees() {
        if (!this.biome.treeType) return;

        for(let i = this.x; i < this.x + CHUNK_WIDTH * BLOCK_SIZE; i += BLOCK_SIZE) {
            const noiseOutput = worldTreeNoiseMap.getNoise(i);

            if(noiseOutput >= this.biome.treeThreshold) {
                this.spawnTree(this.getLocalX(i, this));
            }
        }
    }

    spawnTree(x) {
        const y = this.findGroundLevel(x);  // Find valid ground level

        const randomTree = this.getRandomTreeFromBiome(); // Pick a random tree

        this.spawnTreeAt(randomTree, x, y); // Spawn the tree at the position
    }

    // Find the ground level to spawn the tree
    findGroundLevel(x) {
        for (let y = this.height - 1; y >= 0; y--) {
            const blockAtPos = this.getBlockType(x, y);
            if (blockAtPos == Blocks.GrassBlock || blockAtPos == Blocks.SnowedGrassBlock || blockAtPos == Blocks.Sand || blockAtPos == Blocks.Cactus) {
                return y + 1; // Place tree one block above ground
            }
        }
        return 0; // Default to 0 if no ground is found
    }

    generateCaves() {
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let x = 0; x < CHUNK_WIDTH; x++) {
                const noiseValue = worldCaveNoiseMap.getNoise(x + this.x/BLOCK_SIZE, y);
    
                // Replace bedrock with empty spaces to create caves
                if (y <= this.biome.heightNoise.min * 1.5 ? noiseValue <= CAVES_THRESHOLD : noiseValue <= CAVES_THRESHOLD * .5) {
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
        if(y <= 3)
            return;
        
        const treeHeight = tree.length;
    
        // Loop through the tree's structure
        for (let i = 0; i < treeHeight; i++) {
            const layerWidth = tree[i].length; // Width of the current layer
            
            // For each layer, we want to center the tree layer horizontally around the given `x`
            for (let j = 0; j < layerWidth; j++) {
                const block = tree[i][j];
    
                // Center the tree horizontally based on the layer width and chunk position (this.x)
                const worldX = this.x + (x * BLOCK_SIZE) - Math.floor(layerWidth / 2) * BLOCK_SIZE + (j * BLOCK_SIZE); // Adjust j position to center the layer
                const worldY = (y * BLOCK_SIZE) + (i * BLOCK_SIZE);  // Vertical position
        
                this.setBlockTypeAtPosition(worldX, worldY, block);
            }
        }
    }
    
    setBlockTypeAtPosition(worldX, worldY, blockType) {
        const targetChunk = this.getChunkForBlock(worldX);
        
        if (targetChunk && worldY < targetChunk.height * BLOCK_SIZE) {
            const localX = this.getLocalX(worldX, targetChunk);
            const localY = worldY / BLOCK_SIZE; // Ensure Y is correctly scaled to the block grid
        
            targetChunk.setBlockType(localX, localY, blockType);
        } else {
            console.log(`Failed to place block at worldX: ${worldX}, worldY: ${worldY}`);
        }
    }
    
    // Helper function to get the chunk for a given world X coordinate
    getChunkForBlock(worldX) {
        const chunkIndex = Math.floor((worldX / CHUNK_WIDTH) / BLOCK_SIZE); // Determine which chunk
        return chunks[chunkIndex]; // Get the chunk by index (assuming chunks is an array of chunks)
    }

    getLocalX(worldX, targetChunk) {
        // This assumes that chunks start at their x position and each chunk is `chunkWidth` blocks wide.
        // Scale the position to the block grid using BLOCK_SIZE
        return (worldX - targetChunk.x) / BLOCK_SIZE;
    }

    // Get the block type at a given position
    getBlockType(x, y) {
        y = this.calculateY(y);
        return this.blocks[y][x].blockType;
    }

    // Set the block type at a given position
    setBlockType(x, y, blockType, blocks = this.blocks) {
        y = this.calculateY(y);

        if (blocks[y] && blocks[y][x]) {
            if(blocks[y][x].blockType != blockType)
                blocks[y][x].setBlockType(blockType);
        }
    }

    // Convert chunk y-coordinate to array index
    calculateY(y) {
        return this.height - 1 - y;
    }

    countAirBlockArea(startX, startY) {
        // Check if the starting block is an air block
        if (this.getBlockType(startX, startY) !== Blocks.Air) {
            return 0; // If the starting block is not air, return 0
        }
    
        // Set up a queue for breadth-first search (BFS)
        const queue = [];
        const visited = new Set();
        let areaSize = 0;
    
        // Helper to add to queue if block is air and not visited
        const tryAddToQueue = (x, y) => {
            const key = `${x},${y}`;
            if (
                x >= 0 && x < this.width &&  // Ensure it's within chunk bounds
                y >= 0 && y < this.height && 
                !visited.has(key) &&         // Ensure it's not visited
                this.getBlockType(x, y) === Blocks.Air // Ensure it's an air block
            ) {
                queue.push([x, y]);
                visited.add(key);  // Mark as visited
            }
        };
    
        // Add the starting block to the queue
        queue.push([startX, startY]);
        visited.add(`${startX},${startY}`);
    
        // While there are items in the queue, process them
        while (queue.length > 0) {
            const [x, y] = queue.shift(); // Get the next block in the queue
            areaSize++; // Count the air block
    
            // Add adjacent air blocks to the queue (4-directional flood fill)
            tryAddToQueue(x + 1, y); // Right
            tryAddToQueue(x - 1, y); // Left
            tryAddToQueue(x, y + 1); // Down
            tryAddToQueue(x, y - 1); // Up
        }
    
        // Return the size of the area
        return areaSize;
    }
    
}