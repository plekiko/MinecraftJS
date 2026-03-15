let seed = 0;
// let seed = 0;

tooloud.Perlin.setSeed(seed);

let specialWorldProps = {};
let multiplayerSeedLoaded = !multiplayer;

let forceToBiome = null;

function setSeed(newSeed) {
    seed = newSeed;
    tooloud.Perlin.setSeed(seed);
}

let loadingWorld = true;

function printNoiseOutput(noise, count = 100) {
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

function locateBiome(biome) {
    for (let i = 0; i < 10000; i++) {
        let currentBiome = calculateChunkBiome(i);

        if (currentBiome === biome) return i;

        currentBiome = calculateChunkBiome(-i);

        if (currentBiome === biome) return -i;
    }

    return false;
}

function loadCustomSeed(seed) {
    specialWorldProps = {};
    forceToBiome = null;

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

function biomesInChunkCount(count) {
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

function regenerateWorld() {
    let seed = Math.floor(Math.random() * 10000);
    tooloud.Perlin.setSeed(seed);

    entities = [];

    entities.push(player);

    setTimeout(() => {
        player.setOnGround();
    }, 1);
}

async function getChunkFromServer(x, dimensionIndex = activeDimension) {
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
                const chunkFromServer = await getChunkFromServer(
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
                    loadChunk(chunkX, chunkFromServer, dimensionIndex);
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

        postProcessChunk(getChunkForX(chunkX, dimensionIndex));

        if (willUploadChunk) {
            uploadChunkToServer(chunkX, dimensionIndex);
        }
    }
}

function serverPlaceBlock(
    chunkX,
    x,
    y,
    blockType,
    isWall = false,
    dimensionIndex = activeDimension
) {
    if (!multiplayer) return;
    server.send({
        type: "placeBlock",
        sender: player.UUID,
        message: {
            x: x,
            y: y,
            blockType: blockType,
            isWall: isWall,
            chunkX: chunkX,
            dimensionIndex: dimensionIndex,
        },
    });

    uploadChunkToServer(chunkX, dimensionIndex);
}

function serverBreakBlock(
    chunkX,
    x,
    y,
    blockType,
    isWall = false,
    shouldDrop = false,
    dimensionIndex = activeDimension
) {
    if (!multiplayer) return;
    server.send({
        type: "breakBlock",
        sender: player.UUID,
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

    uploadChunkToServer(chunkX, dimensionIndex);
}

async function uploadChunkToServer(chunkX, dimensionIndex = activeDimension) {
    if (!player) return;
    if (!multiplayer) return;
    const chunk = getChunkForX(chunkX, dimensionIndex);
    await server.send({
        type: "uploadChunk",
        message: {
            x: chunkX,
            chunk: saveChunk(chunk),
            dimensionIndex: dimensionIndex,
        },
        sender: player.UUID,
    });
    console.log(`Uploaded chunk ${chunkX} to server`);
}

function generateStructure(structure, x, y) {
    const structureData = Structures[structure];
    if (!structureData) return;

    const originBlockX = Math.floor(x / BLOCK_SIZE) + structureData.shift.x;
    const originBlockY = Math.floor(y / BLOCK_SIZE) + structureData.shift.y;

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
            const rowIndex = structureHeight - 1 - j;
            const blockRow = structureData.blocks[rowIndex] || [];
            const wallRow = structureData.walls?.[rowIndex] || [];

            const blockType = blockRow[colIndex] ?? Blocks.Air;
            const wallType = wallRow[colIndex] ?? Blocks.Air;

            const blockX = (originBlockX + i) * BLOCK_SIZE;
            const blockUserY = originBlockY + j;
            const blockY = userBlockYToWorld(blockUserY);

            if (!chunk) chunk = getChunkForX(blockX);

            // Process Blocks:
            if (blockType instanceof LootTable) {
                generateChestWithLoot(blockType, blockX, blockY, chunk);
            } else {
                if (blockType !== Blocks.Air) {
                    chunk.setBlockTypeAtPosition(blockX, blockY, blockType);
                }
            }

            // Process Walls:
            if (wallType instanceof LootTable) {
                generateChestWithLoot(wallType, blockX, blockY, chunk);
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

function generateChestWithLoot(lootTable, x, y, chunk) {
    const loot = lootTable.getRandomLoot();

    let storage = [[]];

    for (let y = 0; y < 3; y++) {
        storage[y] = [];
        for (let x = 0; x < 9; x++) {
            storage[y][x] = new InventoryItem();
        }
    }

    const newStorage = populateStorageWithLoot(loot, storage);

    chunk.setBlockTypeAtPosition(
        x,
        y,
        Blocks.Chest,
        new Metadata({ props: { storage: newStorage } })
    );
}

function populateStorageWithLoot(loot, storage) {
    for (const item of loot) {
        let placed = false;
        let attempts = 10;
        while (!placed && attempts > 0) {
            const randomSlotX = randomRange(0, storage[0].length);
            const randomSlotY = randomRange(0, storage.length);
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
    if (forceToBiome != null) biome = forceToBiome;
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

function getChunk(worldX, dimension = activeDimension) {
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
                const correctDimension = dimensionIndex === structure.dimension;
                return (
                    structure.underground === underground && correctDimension
                );
            });

            if (filteredCandidates.length === 0) return;

            const randomName =
                filteredCandidates[randomRange(0, filteredCandidates.length)];
            const structure = Structures[randomName];

            const structureX =
                chunk.x + randomRange(0, CHUNK_WIDTH) * BLOCK_SIZE;

            let structureY;
            const localX = chunk.getLocalX(structureX);
            const surfaceAirY = chunk.findGroundLevel(localX, false, true);
            const surfaceGroundY = surfaceAirY - 1;

            if (structure.underground) {
                const undergroundOffset = randomRange(8, CHUNK_HEIGHT / 2.5);
                structureY = (surfaceGroundY - undergroundOffset) * BLOCK_SIZE;
            } else {
                structureY = surfaceAirY * BLOCK_SIZE;
            }

            generateStructure(randomName, structureX, structureY);
        }
    });
}

function fill(
    startX,
    startY,
    endX,
    endY,
    blockType,
    dimensionIndex = activeDimension
) {
    const originalStartX = startX;
    const originalStartY = startY;

    if (startX > endX) {
        startX = endX;
        endX = originalStartX;
    }

    if (startY > endY) {
        startY = endY;
        endY = originalStartY;
    }

    for (let x = startX; x <= endX; x += BLOCK_SIZE) {
        for (let y = startY; y <= endY; y += BLOCK_SIZE) {
            setBlockTypeAtPosition(
                x,
                y,
                blockType,
                false,
                dimensionIndex,
                null
            );
        }
    }
}

function worldToBlocks(position) {
    const blockX = Math.floor(position.x / BLOCK_SIZE);
    const blockY = worldToUserBlockY(position.y);

    return new Vector2(blockX, blockY);
}

function worldToUserBlockY(worldY) {
    return CHUNK_HEIGHT - Math.floor(worldY / BLOCK_SIZE);
}

function userBlockYToWorld(blockY) {
    return (CHUNK_HEIGHT - blockY) * BLOCK_SIZE;
}

function userBlocksToWorldPosition(blockX, blockY) {
    return new Vector2(blockX * BLOCK_SIZE, userBlockYToWorld(blockY));
}

function getBlockAtUserBlockPosition(
    blockX,
    blockY,
    wall = false,
    dimensionIndex = activeDimension
) {
    const worldPos = userBlocksToWorldPosition(blockX, blockY);
    return getBlockAtWorldPosition(
        worldPos.x,
        worldPos.y,
        wall,
        dimensionIndex
    );
}

function setBlockTypeAtUserBlockPosition(
    blockX,
    blockY,
    blockType,
    wall = false,
    dimensionIndex = activeDimension,
    metaData = null,
    updateAdjacent = true
) {
    const worldPos = userBlocksToWorldPosition(blockX, blockY);
    return setBlockTypeAtPosition(
        worldPos.x,
        worldPos.y,
        blockType,
        wall,
        dimensionIndex,
        metaData,
        false,
        updateAdjacent
    );
}

function worldToLocal(x, y) {
    const chunkX = getChunkXForWorldX(x);

    const localX = Math.floor((x - chunkX) / BLOCK_SIZE);
    const localY = Math.floor(y / BLOCK_SIZE);

    return new Vector2(localX, localY);
}

function getChunkByIndex(index) {
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
    return biomeSet.Plains || Object.values(biomeSet)[0];
}

function getBlockWorldPosition(block) {
    return new Vector2(block.transform.position.x, block.transform.position.y);
}

function getBlockAtWorldPosition(
    worldX,
    worldY,
    wall = false,
    dimensionIndex = activeDimension
) {
    const targetChunk = getChunkForX(worldX, dimensionIndex);
    if (!targetChunk || worldY >= CHUNK_HEIGHT * BLOCK_SIZE) return null;

    // Subtract the chunk's x offset from the worldX before dividing by BLOCK_SIZE.
    const localX = Math.floor((worldX - targetChunk.x) / BLOCK_SIZE);
    const localY = Math.floor(worldY / BLOCK_SIZE);

    return targetChunk.getBlockLocal(localX, localY, wall);
}

function placePortalInDimension(dimension, position) {
    const range = 8;

    // Check if there is an existing portal
    for (let x = -range; x <= range; x++) {
        const chunk = getChunkForX(position.x + x * BLOCK_SIZE, dimension);

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

        setBlockTypeAtPosition(
            blockX,
            blockY,
            Blocks.Obsidian,
            false,
            dimension,
            null,
            false
        );
    }
    // Top
    for (let i = 0; i < 4; i++) {
        const blockX = position.x + i * BLOCK_SIZE;
        const blockY = position.y + BLOCK_SIZE * 4;

        setBlockTypeAtPosition(
            blockX,
            blockY,
            Blocks.Obsidian,
            false,
            dimension,
            null,
            false
        );
    }
    // Sides
    for (let i = 0; i < 4; i++) {
        const blockX = position.x;
        const blockY = position.y + i * BLOCK_SIZE;

        setBlockTypeAtPosition(
            blockX,
            blockY,
            Blocks.Obsidian,
            false,
            dimension,
            null,
            false
        );
    }
    for (let i = 0; i < 4; i++) {
        const blockX = position.x + BLOCK_SIZE * 3;
        const blockY = position.y + i * BLOCK_SIZE;

        setBlockTypeAtPosition(
            blockX,
            blockY,
            Blocks.Obsidian,
            false,
            dimension,
            null,
            false
        );
    }
    // Something to stand on under the portal
    for (let i = 0; i < 6; i++) {
        const blockX = position.x + i * BLOCK_SIZE - BLOCK_SIZE;
        const blockY = position.y + BLOCK_SIZE * 5;

        setBlockTypeAtPosition(
            blockX,
            blockY,
            Blocks.Cobblestone,
            false,
            dimension,
            null,
            false
        );
    }

    // Create the portal
    for (let y = 1; y < 4; y++) {
        for (let x = 1; x < 3; x++) {
            const blockX = position.x + x * BLOCK_SIZE;
            const blockY = position.y + y * BLOCK_SIZE;

            setBlockTypeAtPosition(
                blockX,
                blockY,
                Blocks.NetherPortal,
                false,
                dimension,
                null,
                false
            );
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
        const block = getBlockAtWorldPosition(
            adjacentPos.x,
            adjacentPos.y,
            wall
        );
        if (!block) continue;

        const type = getBlock(block.blockType);
        if (block && !type.fluid && !type.air) {
            return true; // Found an adjacent block
        }
    }

    return false; // No adjacent block found
}

function setBlockTypeAtPosition(
    worldX,
    worldY,
    blockType,
    wall = false,
    dimensionIndex = activeDimension,
    metaData = null,
    inputIsUserBlockY = true,
    updateAdjacent = false
) {
    if (inputIsUserBlockY) worldY = userBlockYToWorld(worldY / BLOCK_SIZE);

    const chunk = getChunkForX(worldX, dimensionIndex);
    if (!chunk) {
        // Buffer the block placement
        bufferBlock(
            worldX,
            worldY,
            blockType,
            dimensionIndex,
            metaData,
            wall,
            false
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
        updateAdjacent
    );
}

function bufferBlock(
    worldX,
    worldY,
    blockType,
    dimensionIndex = activeDimension,
    metaData = null,
    wall = false,
    inputIsUserBlockY = true
) {
    if (inputIsUserBlockY) worldY = userBlockYToWorld(worldY / BLOCK_SIZE);

    const targetChunkX = getChunkXForWorldX(worldX);

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

function getChunkForX(worldX, dimensionIndex = activeDimension) {
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
