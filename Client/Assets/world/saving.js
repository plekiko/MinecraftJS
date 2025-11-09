const AUTOSAVE_INTERVAL = 300000;

setInterval(() => {
    autoSave();
}, AUTOSAVE_INTERVAL);

function autoSave() {
    if (loadingWorld) return;
    if (multiplayer) return;
    SaveWorld(false);

    chat.message("World auto-saved successfully!", "", Colors.Green);
}

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
            ``;
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
        currentSave.flying = player.abilities.flying;
    }

    currentSave.seed = seed;
    currentSave.dimensions = savedDimensions;

    const saveData = JSON.stringify(currentSave);

    let worldName = "New World";
    let id = Date.now();

    let worlds = localStorage.getItem("worlds");
    let selectedWorld = localStorage.getItem("selectedWorld");

    if (selectedWorld) {
        selectedWorld = JSON.parse(selectedWorld);
        worldName = selectedWorld.name;

        if (toFile) {
            saveJSONToFile(saveData, worldName ? worldName : "world");
            return;
        }

        id = selectedWorld.id;
    } else {
        worldName = prompt("Enter world name: ", worldName);

        if (toFile) {
            saveJSONToFile(saveData, worldName ? worldName : "world");
            return;
        }
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
            const block = chunk.blocks[y][x];
            const wall = chunk.walls[y][x];

            // Save block
            blocks[y][x] = block.blockType;
            if (block.metaData) {
                blocks[y][x] = { t: block.blockType, m: block.metaData };
            }
            if (block.linkedBlocks && block.linkedBlocks.length > 1) {
                blocks[y][x] = {
                    t: block.blockType,
                    l: block.linkedBlocks,
                };
            }

            // Save wall
            walls[y][x] = wall.blockType;
            if (wall.metaData) {
                walls[y][x] = { t: wall.blockType, m: wall.metaData };
            }
            if (wall.linkedBlocks && wall.linkedBlocks.length > 1) {
                if (!typeof walls[y][x] === "object") {
                    walls[y][x] = {
                        t: wall.blockType,
                        l: JSON.stringify(wall.linkedBlocks),
                    };
                } else wall[y][x].l = JSON.stringify(wall.linkedBlocks);
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
        chat.welcomeMessage();
        if (selectedWorld.seed) LoadCustomSeed(selectedWorld.seed);
        if (SPAWN_PLAYER) {
            setTimeout(() => {
                SpawnPlayer();
                player.setGamemode(selectedWorld.gameMode);
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

            if (currentSave.flying) player.abilities.flying = true;

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

    const biomeName =
        chunk.biome && chunk.biome.name ? chunk.biome.name : chunk.biome;
    const biome = AllBiomes[biomeName];

    const constructedChunk = new Chunk(
        x,
        CHUNK_WIDTH,
        biome,
        previousChunk,
        true
    );

    constructedChunk.generateArray();

    // First pass: Set block types without handling extended blocks
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let x = 0; x < CHUNK_WIDTH; x++) {
            // Blocks
            const blockData = chunk.blocks[y][x];
            const blockType = blockData.t ? blockData.t : blockData;
            const metaData = blockData.m ? blockData.m : null;

            constructedChunk.setBlockType(
                x,
                y,
                blockType,
                false,
                metaData,
                false, // Skip calculateY since we're in chunk-local coordinates
                false, // Skip updateBlocks to do it in a second pass
                false
            );

            // Walls
            const wallData = chunk.walls[y][x];
            const wallType = wallData.t ? wallData.t : wallData;
            const wallMetaData = wallData.m ? JSON.parse(wallData.m) : null;

            constructedChunk.setBlockType(
                x,
                y,
                wallType,
                true,
                wallMetaData,
                false,
                false,
                false
            );
        }
    }

    // Second pass: Restore linkedBlocks
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let x = 0; x < CHUNK_WIDTH; x++) {
            // Blocks
            const blockData = chunk.blocks[y][x];
            const block = constructedChunk.blocks[y][x];
            if (blockData.l) {
                block.linkedBlocks = blockData.l;
            }

            // Walls
            const wallData = chunk.walls[y][x];
            const wall = constructedChunk.walls[y][x];
            if (wallData.l) {
                wall.linkedBlocks = wallData.l;
            }
        }
    }

    dimension.chunks.set(x, constructedChunk);
}
