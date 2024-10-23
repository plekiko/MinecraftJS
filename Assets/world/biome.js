class Biome {
    constructor(name, heightNoise = new Noise(), topLayer = Blocks.GrassBlock, secondLayer = Blocks.Dirt, secondLayerWidth, treeType = [Trees.Oak], treeThreshold = 55, minTemp = 0, maxTemp = 100, secondPass = null) {
        this.name = name;
        this.heightNoise = heightNoise;
        this.topLayer = topLayer;
        this.secondLayer = secondLayer;
        this.secondLayerWidth = secondLayerWidth;
        this.treeType = treeType;
        this.treeThreshold = treeThreshold;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.secondPass = secondPass;
    }
}

const Biomes = Object.freeze({
    Planes: new Biome(
        "Planes",
        new Noise(
            4,
            4,
            30
        ),
        Blocks.GrassBlock,
        Blocks.Dirt,
        4,
        [Trees.Oak, Trees.Birch],
        7,
        999,
        99
    ),
    Desert: new Biome(
        "Desert",
        new Noise(
            4,
            8,
            30
        ),
        Blocks.Sand,
        Blocks.SandStone,
        4,
        [Trees.Cactus],
        6,
        30,
        999,
        new Noise(
            4,
            5,
            30
        ),
    ),
    Tundra: new Biome(
        "Tundra",
        new Noise(
            4,
            5,
            30
        ),
        Blocks.SnowedGrassBlock,
        Blocks.Dirt,
        4,
        [Trees.Spruce],
        7,
        -999,
        15
    ),
});