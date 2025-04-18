let currentSave = {
    playerPosition: new Vector2(),
    gamemode: 0,
    time: 0,
    inventoryItems: [[]],
    seed: 0,
    pendingBlocks: new Map(),
    dimensions: [], // Array of { index, chunks: [{ x, biome, previousChunk, blocks, walls }] }
};

function SaveWorld(message = true, toFile = false) {
    let savedDimensions = [];

    // Save chunks and pendingBlocks for each dimension
    dimensions.forEach((dimension, index) => {
        let savedChunks = [];
        dimension.chunks.forEach((chunk) => {
            const newSaveChunk = SaveChunk(chunk);
            savedChunks.push({
                x: chunk.x,
                biome: {
                    name: chunk.biome.name,
                    dimension: index,
                },
                previousChunk: chunk.previousChunk
                    ? chunk.previousChunk.x
                    : null,
                blocks: newSaveChunk.blocks,
                walls: newSaveChunk.walls,
            });
        });

        // Save dimension-specific pendingBlocks
        const savedPendingBlocks = Array.from(
            dimension.pendingBlocks.entries()
        ).map(([chunkX, entry]) => ({
            chunkX,
            dimensionIndex: index,
            blocks: entry.blocks,
        }));

        savedDimensions.push({
            index: index,
            chunks: savedChunks,
            pendingBlocks: savedPendingBlocks, // Store pendingBlocks per dimension
        });
    });

    let playerInventory = [[]];
    for (let i = 0; i < player.inventory.items.length; i++) {
        playerInventory[i] = [];
        for (let j = 0; j < player.inventory.items[i].length; j++) {
            playerInventory[i][j] = player.inventory.items[i][j].item;
        }
    }

    currentSave.time = time;
    currentSave.gameRules = GAMERULES;

    if (player) {
        currentSave.playerPosition = JSON.stringify(player.position);
        currentSave.inventoryItems = JSON.stringify(playerInventory);
        currentSave.gamemode = player.gamemode;
        currentSave.health = player.health;
        currentSave.currentSlot = hotbar.currentSlot;
        currentSave.activeDimension = activeDimension;
    }

    currentSave.seed = seed;
    currentSave.dimensions = savedDimensions;

    const saveData = JSON.stringify(currentSave);

    if (toFile) {
        saveJSONToFile(saveData, "world");
        return;
    }

    let worldName = "New World";
    let id = Date.now();

    let worlds = localStorage.getItem("worlds");
    let selectedWorld = localStorage.getItem("selectedWorld");

    if (selectedWorld) {
        selectedWorld = JSON.parse(selectedWorld);
        worldName = selectedWorld.name;
        id = selectedWorld.id;
    } else {
        worldName = prompt("Enter world name: ", worldName);
    }

    worldData = {
        id: id,
        name: worldName,
        lastPlayed: new Date().toLocaleString(),
    };

    if (worlds) {
        worlds = JSON.parse(worlds);
        if (worlds.find((world) => world.id === id)) {
            worlds = worlds.filter((world) => world.id !== id);
        }
        worlds.push(worldData);
    } else {
        worlds = [worldData];
    }

    if (message) chat.message("World saved successfully!");

    localStorage.setItem("worlds", JSON.stringify(worlds));
    localStorage.setItem(id, saveData);
}

function SaveChunk(chunk) {
    let blocks = [];
    let walls = [];

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
        blocks[y] = [];
        walls[y] = [];
        for (let x = 0; x < CHUNK_WIDTH; x++) {
            blocks[y][x] = chunk.blocks[y][x].blockType;
            walls[y][x] = chunk.walls[y][x].blockType;

            if (chunk.blocks[y][x].metaData) {
                blocks[y][x] = {
                    t: chunk.blocks[y][x].blockType,
                    m: JSON.stringify(chunk.blocks[y][x].metaData),
                };
            }
        }
    }

    return {
        blocks,
        walls,
    };
}

function LoadWorldFromLocalStorage() {
    let selectedWorld = localStorage.getItem("selectedWorld");

    if (selectedWorld) {
        console.log("Loading world from local storage");
        selectedWorld = JSON.parse(selectedWorld);
    } else {
        if (SPAWN_PLAYER) {
            setTimeout(() => {
                SpawnPlayer();
            }, 100);
        }
        return;
    }

    const selectedWorldData = localStorage.getItem(selectedWorld.id);

    if (!selectedWorldData) {
        console.log("World not found in local storage", selectedWorld);
        if (selectedWorld.seed) LoadCustomSeed(selectedWorld.seed);
        if (SPAWN_PLAYER) {
            setTimeout(() => {
                SpawnPlayer();
                setTimeout(() => {
                    SaveWorld(false);
                }, 1500);
            }, 100);
        }
        return;
    }

    LoadWorld(selectedWorldData);
}

const saveJSONToFile = (obj, filename) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.save`;
    a.click();
    URL.revokeObjectURL(url);
};

async function LoadWorld(save) {
    if (!isTexturePackLoaded) {
        await waitForTexturePack();
    }

    try {
        currentSave = JSON.parse(save);
    } catch (error) {
        console.error("Failed to load world: ", error);
        return;
    }

    loadingWorld = true;

    LoadCustomSeed(currentSave.seed);

    // Clear chunks and pendingBlocks for all dimensions
    dimensions.forEach((dimension) => {
        dimension.chunks = new Map();
        dimension.pendingBlocks = new Map(); // Initialize per-dimension pendingBlocks
    });

    entities = [];

    // Load chunks and pendingBlocks for each dimension
    if (currentSave.dimensions) {
        currentSave.dimensions.forEach((dimData) => {
            const dimension = getDimension(dimData.index);
            console.log("Loading dimension:", dimData);

            // Load chunks
            dimData.chunks.forEach((chunk) => {
                LoadChunk(
                    chunk.x,
                    chunk,
                    dimData.index,
                    dimension.pendingBlocks
                );
            });

            // Load dimension-specific pendingBlocks
            if (dimData.pendingBlocks && dimData.pendingBlocks.length > 0) {
                dimData.pendingBlocks.forEach(
                    ({ chunkX, dimensionIndex, blocks }) => {
                        dimension.pendingBlocks.set(chunkX, {
                            dimensionIndex,
                            blocks,
                        });
                        console.log(
                            `Loaded pendingBlocks for chunkX: ${chunkX} in dimension ${dimensionIndex}`
                        );
                    }
                );
            }
        });
    } else {
        // Fallback for older saves with global pendingBlocks
        const dimension = getDimension(Dimensions.Overworld);
        currentSave.chunks.forEach((chunk) => {
            LoadChunk(
                chunk.x,
                chunk,
                Dimensions.Overworld,
                dimension.pendingBlocks
            );
        });

        if (currentSave.pendingBlocks && currentSave.pendingBlocks.length > 0) {
            currentSave.pendingBlocks.forEach(
                ({ chunkX, dimensionIndex, blocks }) => {
                    const targetDimension = getDimension(
                        dimensionIndex || Dimensions.Overworld
                    );
                    targetDimension.pendingBlocks.set(chunkX, {
                        dimensionIndex,
                        blocks,
                    });
                    console.log(
                        `Loaded legacy pendingBlocks for chunkX: ${chunkX} in dimension ${
                            dimensionIndex || Dimensions.Overworld
                        }`
                    );
                }
            );
        }
    }

    time = currentSave.time;

    if (currentSave.gameRules) {
        GAMERULES = currentSave.gameRules;
    }

    if (SPAWN_PLAYER) {
        removeEntity(player);
        player = null;

        setTimeout(() => {
            const position = JSON.parse(currentSave.playerPosition);
            SpawnPlayer(new Vector2(position.x, position.y), false);

            const playerInventory = JSON.parse(currentSave.inventoryItems);
            for (let i = 0; i < playerInventory.length; i++) {
                for (let j = 0; j < playerInventory[i].length; j++) {
                    player.inventory.items[i][j].item = new InventoryItem({
                        blockId: playerInventory[i][j].blockId,
                        itemId: playerInventory[i][j].itemId,
                        count: playerInventory[i][j].count,
                        props: playerInventory[i][j].props,
                    });
                }
            }

            if (currentSave.currentSlot)
                hotbar.currentSlot = currentSave.currentSlot;

            player.setGamemode(currentSave.gamemode);

            if (currentSave.health) player.health = currentSave.health;

            if (currentSave.activeDimension !== undefined)
                gotoDimension(currentSave.activeDimension);

            SaveWorld(false);
        }, 100);
    }

    setTimeout(() => {
        loadingWorld = false;
    }, 500);
}

async function LoadChunk(
    x,
    chunk,
    dimensionIndex = Dimensions.Overworld,
    pendingBlocks
) {
    console.log("Loading chunk:", x, chunk, dimensionIndex);

    const dimension = getDimension(dimensionIndex);
    const previousChunk = chunk.previousChunk
        ? dimension.chunks.get(chunk.previousChunk)
        : null;

    // Use biome.name for newer saves, fallback to biome for older saves
    const biomeName =
        chunk.biome && chunk.biome.name ? chunk.biome.name : chunk.biome;

    // Map the biome name to the dimension's biome set
    const biome = AllBiomes[biomeName];

    const constructedChunk = new Chunk(
        x,
        CHUNK_WIDTH,
        biome,
        previousChunk,
        pendingBlocks, // Pass dimension-specific pendingBlocks
        true,
        dimensionIndex
    );

    constructedChunk.generateArray();

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let x = 0; x < CHUNK_WIDTH; x++) {
            // Blocks
            constructedChunk.setBlockType(
                x,
                y,
                chunk.blocks[y][x].t
                    ? chunk.blocks[y][x].t
                    : chunk.blocks[y][x],
                false,
                chunk.blocks[y][x].m ? JSON.parse(chunk.blocks[y][x].m) : null,
                false
            );

            if (
                GetBlock(constructedChunk.blocks[y][x].blockType).lightLevel > 0
            ) {
                // Handle light-emitting blocks if needed
            }

            // Walls
            constructedChunk.setBlockType(
                x,
                y,
                chunk.walls[y][x].t ? chunk.walls[y][x].t : chunk.walls[y][x],
                true,
                chunk.walls[y][x].m ? JSON.parse(chunk.walls[y][x].m) : null,
                false
            );
        }
    }

    dimension.chunks.set(x, constructedChunk);
}
