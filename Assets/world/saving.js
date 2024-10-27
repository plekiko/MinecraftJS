let currentSave = { seed: 0, chunks: new Map(), pendingBlocks: new Map() };

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
            }
        }

        savedChunks.push({
            x: chunk.x,
            biome: chunk.biome,
            previousChunk: chunk.previousChunk,
            blocks: blocks,
            walls: walls,
        });
    });
    // savedChunks.splice(1, savedChunks.length - 1);

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
    a.download = `${filename}.json`;
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

    camera.x = 0;
    camera.y = (CHUNK_HEIGHT * BLOCK_SIZE) / 2.5;

    // Reinitialize global variables
    chunks = new Map();
    // pendingBlocks = new Map();
    seed = currentSave.seed; // Set the seed before processing chunks

    currentSave.chunks.forEach((chunk) => {
        const constructedChunk = new Chunk(
            chunk.x,
            CHUNK_WIDTH,
            chunk.biome,
            chunk.previousChunk,
            pendingBlocks,
            worldGrassNoiseMap,
            true
        );

        const constructedBlocks = [];
        const constructedWalls = [];

        // Construct the blocks from save file
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            constructedBlocks[y] = [];
            constructedWalls[y] = [];
            for (let x = 0; x < CHUNK_WIDTH; x++) {
                const newBlock = new Block(x, y);
                const newWall = new Block(x, y, Blocks.Air, true);

                newBlock.setBlockType(chunk.blocks[y][x]);
                newWall.setBlockType(chunk.walls[y][x]);

                constructedBlocks[y][x] = newBlock;
                constructedWalls[y][x] = newWall;
            }
        }

        constructedChunk.blocks = constructedBlocks;
        constructedChunk.walls = constructedWalls;

        chunks.set(constructedChunk.x, constructedChunk);
    });
}
