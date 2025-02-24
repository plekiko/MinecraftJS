let currentSave = {
    playerPosition: new Vector2(),
    gamemode: 0,
    time: 0,
    inventoryItems: [[]],
    seed: 0,
    chunks: new Map(),
    pendingBlocks: new Map(),
};

// Assuming chunks, seed, pendingBlocks, etc. are defined elsewhere in the global scope

function SaveWorld(message = true, toFile = false) {
    let savedChunks = [];

    chunks.forEach((chunk) => {
        let blocks = [];
        let walls = [];

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            blocks[y] = [];
            walls[y] = [];
            for (let x = 0; x < CHUNK_WIDTH; x++) {
                blocks[y][x] = chunk.blocks[y][x].blockType; // Assuming blockType is a property
                walls[y][x] = chunk.walls[y][x].blockType; // Assuming blockType is a property

                if (chunk.blocks[y][x].metaData) {
                    // Create object from block like: {0, metaData: {props: {}}}
                    blocks[y][x] = {
                        t: chunk.blocks[y][x].blockType,
                        m: JSON.stringify(chunk.blocks[y][x].metaData),
                    };
                }
            }
        }

        savedChunks.push({
            x: chunk.x,
            biome: chunk.biome.name,
            previousChunk: chunk.previousChunk ? chunk.previousChunk.x : null,
            blocks: blocks,
            walls: walls,
        });
    });
    // savedChunks.splice(1, savedChunks.length - 1);

    let playerInventory = [[]];

    for (let i = 0; i < player.inventory.items.length; i++) {
        playerInventory[i] = [];
        for (let j = 0; j < player.inventory.items[i].length; j++) {
            playerInventory[i][j] = player.inventory.items[i][j].item;
        }
    }

    currentSave.time = time;

    if (player) {
        currentSave.playerPosition = JSON.stringify(player.position);

        currentSave.inventoryItems = JSON.stringify(playerInventory);

        currentSave.gamemode = player.gamemode;
    }
    currentSave.chunks = savedChunks;
    currentSave.seed = seed;
    currentSave.pendingBlocks = pendingBlocks;

    const saveData = JSON.stringify(currentSave);
    // saveJSONToFile(saveData, "world");

    if (toFile) {
        saveJSONToFile(saveData, "world");
        return;
    }

    let worldName = "world";
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

function LoadWorldFromLocalStorage() {
    let selectedWorld = localStorage.getItem("selectedWorld");

    if (selectedWorld) {
        selectedWorld = JSON.parse(selectedWorld);
    } else {
        return;
    }

    const selectedWorldData = localStorage.getItem(selectedWorld.id);

    if (!selectedWorldData) {
        if (SPAWN_PLAYER) {
            setTimeout(() => {
                SpawnPlayer();
                SaveWorld(false);
            }, 100);
        }
        return;
    }

    LoadWorld(selectedWorldData);
}

LoadWorldFromLocalStorage();

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

function LoadWorld(save) {
    try {
        currentSave = JSON.parse(save);
    } catch (error) {
        console.error("Failed to load world: ", error);
        return; // Exit if loading fails
    }

    loadingWorld = true;

    // Reinitialize global variables
    chunks = new Map();
    // pendingBlocks = new Map();
    setSeed(currentSave.seed);

    entities = [];

    currentSave.chunks.forEach((chunk) => {
        const previousChunk = chunk.previousChunk
            ? chunks.get(chunk.previousChunk)
            : null;
        const constructedChunk = new Chunk(
            chunk.x,
            CHUNK_WIDTH,
            Biomes[chunk.biome],
            previousChunk,
            pendingBlocks,
            worldGrassNoiseMap,
            true
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
                    chunk.blocks[y][x].m
                        ? JSON.parse(chunk.blocks[y][x].m)
                        : null,
                    false
                );

                if (
                    GetBlock(constructedChunk.blocks[y][x].blockType)
                        .lightLevel > 0
                ) {
                    constructedChunk.addLightSource(
                        new Vector2(x, y),
                        GetBlock(constructedChunk.blocks[y][x].blockType)
                            .lightLevel,
                        false
                    );
                }
                // Walls
                constructedChunk.setBlockType(
                    x,
                    y,
                    chunk.walls[y][x].t
                        ? chunk.walls[y][x].t
                        : chunk.walls[y][x],
                    true,
                    chunk.walls[y][x].m
                        ? JSON.parse(chunk.walls[y][x].m)
                        : null,
                    false
                );
            }
        }

        chunks.set(chunk.x, constructedChunk);
    });

    pendingBlocks = new Map();

    time = currentSave.time;

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

            player.setGamemode(currentSave.gamemode);

            SaveWorld(false);
        }, 100);
    }

    setTimeout(() => {
        loadingWorld = false;
    }, 500);
}
