let chunks = new Map();
let pendingBlocks = new Map();

let seed = Math.floor(Math.random() * 1000000);
// let seed = 0;

tooloud.Perlin.setSeed(seed);

const worldGrassNoiseMap = new Noise(550, 0.2, 1);

const worldTemperatureNoiseMap = new Noise(
    30, // Scale (size)
    45, // Intensity
    30
);

const worldWetnessNoiseMap = new Noise(
    30, // Scale (size)
    55, // Intensity
    30
);

const worldTreeNoiseMap = new Noise(
    100, // Scale (size)
    10, // Intensity
    5
);

const worldCaveNoiseMap = new Noise(
    55, // Scale (size)
    10, // Intensity
    5
);

const worldMountainsNoiseMap = new Noise(
    30, // Scale (size)
    60, // Intensity
    30
);

const worldCoalNoiseMap = new Noise(
    100, // Scale (size)
    5.3, // Intensity
    5
);
const worldIronNoiseMap = new Noise(
    100, // Scale (size)
    5, // Intensity
    5
);

function PrintNoiseOutput(noise, count = 100) {
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

function RegenerateWorld() {
    let seed = Math.floor(Math.random() * 10000);
    tooloud.Perlin.setSeed(seed);

    pendingBlocks = new Map();
    chunks = new Map();

    entities = [];

    entities.push(player);

    setTimeout(() => {
        player.setOnGround();
    }, 1);
}

function GenerateWorld() {
    const currentChunkIndex = camera.getCurrentChunkIndex();

    // Generate chunks within the visible range of the camera
    for (
        let i = currentChunkIndex - RENDER_DISTANCE;
        i <= currentChunkIndex + RENDER_DISTANCE;
        i++
    ) {
        const chunkX = i * CHUNK_WIDTH * BLOCK_SIZE;

        if (!chunks.has(chunkX)) {
            const oldChunkData = getNeighborBiomeData(i, currentChunkIndex);

            generateChunk(i, chunkX, oldChunkData);
        } else {
            const chunk = chunks.get(chunkX);
            if (chunk.spawnTime && chunk.spawnTime <= passedTime) {
                chunk.spawnMobs(day);

                chunk.spawnTime = 0;
            }
        }
    }

    postProcessChunks();
}

function calculateChunkBiome(chunkIndex) {
    const temp = worldTemperatureNoiseMap.getNoise(chunkIndex, 20000);
    const wetness = worldWetnessNoiseMap.getNoise(chunkIndex, 10000);
    const mountains = worldMountainsNoiseMap.getNoise(chunkIndex, 30000);
    return GetBiomeForNoise(temp, wetness, mountains);
}

function getNeighborBiomeData(currentIndex, cameraIndex) {
    const neighborIndex =
        currentIndex < cameraIndex ? currentIndex + 1 : currentIndex - 1;
    const neighborChunkX = neighborIndex * CHUNK_WIDTH * BLOCK_SIZE;
    const neighborBiome = calculateChunkBiome(neighborIndex);

    return { x: neighborChunkX, biome: neighborBiome };
}

function generateChunk(chunkIndex, chunkX, oldChunkData) {
    const biome = calculateChunkBiome(chunkIndex);

    const newChunk = new Chunk(
        chunkX,
        CHUNK_WIDTH,
        biome,
        oldChunkData,
        pendingBlocks,
        worldGrassNoiseMap
    );

    chunks.set(chunkX, newChunk);
    newChunk.applyBufferedBlocks();
}

function GetChunk(worldX) {
    return chunks.has(worldX) ? chunks.get(worldX) : null;
}

function postProcessChunks() {
    chunks.forEach((chunk) => {
        if (!chunk.generated) {
            chunk.generateOres();
            chunk.generateCaves();
            chunk.generateWater();
            chunk.spawnMobs(day);
            chunk.generateTrees();
            chunk.generateGrass();
            chunk.generateBedrock();
            chunk.updateChunk();
            chunk.generated = true;
        }
    });
}

function GetChunkByIndex(index) {
    // Calculate the world x-coordinate of the chunk based on its index
    const chunkX = index * CHUNK_WIDTH * BLOCK_SIZE;

    // Retrieve the chunk from the Map using its x-coordinate
    return chunks.get(chunkX);
}

function GetBiomeForNoise(temp, wetness, mountains) {
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
            wetness <= biome.maxWet && // Wetness check
            mountains >= biome.minMount &&
            mountains <= biome.maxMount
        ) {
            // console.log(`Matched biome: ${biome.name}`);
            return biome;
        }
    }

    // console.log("No match found, returning Planes.");
    // Default case: if no biome matches, return the default "Planes" biome
    return Biomes.Planes;
}

function getBlockWorldPosition(block) {
    return new Vector2(
        block.transform.position.x + camera.x,
        block.transform.position.y + camera.y
    );
}

function GetBlockAtWorldPosition(worldX, worldY, adjust = true) {
    // Remove camera influence from world coordinates to get the correct world position
    let adjustedWorldX = worldX;
    let adjustedWorldY = worldY;

    if (adjust) {
        adjustedWorldX = worldX + camera.x;
        adjustedWorldY = worldY + camera.y;
    }

    const targetChunk = GetChunkForX(adjustedWorldX);

    if (targetChunk && adjustedWorldY < CHUNK_HEIGHT * BLOCK_SIZE) {
        const localX = targetChunk.getLocalX(Math.floor(adjustedWorldX));
        const localY = Math.floor(adjustedWorldY / BLOCK_SIZE);

        return targetChunk.getBlock(localX, localY, false);
    } else {
        return null;
    }
}

function checkAdjacentBlocks(position) {
    const directions = [
        { x: 0, y: -BLOCK_SIZE }, // Above
        { x: 0, y: BLOCK_SIZE }, // Below
        { x: -BLOCK_SIZE, y: 0 }, // Left
        { x: BLOCK_SIZE, y: 0 }, // Right
    ];

    for (const dir of directions) {
        const adjacentPos = new Vector2(position.x + dir.x, position.y + dir.y);
        const block = GetBlockAtWorldPosition(
            adjacentPos.x,
            adjacentPos.y,
            false
        );

        if (!block) continue;

        const type = GetBlock(block.blockType);
        if (block && !type.fluid && block.blockType !== Blocks.Air) {
            return true; // Found an adjacent block
        }
    }

    return false; // No adjacent block found
}

function SetBlockTypeAtPosition(worldX, worldY, blockType, adjust = true) {
    const block = GetBlockAtWorldPosition(worldX, worldY, adjust);

    if (!block) return;

    block.setBlockType(blockType);
}

function GetChunkForX(worldX) {
    const chunkX =
        Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
        (CHUNK_WIDTH * BLOCK_SIZE);
    return chunks.get(chunkX);
}
