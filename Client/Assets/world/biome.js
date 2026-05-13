class Biome {
    constructor({
        name,
        heightNoise = new Noise(),
        topLayer = Blocks.GrassBlock,
        secondLayer = Blocks.Dirt,
        firstLayerWidth = 1,
        secondLayerWidth = 3,
        treeType = [Trees.Oak],
        grassType = [Blocks.Grass, Blocks.TallGrass],
        treeThreshold = 55,
        minTemp = 0,
        maxTemp = 60,
        minWet = 60,
        maxWet = 0,
        minMount = 0,
        maxMount = 60,
        waterLevel = WATER_LEVEL,
        mobs = BiomeMobs.CommonMobs,
        googlies = BiomeMobs.Googlies,
        maxMobs = 4,

        fluidType = Blocks.Water,

        baseBlock = Blocks.Stone,

        waterSandType = Blocks.Sand,

        fullChunk = false,
    } = {}) {
        this.name = name;
        this.heightNoise = heightNoise;
        this.topLayer = topLayer;
        this.secondLayer = secondLayer;
        this.firstLayerWidth = firstLayerWidth;
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
        this.waterLevel = waterLevel;
        this.mobs = mobs;
        this.googlies = googlies;
        this.maxMobs = maxMobs;

        this.baseBlock = baseBlock;

        this.fluidType = fluidType;
        this.fullChunk = fullChunk;

        this.waterSandType = waterSandType;
    }
}

const BiomeMobs = Object.freeze({
    CommonMobs: ["Pig", "Cow", "Sheep"],
    Googlies: ["Zombie", "Creeper"],
});

const OverworldBiomes = Object.freeze({
    Plains: new Biome({
        name: "Plains",
        heightNoise: NoisePresets.Flat,
        topLayer: Blocks.GrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Oak, Trees.Birch],
        grassType: [
            Blocks.Grass,
            Blocks.TallGrass,
            Blocks.FlowerDandelion,
            Blocks.FlowerTulipWhite,
        ],
        treeThreshold: 7,
        minTemp: 0.25,
        maxTemp: 0.65,
        minWet: 0.15,
        maxWet: 0.6,
        minMount: 0,
        maxMount: 0.45,
    }),
    Desert: new Biome({
        name: "Desert",
        heightNoise: NoisePresets.Flat,
        mobs: [],
        topLayer: Blocks.Sand,
        secondLayer: Blocks.SandStone,
        firstLayerWidth: 2,
        treeType: [Trees.Cactus],
        grassType: [Blocks.DeadBush],
        treeThreshold: 7.3,
        minTemp: 0.65,
        maxTemp: 1,
        minWet: 0,
        maxWet: 0.35,
        minMount: 0,
        maxMount: 0.45,
    }),
    Tundra: new Biome({
        name: "Tundra",
        heightNoise: NoisePresets.Flat,
        topLayer: Blocks.SnowedGrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Spruce],
        grassType: [],
        treeThreshold: 7,
        minTemp: 0,
        maxTemp: 0.25,
        minWet: 0,
        maxWet: 0.6,
        minMount: 0,
        maxMount: 0.5,
    }),
    Taiga: new Biome({
        name: "Taiga",
        heightNoise: NoisePresets.Flat,
        topLayer: Blocks.Podzol,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Spruce, Trees.BigSpruce],
        grassType: [Blocks.Grass, Blocks.TallGrass, Blocks.Fern],
        treeThreshold: 6.5,
        minTemp: 0.2,
        maxTemp: 0.4,
        minWet: 0.35,
        maxWet: 0.75,
        minMount: 0,
        maxMount: 0.6,
    }),
    Shrubland: new Biome({
        name: "Shrubland",
        heightNoise: NoisePresets.SmallHills,
        topLayer: Blocks.GrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Oak, Trees.Birch],
        grassType: [Blocks.Grass, Blocks.TallGrass],
        treeThreshold: 7,
        minTemp: 0.45,
        maxTemp: 0.85,
        minWet: 0.1,
        maxWet: 0.4,
        minMount: 0,
        maxMount: 0.45,
    }),
    Savanna: new Biome({
        name: "Savanna",
        heightNoise: NoisePresets.Flat,
        topLayer: Blocks.GrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Acacia],
        grassType: [Blocks.Grass, Blocks.TallGrass, Blocks.DeadBush],
        treeThreshold: 7,
        minTemp: 0.55,
        maxTemp: 0.85,
        minWet: 0.2,
        maxWet: 0.5,
        minMount: 0,
        maxMount: 0.45,
    }),
    Forest: new Biome({
        name: "Forest",
        heightNoise: NoisePresets.SmallHills,
        topLayer: Blocks.GrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Oak, Trees.Oak, Trees.Birch],
        grassType: [
            Blocks.Grass,
            Blocks.TallGrass,
            Blocks.Grass,
            Blocks.TallGrass,
            Blocks.Grass,
            Blocks.TallGrass,
            Blocks.FlowerRose,
            Blocks.FlowerBlueOrchid,
            Blocks.FlowerDaisy,
            Blocks.FlowerRose,
        ],
        treeThreshold: 6,
        minTemp: 0.3,
        maxTemp: 0.55,
        minWet: 0.45,
        maxWet: 0.75,
        minMount: 0,
        maxMount: 0.45,
    }),
    SeasonalForest: new Biome({
        name: "Seasonal Forest",
        heightNoise: NoisePresets.SmallHills,
        topLayer: Blocks.GrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Oak],
        grassType: [
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
            Blocks.FlowerSyringa,
            Blocks.FlowerRose,
        ],
        treeThreshold: 6.5,
        minTemp: 0.5,
        maxTemp: 0.75,
        minWet: 0.35,
        maxWet: 0.65,
        minMount: 0,
        maxMount: 0.45,
    }),
    Swamp: new Biome({
        name: "Swamp",
        heightNoise: NoisePresets.Flat,
        topLayer: Blocks.GrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Oak],
        grassType: [Blocks.Grass, Blocks.TallGrass],
        treeThreshold: 7,
        minTemp: 0.3,
        maxTemp: 0.7,
        minWet: 0.75,
        maxWet: 1,
        minMount: 0,
        maxMount: 0.35,
        waterLevel: 12,
    }),
    RainForest: new Biome({
        name: "Rain Forest",
        heightNoise: NoisePresets.LowHills,
        topLayer: Blocks.GrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.BigJungle, Trees.Jungle],
        grassType: [Blocks.Grass, Blocks.TallGrass],
        treeThreshold: 7,
        minTemp: 0.65,
        maxTemp: 0.95,
        minWet: 0.8,
        maxWet: 1,
        minMount: 0,
        maxMount: 0.5,
    }),
    Mountain: new Biome({
        name: "Mountain",
        heightNoise: NoisePresets.Mountains,
        topLayer: Blocks.Stone,
        secondLayer: Blocks.Stone,
        treeType: [],
        grassType: [Blocks.Grass, Blocks.TallGrass],
        treeThreshold: 6,
        minTemp: 0,
        maxTemp: 1,
        minWet: 0,
        maxWet: 1,
        minMount: 0.9,
        maxMount: 1,
    }),
    CherryBlossom: new Biome({
        name: "Cherry Blossom",
        heightNoise: NoisePresets.SmallHills,
        topLayer: Blocks.GrassBlock,
        secondLayer: Blocks.Dirt,
        treeType: [Trees.Cherry],
        grassType: [
            Blocks.Grass,
            Blocks.FlowerTulipPink,
            Blocks.FlowerSyringa,
            Blocks.FlowerPeony,
        ],
        treeThreshold: 7,
        minTemp: 0.3,
        maxTemp: 0.5,
        minWet: 0.3,
        maxWet: 0.8,
        minMount: 0.2,
        maxMount: 0.45,
    }),
});

const NetherBiomes = Object.freeze({
    NetherWastes: new Biome({
        name: "Nether Wastes",
        topLayer: Blocks.Netherrack,
        secondLayer: Blocks.Netherrack,
        firstLayerWidth: 3,
        secondLayerWidth: 5,
        treeType: [],
        grassType: [],
        treeThreshold: Infinity,
        minTemp: 0,
        maxTemp: 1,
        minWet: 0,
        maxWet: 1,
        minMount: 0,
        maxMount: 1,
        waterLevel: 5,
        mobs: [],
        googlies: [],
        maxMobs: 4,

        baseBlock: Blocks.Netherrack,
        fullChunk: true,

        fluidType: Blocks.Lava,

        waterSandType: Blocks.SoulSand,
    }),
});

const AllBiomes = Object.freeze({
    ...OverworldBiomes,
    ...NetherBiomes,
});
