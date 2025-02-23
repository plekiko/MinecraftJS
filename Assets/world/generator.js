let chunks = new Map();
let pendingBlocks = new Map();

let seed = Math.floor(Math.random() * 1000000);
// let seed = 0;

tooloud.Perlin.setSeed(seed);

function setSeed(newSeed) {
    seed = newSeed;
    tooloud.Perlin.setSeed(seed);
}

let loadingWorld = false;

const worldGrassNoiseMap = new Noise(550, 0.2, 1);

const worldStructureNoiseMap = new Noise(500, 1, 10);

const worldTemperatureNoiseMap = new Noise(
    30, // Scale (size)
    70, // Intensity
    32
);

const worldWetnessNoiseMap = new Noise(
    30, // Scale (size)
    40, // Intensity
    21
);

const worldTreeNoiseMap = new Noise(
    100, // Scale (size)
    10, // Intensity
    5
);

const worldCaveNoiseMap = new Noise(
    55, // Scale (size)
    10, // Intensity
    5
);

const worldMountainsNoiseMap = new Noise(
    30, // Scale (size)
    60, // Intensity
    30
);

const worldCoalNoiseMap = new Noise(
    100, // Scale (size)
    5.3, // Intensity
    5
);
const worldIronNoiseMap = new Noise(
    100, // Scale (size)
    5, // Intensity
    5
);
const worldDiamondNoiseMap = new Noise(
    100, // Scale (size)
    6.8, // Intensity
    5
);

function PrintNoiseOutput(noise, count = 100) {
    // Initialize variables to track min and max
    let minValue = Infinity;
    let maxValue = -Infinity;

    // Print noise values and track min/max
    for (let i = 0; i < count; i++) {
        const noiseValue = noise.getNoise(i, 0);
        console.log(`Mapped noise value: ${i} - ${noiseValue}`);

        // Update min and max
        if (noiseValue < minValue) minValue = noiseValue;
        if (noiseValue > maxValue) maxValue = noiseValue;
    }

    // Print the minimum and maximum values
    console.log("Minimum Noise Value:", minValue);
    console.log("Maximum Noise Value:", maxValue);
}

function LocateBiome(biome) {
    for (let i = 0; i < 10000; i++) {
        let currentBiome = calculateChunkBiome(i);

        if (currentBiome === biome) return i;

        currentBiome = calculateChunkBiome(-i);

        if (currentBiome === biome) return -i;
    }

    return false;
}

function BiomesInChunkCount(count) {
    // store all biomes and print their count
    let biomeCount = {};
    for (let i = 0; i < count; i++) {
        const biome = calculateChunkBiome(i);
        if (!biomeCount[biome.name]) biomeCount[biome.name] = 1;
        else biomeCount[biome.name]++;
    }
    console.log(biomeCount);

    // then print in percentage the distribution of biomes
    for (const biome in biomeCount) {
        console.log(
            `${biome}: ${((biomeCount[biome] / count) * 100).toFixed(2)}%`
        );
    }
}

function RegenerateWorld() {
    let seed = Math.floor(Math.random() * 10000);
    tooloud.Perlin.setSeed(seed);

    pendingBlocks = new Map();
    chunks = new Map();

    entities = [];

    entities.push(player);

    setTimeout(() => {
        player.setOnGround();
    }, 1);
}

function GenerateWorld() {
    if (loadingWorld) return;

    const currentChunkIndex = camera.getCurrentChunkIndex();

    // Generate chunks within the visible range of the camera
    for (
        let i = currentChunkIndex - RENDER_DISTANCE;
        i <= currentChunkIndex + RENDER_DISTANCE;
        i++
    ) {
        const chunkX = i * CHUNK_WIDTH * BLOCK_SIZE;

        if (!chunks.has(chunkX)) {
            const oldChunkData = getNeighborBiomeData(i, currentChunkIndex);

            generateChunk(i, chunkX, oldChunkData);
        } else {
            const chunk = chunks.get(chunkX);
            if (chunk.spawnTime && chunk.spawnTime <= passedTime) {
                chunk.spawnMobs(day);

                chunk.spawnTime = 0;
            }
        }
    }

    postProcessChunks();
}

function GenerateStructure(structure, x, y) {
    const structureData = Structures[structure];
    if (!structureData) return;

    let structureWidth = structureData.blocks[0].length;
    let structureHeight = structureData.blocks.length;

    if (structureData.walls) {
        if (structureData.walls[0].length > structureWidth) {
            structureWidth = structureData.walls[0].length;
        }
        if (structureData.walls.length > structureHeight) {
            structureHeight = structureData.walls.length;
        }
    }

    // 50/50 chance to flip horizontally (left-to-right).
    const flip = Math.random() < 0.5;

    let chunk = null;

    for (let i = 0; i < structureWidth; i++) {
        // If flipped, reverse the column index.
        const colIndex = flip ? structureWidth - 1 - i : i;
        for (let j = 0; j < structureHeight; j++) {
            const blockType = structureData.blocks[j][colIndex];
            let wallType = Blocks.Air;
            if (structureData.walls) {
                wallType = structureData.walls[j][colIndex];
            }

            const blockX =
                Math.floor((x + i * BLOCK_SIZE) / BLOCK_SIZE) * BLOCK_SIZE;
            let blockY = Math.floor(y + j * BLOCK_SIZE);

            if (!chunk) chunk = GetChunkForX(blockX);

            // Convert to world coordinate (flip vertically if needed)
            blockY = CHUNK_HEIGHT * BLOCK_SIZE - blockY;

            // Process Blocks:
            if (blockType instanceof LootTable) {
                GenerateChestWithLoot(blockType, blockX, blockY, chunk);
            } else {
                if (blockType !== Blocks.Air) {
                    chunk.setBlockTypeAtPosition(blockX, blockY, blockType);
                }
            }

            // Process Walls:
            if (wallType instanceof LootTable) {
                GenerateChestWithLoot(wallType, blockX, blockY, chunk);
            } else {
                if (wallType !== Blocks.Air) {
                    chunk.setBlockTypeAtPosition(
                        blockX,
                        blockY,
                        wallType,
                        null,
                        true
                    );
                }
            }
        }
    }
}

function GenerateChestWithLoot(lootTable, x, y, chunk) {
    const loot = lootTable.getRandomLoot();

    let storage = [[]];

    for (let y = 0; y < 3; y++) {
        storage[y] = [];
        for (let x = 0; x < 9; x++) {
            storage[y][x] = new InventoryItem();
        }
    }

    const newStorage = PopulateStorageWithLoot(loot, storage);

    chunk.setBlockTypeAtPosition(
        x,
        y,
        Blocks.Chest,
        new Metadata({ props: { storage: newStorage } })
    );
}

function PopulateStorageWithLoot(loot, storage) {
    for (const item of loot) {
        let placed = false;
        let attempts = 10;
        while (!placed && attempts > 0) {
            const randomSlotX = RandomRange(0, storage[0].length);
            const randomSlotY = RandomRange(0, storage.length);
            if (storage[randomSlotY][randomSlotX].count === 0) {
                storage[randomSlotY][randomSlotX] = item;
                placed = true;
            }
            attempts--;
        }
        if (!placed) {
            for (let y = 0; y < storage.length && !placed; y++) {
                for (let x = 0; x < storage[y].length && !placed; x++) {
                    if (storage[y][x].count === 0) {
                        storage[y][x] = item;
                        placed = true;
                    }
                }
            }
        }
    }
    return storage;
}

function calculateChunkBiome(chunkIndex) {
    const temp = worldTemperatureNoiseMap.getNoise(chunkIndex, 20000);
    const wetness = worldWetnessNoiseMap.getNoise(chunkIndex, 10000);
    const mountains = worldMountainsNoiseMap.getNoise(chunkIndex, 30000);
    return GetBiomeForNoise(temp, wetness, mountains);
}

function getNeighborBiomeData(currentIndex, cameraIndex) {
    const neighborIndex =
        currentIndex < cameraIndex ? currentIndex + 1 : currentIndex - 1;
    const neighborChunkX = neighborIndex * CHUNK_WIDTH * BLOCK_SIZE;
    const neighborBiome = calculateChunkBiome(neighborIndex);

    return { x: neighborChunkX, biome: neighborBiome };
}

function generateChunk(chunkIndex, chunkX, oldChunkData) {
    const biome = calculateChunkBiome(chunkIndex);

    const newChunk = new Chunk(
        chunkX,
        CHUNK_WIDTH,
        biome,
        oldChunkData,
        pendingBlocks,
        worldGrassNoiseMap
    );

    chunks.set(chunkX, newChunk);
}

function GetChunk(worldX) {
    return chunks.has(worldX) ? chunks.get(worldX) : null;
}

function postProcessChunks() {
    chunks.forEach((chunk) => {
        if (!chunk.generated) {
            chunk.generateOres();
            chunk.generateCaves();
            chunk.applyBufferedBlocks();
            chunk.generateWater();
            chunk.spawnMobs(day);
            chunk.generateTrees();
            chunk.generateGrass();
            chunk.generateBedrock();

            // chunk.calculateLighting();
        }
    });
    generateStructures();
}

function generateStructures() {
    // Loop over each chunk in the global chunks Map.
    chunks.forEach((chunk, chunkX) => {
        if (chunk.generated) {
            return;
        } else {
            chunk.generated = true;
        }
        // Use the chunk index (or its x coordinate) to get a structure noise value.
        const chunkIndex = chunkX / (CHUNK_WIDTH * BLOCK_SIZE);
        const structureNoiseValue = worldStructureNoiseMap.getNoise(
            chunkIndex,
            0
        );

        // Define a threshold for structure spawning.
        if (structureNoiseValue > 10.2) {
            // Build an array of candidate structure names that "fit" this chunk.
            const allStructureNames = Object.keys(Structures);
            const candidates = allStructureNames.filter((name) => {
                const structure = Structures[name];
                return (
                    structure.biome === null || structure.biome === chunk.biome
                );
            });

            if (candidates.length === 0) return;

            const randomName = candidates[RandomRange(0, candidates.length)];
            const structure = Structures[randomName];

            // Determine placement X coordinate (roughly the center of the chunk)
            const structureX =
                chunk.x +
                RandomRange(0, CHUNK_WIDTH) * BLOCK_SIZE +
                structure.shift.x * BLOCK_SIZE;

            let structureY;
            if (structure.underground) {
                // Get the surface level at the center of the chunk (0 is top)
                const localX = chunk.getLocalX(structureX);
                const surfaceBlockY = chunk.findGroundLevel(localX, true);
                if (surfaceBlockY === 0) return;
                // Multiply by BLOCK_SIZE to get the world coordinate
                const surfaceY = surfaceBlockY * BLOCK_SIZE;
                // Choose a fixed offset (in blocks) to place the structure underground.
                // For example, place it between 16 and 32 blocks below the surface.
                const undergroundOffset =
                    RandomRange(8, CHUNK_HEIGHT / 2.5) * BLOCK_SIZE;
                // structureY = surfaceY + undergroundOffset * BLOCK_SIZE;
                structureY = surfaceY + undergroundOffset;
            } else {
                // For surface structures, use the surface level.
                const localX = chunk.getLocalX(structureX);
                const surfaceBlockY = chunk.findGroundLevel(localX, true);
                const surfaceY = surfaceBlockY * BLOCK_SIZE;

                structureY =
                    surfaceY -
                    structure.blocks.length * BLOCK_SIZE +
                    structure.shift.y * BLOCK_SIZE;
            }

            // Generate the structure at these world coordinates.
            GenerateStructure(randomName, structureX, structureY);
        }
    });
}

function GetChunkByIndex(index) {
    // Calculate the world x-coordinate of the chunk based on its index
    const chunkX = index * CHUNK_WIDTH * BLOCK_SIZE;

    // Retrieve the chunk from the Map using its x-coordinate
    return chunks.get(chunkX);
}

function GetBiomeForNoise(temp, wetness, mountains) {
    // console.log(`Checking biome for temp: ${temp}, wetness: ${wetness}`); // Debugging log

    // return Biomes.Desert;

    // Iterate through the available biomes and find one that matches both the temperature and wetness range
    for (let biomeName in Biomes) {
        const biome = Biomes[biomeName];

        // Log each biome range for comparison
        // console.log(
        //     `Biome: ${biome.name}, Temp range: [${biome.minTemp}, ${biome.maxTemp}], Wetness range: [${biome.minWet}, ${biome.maxWet}]`
        // );

        // Check if both temperature and wetness fall within the biome's range
        if (
            temp >= biome.minTemp &&
            temp <= biome.maxTemp && // Temperature check
            wetness >= biome.minWet &&
            wetness <= biome.maxWet && // Wetness check
            mountains >= biome.minMount &&
            mountains <= biome.maxMount
        ) {
            // console.log(`Matched biome: ${biome.name}`);
            return biome;
        }
    }

    // console.log("No match found, returning Planes.");
    // Default case: if no biome matches, return the default "Planes" biome
    return Biomes.Planes;
}

function getBlockWorldPosition(block) {
    return new Vector2(block.transform.position.x, block.transform.position.y);
}

function GetBlockAtWorldPosition(worldX, worldY, wall = false) {
    const targetChunk = GetChunkForX(worldX);
    if (!targetChunk || worldY >= CHUNK_HEIGHT * BLOCK_SIZE) return null;

    // Subtract the chunk's x offset from the worldX before dividing by BLOCK_SIZE.
    const localX = Math.floor((worldX - targetChunk.x) / BLOCK_SIZE);
    const localY = Math.floor(worldY / BLOCK_SIZE);

    return targetChunk.getBlock(localX, localY, false, wall);
}

function checkAdjacentBlocks(position, wall = false) {
    const directions = [
        { x: 0, y: -BLOCK_SIZE }, // Above
        { x: 0, y: BLOCK_SIZE }, // Below
        { x: -BLOCK_SIZE, y: 0 }, // Left
        { x: BLOCK_SIZE, y: 0 }, // Right
    ];

    for (const dir of directions) {
        const adjacentPos = new Vector2(position.x + dir.x, position.y + dir.y);
        const block = GetBlockAtWorldPosition(
            adjacentPos.x,
            adjacentPos.y,
            wall
        );
        if (!block) continue;

        const type = GetBlock(block.blockType);
        if (block && !type.fluid && !type.air) {
            return true; // Found an adjacent block
        }
    }

    return false; // No adjacent block found
}

function SetBlockTypeAtPosition(worldX, worldY, blockType, wall = false) {
    const block = GetBlockAtWorldPosition(worldX, worldY, wall);

    if (!block) return;

    block.setBlockType(blockType);
}

function SetBufferedBlock(worldX, worldY, blockType) {
    GetChunkForX(worldX).setBlockTypeAtPosition(worldX, worldY, blockType);
}

function GetChunkForX(worldX) {
    const chunkX =
        Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
        (CHUNK_WIDTH * BLOCK_SIZE);
    return chunks.get(chunkX);
}
