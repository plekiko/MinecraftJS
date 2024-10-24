const chunks = new Map();
const pendingBlocks = new Map();

tooloud.Perlin.setSeed(Math.floor(Math.random() * 10000));

const worldTemperatureNoiseMap = new Noise(
    100, // Scale (size)
    90, // Intensity
    25
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

function PrintNoiseOutput() {
    // Initialize variables to track min and max
    let minValue = Infinity;
    let maxValue = -Infinity;

    // Print noise values and track min/max
    for (let i = 0; i < 100; i++) {
        const noiseValue = worldTreeNoiseMap.getNoise(i, 0, 0);
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
            const temp = worldTemperatureNoiseMap.getNoise(i);
            const biome = getBiomeForTemperature(temp);
            const newChunk = new Chunk(
                chunkX,
                CHUNK_WIDTH,
                biome,
                pendingBlocks
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

function getBiomeForTemperature(temp) {
    // Iterate through the available biomes and find one that matches the temperature range
    for (let biomeName in Biomes) {
        const biome = Biomes[biomeName];
        if (temp >= biome.minTemp && temp <= biome.maxTemp) {
            // console.log("Getting temp of: " + temp + " returning: " + biome.name)
            return biome;
        }
    }

    // Default case: if no biome matches, return a default biome (optional)
    return Biomes.Planes; // or any other default biome
}

// Helper function for linear interpolation (LERP)
function lerp(a, b, t) {
    return a + (b - a) * t;
}
