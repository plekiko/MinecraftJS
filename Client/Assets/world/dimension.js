const Dimensions = Object.freeze({
    Overworld: 0,
    Nether: 1,
});

let activeDimension = Dimensions.Overworld;

class Dimension {
    constructor({
        name,
        biomeSet,
        backgroundGradient = {
            dayColor: "#74B3FF", // Daytime top color (light blue)
            nightColor: "#000000", // Nighttime top color (dark blue)
            sunsetColor: "#D47147", // Sunset bottom color
            midnightColor: "#001848", // Midnight bottom color
        },
        noiseMaps = {
            grass: new Noise(550, 0.2, 1),
            structure: new Noise(500, 1, 10),
            temperature: new Noise(30, 70, 32),
            wetness: new Noise(30, 40, 21),
            tree: new Noise(50, 10, 5),
            cave: new Noise(55, 10, 5),
            mountains: new Noise(30, 60, 30),
            ores: {},
        },

        baseLightLevel = null,
        alwaysDay = false,

        bedrockRoof = false,
        fastLava = false,
        noWater = false,
    }) {
        this.name = name;

        this.chunks = new Map();
        this.pendingBlocks = new Map();

        this.biomeSet = biomeSet;

        this.backgroundGradient = backgroundGradient;

        this.noiseMaps = noiseMaps;

        this.alwaysDay = alwaysDay;

        this.baseLightLevel = baseLightLevel;
        this.bedrockRoof = bedrockRoof;

        this.fastLava = fastLava;
        this.noWater = noWater;
    }
}

let dimensions = [
    new Dimension({
        name: "Overworld",
        biomeSet: OverworldBiomes,
        noiseMaps: {
            grass: new Noise(550, 0.2, 1),
            structure: new Noise(500, 1, 10),
            temperature: new Noise(30, 70, 32),
            wetness: new Noise(30, 40, 21),
            tree: new Noise(50, 10, 5),
            cave: new Noise(55, 10, 5),
            mountains: new Noise(30, 60, 30),
            ores: {
                coal: {
                    block: Blocks.CoalOre,
                    noise: new Noise(100, 5.3, 5),
                    thresshold: ORE_THRESHOLDS.coal,
                },
                iron: {
                    block: Blocks.IronOre,
                    noise: new Noise(100, 5, 5),
                    thresshold: ORE_THRESHOLDS.iron,
                },
                diamond: {
                    block: Blocks.DiamondOre,
                    noise: new Noise(100, 6.8, 5),
                    thresshold: ORE_THRESHOLDS.diamond,
                    depth: 25,
                },
                redstone: {
                    block: Blocks.RedstoneOre,
                    noise: new Noise(100, 6.5, 5),
                    thresshold: ORE_THRESHOLDS.redstone,
                    depth: 30,
                },
                gold: {
                    block: Blocks.GoldOre,
                    noise: new Noise(100, 6.5, 5),
                    thresshold: ORE_THRESHOLDS.gold,
                    depth: 25,
                },
                gravel: {
                    block: Blocks.Gravel,
                    noise: new Noise(100, 5.5, 5),
                    thresshold: ORE_THRESHOLDS.coal,
                },
                sand: {
                    block: Blocks.Sand,
                    noise: new Noise(100, 6, 5),
                    thresshold: ORE_THRESHOLDS.sand,
                },
                dirt: {
                    block: Blocks.Dirt,
                    noise: new Noise(100, 6, 5),
                    thresshold: ORE_THRESHOLDS.dirt,
                },
            },
        },
    }),
    new Dimension({
        name: "Nether",
        biomeSet: NetherBiomes,
        backgroundGradient: {
            dayColor: "#FF7F00",
            nightColor: "#000000",
            sunsetColor: "#FF4500",
            midnightColor: "#000000",
        },
        alwaysDay: true,
        noiseMaps: {
            grass: new Noise(550, 0.2, 1),
            structure: new Noise(500, 1, 10),
            temperature: new Noise(30, 70, 32),
            wetness: new Noise(30, 40, 21),
            tree: new Noise(100, 10, 5),
            mountains: new Noise(30, 60, 30),
            cave: new Noise(20, 80, 5),
            ores: {
                quartz: {
                    block: Blocks.QuartzOre,
                    noise: new Noise(100, 7, 5),
                    thresshold: ORE_THRESHOLDS.quartz,
                },
                glowstone: {
                    block: Blocks.Glowstone,
                    noise: new Noise(100, 7, 5),
                    thresshold: ORE_THRESHOLDS.glowstone,
                },
                lavaPockets: {
                    block: Blocks.Lava,
                    noise: new Noise(100, 7, 5),
                    thresshold: ORE_THRESHOLDS.lavaPockets,
                },
            },
        },
        baseLightLevel: 3,
        bedrockRoof: true,
        fastLava: true,
        noWater: true,
    }),
];

function gotoDimension(dimension) {
    if (dimension === activeDimension) return;

    player.dimension = dimension;

    if (multiplayer) {
        server.send({
            type: "playerDimension",
            message: {
                player: player.UUID,
                dimension: dimension,
            },
        });
    }

    chunks_in_render_distance = new Map();

    entities = entities.filter((entity) => {
        if (entity instanceof Player) {
            return true;
        }
        return false;
    });

    activeDimension = dimension;
}

function getDimension(index = activeDimension) {
    return dimensions[index];
}

function getDimensionChunks(index = activeDimension) {
    return dimensions[index].chunks;
}
