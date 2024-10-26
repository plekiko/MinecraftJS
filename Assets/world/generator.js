const chunks = new Map();
const pendingBlocks = new Map();

tooloud.Perlin.setSeed(Math.floor(Math.random() * 10000));

const worldGrassNoiseMap = new Noise(550, 0.2, 1);

const worldTemperatureNoiseMap = new Noise(
    30, // Scale (size)
    40, // Intensity
    20
);

const worldWetnessNoiseMap = new Noise(
    30, // Scale (size)
    40, // Intensity
    20
);

const worldTreeNoiseMap = new Noise(
    100, // Scale (size)
    10, // Intensity
    5
);

const worldCaveNoiseMap = new Noise(
    65, // Scale (size)
    10, // Intensity
    5
);

function PrintNoiseOutput(noise, count = 100) {
    // Initialize variables to track min and max
    let minValue = Infinity;
    let maxValue = -Infinity;

    // Print noise values and track min/max
    for (let i = 0; i < count; i++) {
        const noiseValue = noise.getNoise(i, 0, 0);
        console.log(`Mapped noise value: ${i} - ${noiseValue}`);

        // Update min and max
        if (noiseValue < minValue) minValue = noiseValue;
        if (noiseValue > maxValue) maxValue = noiseValue;
    }

    // Print the minimum and maximum values
    console.log("Minimum Noise Value:", minValue);
    console.log("Maximum Noise Value:", maxValue);
}

function GenerateWorld() {
    const currentChunkIndex = camera.getCurrentChunkIndex();

    // Generate chunks within the visible range of the camera
    for (
        let i = currentChunkIndex - RENDER_DISTANCE;
        i <= currentChunkIndex + RENDER_DISTANCE;
        i++
    ) {
        const chunkX = i * CHUNK_WIDTH * BLOCK_SIZE; // Calculate the chunk's x position

        // Check if the chunk already exists at this x position in the Map
        if (!chunks.has(chunkX)) {
            const temp = worldTemperatureNoiseMap.getNoise(i, 2000);
            const wetness = worldWetnessNoiseMap.getNoise(i, 1000);

            const biome = GetBiomeForNoise(temp, wetness);

            const newChunk = new Chunk(
                chunkX,
                CHUNK_WIDTH,
                biome,
                pendingBlocks,
                worldGrassNoiseMap
            );

            // Add the new chunk to the Map, keyed by its x position
            chunks.set(chunkX, newChunk);

            newChunk.applyBufferedBlocks();
        }
    }

    // Post generation (trees, caves, bedrock)
    chunks.forEach((chunk) => {
        if (!chunk.generated) {
            chunk.generateCaves();
            chunk.generateGrass();
            chunk.generateTrees();
            chunk.generateBedrock();
            chunk.generated = true; // Mark chunk as fully generated
        }
    });
}

function GetChunkByIndex(index) {
    // Calculate the world x-coordinate of the chunk based on its index
    const chunkX = index * CHUNK_WIDTH * BLOCK_SIZE;

    // Retrieve the chunk from the Map using its x-coordinate
    return chunks.get(chunkX);
}

function GetBiomeForNoise(temp, wetness) {
    // console.log(`Checking biome for temp: ${temp}, wetness: ${wetness}`); // Debugging log

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
            wetness <= biome.maxWet // Wetness check
        ) {
            // console.log(`Matched biome: ${biome.name}`);
            return biome;
        }
    }

    // console.log("No match found, returning Planes.");
    // Default case: if no biome matches, return the default "Planes" biome
    return Biomes.Planes;
}

function GetBlockAtWorldPosition(worldX, worldY) {
    // Remove camera influence from world coordinates to get the correct world position
    const adjustedWorldX = worldX + camera.x;
    const adjustedWorldY = worldY + camera.y;

    const targetChunk = GetChunkForBlock(adjustedWorldX, chunks);

    if (targetChunk && adjustedWorldY < CHUNK_HEIGHT * BLOCK_SIZE) {
        const localX = targetChunk.getLocalX(Math.floor(adjustedWorldX));
        const localY = Math.floor(adjustedWorldY / BLOCK_SIZE);

        return targetChunk.getBlock(localX, localY, false);
    } else {
        return null;
    }
}

function SetBlockTypeAtPosition(worldX, worldY, blockType) {
    const targetChunk = GetChunkForBlock(worldX, chunks);
    const BLOCK_SIZE = 16; // Set your block size value
    const CHUNK_WIDTH = 8; // Set your chunk width value

    if (targetChunk && worldY < targetChunk.height * BLOCK_SIZE) {
        const localX = GetLocalX(worldX, targetChunk, BLOCK_SIZE);
        const localY = worldY / BLOCK_SIZE;

        targetChunk.setBlockType(localX, localY, blockType);
    } else {
        if (blockType === BlockType.Air) return;

        // Buffer the block to place it once the chunk is generated
        const chunkX =
            Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
            CHUNK_WIDTH *
            BLOCK_SIZE;

        if (!pendingBlocks.has(chunkX)) {
            pendingBlocks.set(chunkX, []);
        }
        pendingBlocks.get(chunkX).push({ x: worldX, y: worldY, blockType });
    }
}

function GetChunkForBlock(worldX, chunks) {
    const chunkX =
        Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
        CHUNK_WIDTH *
        BLOCK_SIZE;
    return chunks.get(chunkX); // Assuming chunks is a Map of chunks by x-coordinate
}

function getBlockScreenPosition(blockWorldX, blockWorldY, camera) {
    // Calculate the block’s screen X and Y positions based on the camera offset
    const screenX = blockWorldX - camera.x + CANVAS.width / 2;
    const screenY = blockWorldY - camera.y + CANVAS.height / 2;

    return new Vector2(screenX, screenY);
}
