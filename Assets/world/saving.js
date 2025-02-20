let currentSave = {
    playerPosition: new Vector2(),
    seed: 0,
    chunks: new Map(),
    pendingBlocks: new Map(),
};

// Assuming chunks, seed, pendingBlocks, etc. are defined elsewhere in the global scope

function SaveWorld() {
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
            previousChunk: chunk.previousChunk.x,
            blocks: blocks,
            walls: walls,
        });
    });
    // savedChunks.splice(1, savedChunks.length - 1);

    if (player) {
        currentSave.playerPosition = JSON.stringify(player.position);
    }
    currentSave.chunks = savedChunks;
    currentSave.seed = seed;
    currentSave.pendingBlocks = pendingBlocks;

    const saveData = JSON.stringify(currentSave);
    saveJSONToFile(saveData, "world");
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

    if (SPAWN_PLAYER) {
        const position = JSON.parse(currentSave.playerPosition);
        SpawnPlayer(new Vector2(position.x, position.y));
    }

    setTimeout(() => {
        loadingWorld = false;
    }, 500);
}
