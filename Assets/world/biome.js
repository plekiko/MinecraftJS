class Biome {
    constructor(
        name,
        heightNoise = new Noise(),
        topLayer = Blocks.GrassBlock,
        secondLayer = Blocks.Dirt,
        secondLayerWidth,
        treeType = [Trees.Oak],
        grassType = [Blocks.Grass, Blocks.TallGrass],
        treeThreshold = 55,
        minTemp = 0,
        maxTemp = 60,
        minWet = 60,
        maxWet = 0,
        minMount = 0,
        maxMount = 60
    ) {
        this.name = name;
        this.heightNoise = heightNoise;
        this.topLayer = topLayer;
        this.secondLayer = secondLayer;
        this.secondLayerWidth = secondLayerWidth;
        this.treeType = treeType;
        this.grassType = grassType;
        this.treeThreshold = treeThreshold;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.minWet = minWet;
        this.maxWet = maxWet;
        this.minMount = minMount;
        this.maxMount = maxMount;
    }
}

const Biomes = Object.freeze({
    Planes: new Biome(
        "Planes", // Name
        NoisePresets.Flat, // Terrain
        Blocks.GrassBlock, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Oak, Trees.Birch], // Tree types
        [Blocks.Grass, Blocks.TallGrass], // Grass types
        7, // Tree threshold
        10, // Minimum temperature
        25, // Maximum temperature
        0, // Minimum wetness
        10, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    Desert: new Biome(
        "Desert", // Name
        NoisePresets.SmallHills, // Terrain
        Blocks.Sand, // Top layer
        Blocks.SandStone, // Second layer
        4, // Second layer width
        [Trees.Cactus], // Tree type
        [Blocks.DeadBush], // Grass types
        6, // Tree threshold
        25, // Minimum temperature
        999, // Maximum temperature
        0, // Minimum wetness
        10, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    Tundra: new Biome(
        "Tundra", // Name
        NoisePresets.Flat, // Terrain
        Blocks.SnowedGrassBlock, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Spruce], // Tree type
        [], // Grass types
        8, // Tree threshold
        -999, // Minimum temperature
        10, // Maximum temperature
        0, // Minimum wetness
        999, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    Taiga: new Biome(
        "Taiga", // Name
        NoisePresets.Flat, // Terrain
        Blocks.Podzol, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Spruce, Trees.BigSpruce], // Tree type
        [Blocks.Grass, Blocks.TallGrass, Blocks.Fern], // Grass types
        6.5, // Tree threshold
        10, // Minimum temperature
        20, // Maximum temperature
        10, // Minimum wetness
        30, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    Shrubland: new Biome(
        "Shrubland", // Name
        NoisePresets.SmallHills, // Terrain
        Blocks.GrassBlock, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Oak, Trees.Birch], // Tree types
        [Blocks.Grass, Blocks.TallGrass], // Grass types
        7, // Tree threshold
        20, // Minimum temperature
        30, // Maximum temperature
        10, // Minimum wetness
        20, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    Savanna: new Biome(
        "Savanna", // Name
        NoisePresets.Flat, // Terrain
        Blocks.GrassBlock, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Acacia], // Tree types
        [Blocks.Grass, Blocks.TallGrass], // Grass types
        7, // Tree threshold
        30, // Minimum temperature
        999, // Maximum temperature
        10, // Minimum wetness
        20, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    Forest: new Biome(
        "Forest", // Name
        NoisePresets.SmallHills, // Terrain
        Blocks.GrassBlock, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Oak], // Tree types
        [
            Blocks.Grass,
            Blocks.TallGrass,
            Blocks.Grass,
            Blocks.TallGrass,
            Blocks.Grass,
            Blocks.TallGrass,
            Blocks.FlowerRose,
            Blocks.FlowerBlueOrchid,
        ], // Grass types
        6, // Tree threshold
        20, // Minimum temperature
        30, // Maximum temperature
        20, // Minimum wetness
        30, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    SeasonalForest: new Biome(
        "Seasonal Forest", // Name
        NoisePresets.SmallHills, // Terrain
        Blocks.GrassBlock, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Oak], // Tree types
        [
            Blocks.Grass,
            Blocks.TallGrass,
            Blocks.FlowerAllium,
            Blocks.FlowerBlueOrchid,
            Blocks.FlowerDaisy,
            Blocks.FlowerDandelion,
            Blocks.FlowerRose,
            Blocks.FlowerTulipOrange,
            Blocks.FlowerTulipPink,
            Blocks.FlowerTulipRed,
            Blocks.FlowerTulipWhite,
        ], // Grass types
        6.5, // Tree threshold
        30, // Minimum temperature
        999, // Maximum temperature
        20, // Minimum wetness
        30, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    Swamp: new Biome(
        "Swamp", // Name
        NoisePresets.Flat, // Terrain
        Blocks.GrassBlock, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Oak], // Tree types
        [Blocks.Grass, Blocks.TallGrass], // Grass types
        8, // Tree threshold
        10, // Minimum temperature
        30, // Maximum temperature
        30, // Minimum wetness
        999, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    RainForest: new Biome(
        "Rain Forest", // Name
        NoisePresets.SmallHills, // Terrain
        Blocks.GrassBlock, // Top layer
        Blocks.Dirt, // Second layer
        4, // Second layer width
        [Trees.Oak], // Tree types
        [Blocks.Grass, Blocks.TallGrass], // Grass types
        6, // Tree threshold
        30, // Minimum temperature
        999, // Maximum temperature
        30, // Minimum wetness
        999, // Maximum wetness
        0, // Min Mountain
        50 // Max Mountain
    ),
    Mountain: new Biome(
        "Mountain", // Name
        NoisePresets.Mountains, // Terrain
        Blocks.Stone, // Top layer
        Blocks.Stone, // Second layer
        4, // Second layer width
        [], // Tree types
        [Blocks.Grass, Blocks.TallGrass], // Grass types
        6, // Tree threshold
        0, // Minimum temperature
        999, // Maximum temperature
        0, // Minimum wetness
        999, // Maximum wetness
        50, // Min Mountain
        999 // Max Mountain
    ),
});
