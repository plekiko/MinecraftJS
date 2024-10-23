const chunks = [];

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
    console.log('Minimum Noise Value:', minValue);
    console.log('Maximum Noise Value:', maxValue);
}

function GenerateWorld() {
    // console.time("Chunks generated in");

    const currentChunkIndex = camera.getCurrentChunkIndex(chunks);
    
    // Generate chunks within the visible range of the camera
    for (let i = currentChunkIndex - RENDER_DISTANCE; i < currentChunkIndex + RENDER_DISTANCE; i++) {
        const chunkExists = chunks.some(chunk => chunk.x === i * CHUNK_WIDTH * BLOCK_SIZE);
        
        if (!chunkExists) {
            const temp = worldTemperatureNoiseMap.getNoise(i);
            const biome = getBiomeForTemperature(temp);
            console.log(i + " is " + temp + " so is a " + biome.name)
            const newChunk = new Chunk(i * CHUNK_WIDTH * BLOCK_SIZE, CHUNK_WIDTH, biome);
            
            // Add the new chunk to the array
            chunks.push(newChunk);
        }
    }

    // Post generation (trees, caves, bedrock)
    chunks.forEach(chunk => {
        if (!chunk.generated) { // Ensure generation logic only happens once per chunk
            chunk.generateCaves();
            chunk.generateTrees();
            chunk.generateBedrock();
            chunk.generated = true; // Mark chunk as fully generated
        }
    });

    // console.timeEnd("Chunks generated in");
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
