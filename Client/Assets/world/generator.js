let seed = 0;
// let seed = 0;

tooloud.Perlin.setSeed(seed);

let specialWorldProps = {};

let forceToBiome = null;

function setSeed(newSeed) {
    seed = newSeed;
    tooloud.Perlin.setSeed(seed);
}

let loadingWorld = true;

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

function LoadCustomSeed(seed) {
    // Set seed to lowercase
    seed = seed.toString().toLowerCase();

    setSeed(seed);

    switch (seed) {
        case "flat":
            specialWorldProps.flat = true;
            break;

        case "void":
            specialWorldProps.void = true;
            break;

        case "skyblock":
            specialWorldProps.void = true;
            specialWorldProps.skyblock = true;
            break;

        case "redstone":
            specialWorldProps.flat = true;
            specialWorldProps.noMobs = true;
            specialWorldProps.redstone = true;
            specialWorldProps.noStructures = true;
            break;

        //#region Biome Forces
        case "desert":
            forceToBiome = OverworldBiomes.Desert;
            break;
        case "mountain":
            forceToBiome = OverworldBiomes.Mountain;
            break;
        case "forest":
            forceToBiome = OverworldBiomes.Forest;
            break;
        case "plains":
            forceToBiome = OverworldBiomes.Plains;
            break;
        case "swamp":
            forceToBiome = OverworldBiomes.Swamp;
            break;
        case "jungle" || "rainforest":
            forceToBiome = OverworldBiomes.RainForest;
            break;
        case "savanna":
            forceToBiome = OverworldBiomes.Savanna;
            break;
        case "taiga":
            forceToBiome = OverworldBiomes.Taiga;
            break;
        case "tundra":
            forceToBiome = OverworldBiomes.Tundra;
            break;
        case "seasonalforest" || "seasonal" || "seasonal forest":
            forceToBiome = OverworldBiomes.SeasonalForest;
            break;
        //#endregion
    }
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

    entities = [];

    entities.push(player);

    setTimeout(() => {
        player.setOnGround();
    }, 1);
}

async function GetChunkFromServer(x, dimensionIndex = activeDimension) {
    try {
        const chunkData = await server.get({
            type: "getChunk",
            message: { x: x, dimensionIndex: dimensionIndex },
        });

        return chunkData.chunk;
    } catch (error) {
        // console.error("Failed to get chunk from server: ", error);
        return null;
    }
}

async function generateWorld(dimensionIndex = activeDimension) {
    if (loadingWorld) return;

    const dimension = dimensions[dimensionIndex];
    const currentChunkIndex = camera.getCurrentChunkIndex();

    for (
        let i = currentChunkIndex - RENDER_DISTANCE;
        i <= currentChunkIndex + RENDER_DISTANCE;
        i++
    ) {
        const chunkX = i * CHUNK_WIDTH * BLOCK_SIZE;

        let willUploadChunk = false;

        if (multiplayer) {
            if (!dimension.chunks.has(chunkX)) {
                console.log("Chunk not loaded", chunkX, dimensionIndex);
                const chunkFromServer = await GetChunkFromServer(
                    chunkX,
                    dimensionIndex
                ); // Ensure async handling
                console.log(
                    "Chunk from server",
                    chunkX,
                    chunkFromServer,
                    dimensionIndex
                );
                if (chunkFromServer) {
                    console.log(
                        "Loaded chunk from server",
                        chunkX,
                        chunkFromServer
                    );
                    LoadChunk(chunkX, chunkFromServer, dimensionIndex);
                } else {
                    willUploadChunk = true;
                    const oldChunkData = getNeighborBiomeData(
                        i,
                        currentChunkIndex,
                        dimensionIndex
                    );
                    generateChunk(i, chunkX, oldChunkData, dimensionIndex);
                }
            }
        } else if (!dimension.chunks.has(chunkX)) {
            const oldChunkData = getNeighborBiomeData(
                i,
                currentChunkIndex,
                dimensionIndex
            );
            generateChunk(i, chunkX, oldChunkData, dimensionIndex);
        } else {
            const chunk = dimension.chunks.get(chunkX);
            if (chunk.spawnTime && chunk.spawnTime <= passedTime) {
                chunk.spawnMobs(day);
                chunk.spawnTime = 0;
            }
        }

        if (!specialWorldProps.noStructures) {
            generateStructures(dimensionIndex);
        }

        postProcessChunk(GetChunkForX(chunkX, dimensionIndex));

        if (willUploadChunk) {
            UploadChunkToServer(chunkX, dimensionIndex);
        }
    }
}

function ServerPlaceBlock(
    chunkX,
    x,
    y,
    blockType,
    isWall = false,
    dimensionIndex = activeDimension
) {
    server.send({
        type: "placeBlock",
        message: {
            x: x,
            y: y,
            blockType: blockType,
            isWall: isWall,
            chunkX: chunkX,
            dimensionIndex: dimensionIndex,
        },
    });

    UploadChunkToServer(chunkX, dimensionIndex);
}

function ServerBreakBlock(
    chunkX,
    x,
    y,
    blockType,
    isWall = false,
    shouldDrop = false,
    dimensionIndex = activeDimension
) {
    server.send({
        type: "breakBlock",
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

    UploadChunkToServer(chunkX, dimensionIndex);
}

async function UploadChunkToServer(chunkX, dimensionIndex) {
    const chunk = GetChunkForX(chunkX, dimensionIndex);
    await server.send({
        type: "uploadChunk",
        message: {
            x: chunkX,
            chunk: SaveChunk(chunk),
            dimensionIndex: dimensionIndex,
        },
        sender: player.UUID,
    });
    console.log(`Uploaded chunk ${chunkX} to server`);
}

function GenerateStructure(structure, x, y) {
    console.log("Generating structure", structure, x, y);

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

function calculateChunkBiome(chunkIndex, dimensionIndex = activeDimension) {
    const dimension = dimensions[dimensionIndex];
    const { temperature, wetness, mountains } = dimension.noiseMaps;
    const temp = temperature.getNoise(chunkIndex, 20000);
    const wet = wetness.getNoise(chunkIndex, 10000);
    const mount = mountains.getNoise(chunkIndex, 30000);

    let biome = getBiomeForNoise(temp, wet, mount, dimension.biomeSet);

    if (specialWorldProps.flat) biome = dimension.biomeSet.Plains || biome;
    if (dimension.forceToBiome != null) biome = dimension.forceToBiome;
    if (!biome)
        biome =
            dimension.biomeSet.Plains || Object.values(dimension.biomeSet)[0];

    return biome;
}

function getNeighborBiomeData(
    currentIndex,
    cameraIndex,
    dimensionIndex = activeDimension
) {
    const neighborIndex =
        currentIndex < cameraIndex ? currentIndex + 1 : currentIndex - 1;
    const neighborChunkX = neighborIndex * CHUNK_WIDTH * BLOCK_SIZE;
    const neighborBiome = calculateChunkBiome(neighborIndex, dimensionIndex);

    return { x: neighborChunkX, biome: neighborBiome };
}

function generateChunk(
    chunkIndex,
    chunkX,
    oldChunkData,
    dimensionIndex = activeDimension
) {
    // console.log("Seed:", seed);

    const dimension = dimensions[dimensionIndex];
    const biome = calculateChunkBiome(chunkIndex, dimensionIndex);

    const newChunk = new Chunk(chunkX, CHUNK_WIDTH, biome, oldChunkData);

    newChunk.dimension = dimensionIndex;

    dimension.chunks.set(chunkX, newChunk);
}

function GetChunk(worldX, dimension = activeDimension) {
    return getDimensionChunks(dimension).has(worldX)
        ? getDimensionChunks(dimension).get(worldX)
        : null;
}

function postProcessChunk(chunk) {
    if (specialWorldProps.void) {
        chunk.applyBufferedBlocks();
        return;
    }

    if (!chunk.generated) {
        console.log("Generating chunk", chunk.x);

        chunk.generateOres();

        if (!specialWorldProps.flat) {
            chunk.generateCaves();
        }

        chunk.applyBufferedBlocks();
        chunk.generateWater();

        if (!specialWorldProps.noMobs) chunk.spawnMobs(day);

        if (!specialWorldProps.flat) {
            chunk.generateTrees();
            chunk.generateGrass();
        }

        chunk.generateBedrock();

        chunk.generated = true;
    }
}

function generateStructures(dimensionIndex = activeDimension) {
    const dimension = dimensions[dimensionIndex];
    dimension.chunks.forEach((chunk, chunkX) => {
        if (chunk.generated) {
            return;
        }

        const chunkIndex = chunkX / (CHUNK_WIDTH * BLOCK_SIZE);
        const structureNoiseValue = dimension.noiseMaps.structure.getNoise(
            chunkIndex,
            0
        );

        // console.log(
        //     "Structure noise value for chunk",
        //     chunkIndex,
        //     "is",
        //     structureNoiseValue
        // );

        if (structureNoiseValue > 10) {
            const allStructureNames = Object.keys(Structures);
            const candidates = allStructureNames.filter((name) => {
                const structure = Structures[name];
                return (
                    structure.biome === null || structure.biome === chunk.biome
                );
            });

            const underground = Math.random() < 0.5;
            const filteredCandidates = candidates.filter((name) => {
                const structure = Structures[name];
                return structure.underground === underground;
            });

            if (filteredCandidates.length === 0) return;

            const randomName =
                filteredCandidates[RandomRange(0, filteredCandidates.length)];
            const structure = Structures[randomName];

            const structureX =
                chunk.x +
                RandomRange(0, CHUNK_WIDTH) * BLOCK_SIZE +
                structure.shift.x * BLOCK_SIZE;

            let structureY;
            if (structure.underground) {
                const localX = chunk.getLocalX(structureX);
                const surfaceBlockY = chunk.findGroundLevel(localX, true);
                if (surfaceBlockY === 0) return;
                const surfaceY = surfaceBlockY * BLOCK_SIZE;
                const undergroundOffset =
                    RandomRange(8, CHUNK_HEIGHT / 2.5) * BLOCK_SIZE;
                structureY = surfaceY + undergroundOffset;
            } else {
                const localX = chunk.getLocalX(structureX);
                const surfaceBlockY = chunk.findGroundLevel(localX, true);
                const surfaceY = surfaceBlockY * BLOCK_SIZE;
                structureY =
                    surfaceY -
                    structure.blocks.length * BLOCK_SIZE +
                    structure.shift.y * BLOCK_SIZE;
            }

            GenerateStructure(randomName, structureX, structureY);
        }
    });
}

function GetChunkByIndex(index) {
    // Calculate the world x-coordinate of the chunk based on its index
    const chunkX = index * CHUNK_WIDTH * BLOCK_SIZE;

    // Retrieve the chunk from the Map using its x-coordinate
    return getDimensionChunks().get(chunkX);
}

function getBiomeForNoise(temp, wetness, mountains, biomeSet) {
    for (let biomeName in biomeSet) {
        const biome = biomeSet[biomeName];
        if (
            temp >= biome.minTemp &&
            temp <= biome.maxTemp &&
            wetness >= biome.minWet &&
            wetness <= biome.maxWet &&
            mountains >= biome.minMount &&
            mountains <= biome.maxMount
        ) {
            return biome;
        }
    }
    return biomeSet.Plains || Object.values(biomeSet)[0]; // Default to first available biome
}

function getBlockWorldPosition(block) {
    return new Vector2(block.transform.position.x, block.transform.position.y);
}

function GetBlockAtWorldPosition(
    worldX,
    worldY,
    wall = false,
    dimensionIndex = activeDimension
) {
    const targetChunk = GetChunkForX(worldX, dimensionIndex);
    if (!targetChunk || worldY >= CHUNK_HEIGHT * BLOCK_SIZE) return null;

    // Subtract the chunk's x offset from the worldX before dividing by BLOCK_SIZE.
    const localX = Math.floor((worldX - targetChunk.x) / BLOCK_SIZE);
    const localY = Math.floor(worldY / BLOCK_SIZE);

    return targetChunk.getBlock(localX, localY, false, wall);
}

function placePortalInDimension(dimension, position) {
    const range = 8;

    // Check if there is an existing portal
    for (let x = -range; x <= range; x++) {
        const chunk = GetChunkForX(position.x + x * BLOCK_SIZE, dimension);

        if (chunk) {
            const portals = chunk.getAllBlocks(Blocks.NetherPortal);

            if (portals.length > 0) {
                // If a portal exists, return the first one
                return portals[portals.length - 1].transform.position;
            }
        }
    }

    // If no portal exists, create a new one

    // Bottom
    // Loop through world positions to create a portal
    for (let i = 0; i < 4; i++) {
        const blockX = position.x + i * BLOCK_SIZE;
        const blockY = position.y;

        bufferBlock(blockX, blockY, Blocks.Obsidian, dimension);
    }
    // Top
    for (let i = 0; i < 4; i++) {
        const blockX = position.x + i * BLOCK_SIZE;
        const blockY = position.y + BLOCK_SIZE * 4;

        bufferBlock(blockX, blockY, Blocks.Obsidian, dimension);
    }
    // Sides
    for (let i = 0; i < 4; i++) {
        const blockX = position.x;
        const blockY = position.y + i * BLOCK_SIZE;

        bufferBlock(blockX, blockY, Blocks.Obsidian, dimension);
    }
    for (let i = 0; i < 4; i++) {
        const blockX = position.x + BLOCK_SIZE * 3;
        const blockY = position.y + i * BLOCK_SIZE;

        bufferBlock(blockX, blockY, Blocks.Obsidian, dimension);
    }
    // Something to stand on under the portal
    for (let i = 0; i < 6; i++) {
        const blockX = position.x + i * BLOCK_SIZE - BLOCK_SIZE;
        const blockY = position.y + BLOCK_SIZE * 5;

        bufferBlock(blockX, blockY, Blocks.Cobblestone, dimension);
    }

    // Create the portal
    for (let y = 1; y < 4; y++) {
        for (let x = 1; x < 3; x++) {
            const blockX = position.x + x * BLOCK_SIZE;
            const blockY = position.y + y * BLOCK_SIZE;

            bufferBlock(blockX, blockY, Blocks.NetherPortal, dimension);
        }
    }
    // Return the bottom center of the portal
    return new Vector2(
        position.x + BLOCK_SIZE * 1.5,
        position.y + BLOCK_SIZE * 3
    );
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

function SetBlockTypeAtPosition(
    worldX,
    worldY,
    blockType,
    wall = false,
    dimensionIndex = activeDimension
) {
    const block = GetBlockAtWorldPosition(worldX, worldY, wall, dimensionIndex);

    if (!block) {
        // Buffer the block placement

        return;
    }

    block.setBlockType(blockType);
}

function bufferBlock(
    worldX,
    worldY,
    blockType,
    dimensionIndex = activeDimension,
    metaData = null,
    wall = false,
    calculateY = true
) {
    const targetChunkX = getChunkXForWorldX(worldX);

    if (calculateY) worldY = CHUNK_HEIGHT * BLOCK_SIZE - worldY;

    if (!getDimension(dimensionIndex).pendingBlocks.has(targetChunkX)) {
        getDimension(dimensionIndex).pendingBlocks.set(targetChunkX, {
            dimensionIndex: dimensionIndex,
            blocks: [],
        });
    }
    getDimension(dimensionIndex).pendingBlocks.get(targetChunkX).blocks.push({
        x: worldX,
        y: worldY,
        blockType,
        metaData,
        wall,
    });
}

function GetChunkForX(worldX, dimensionIndex = activeDimension) {
    const dimension = dimensions[dimensionIndex];
    const chunkX =
        Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
        (CHUNK_WIDTH * BLOCK_SIZE);
    return dimension.chunks.get(chunkX);
}

function getChunkXForWorldX(worldX) {
    const chunkSize = CHUNK_WIDTH * BLOCK_SIZE;
    return Math.floor(worldX / chunkSize) * chunkSize;
}
