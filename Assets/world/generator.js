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
    console.time("Chunks generated in");

    // PrintNoiseOutput();

    for (let i = 0; i < 50; i++) {
        // Get the temperature from the noise map for this chunk
        const temp = worldTemperatureNoiseMap.getNoise(i);

        // Determine the biome based on the temperature
        const biome = getBiomeForTemperature(temp);

        const newChunk = new Chunk(i * CHUNK_WIDTH * BLOCK_SIZE, CHUNK_WIDTH, biome);

        // Create and push the chunk with the determined biome
        chunks.push(newChunk);
    }

    // Post generation
    chunks.forEach(chunk => {
        chunk.generateCaves();
        chunk.generateTrees();
        chunk.generateBedrock();
    });

    console.timeEnd("Chunks generated in");
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
