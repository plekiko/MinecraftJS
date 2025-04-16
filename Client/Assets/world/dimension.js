const Dimensions = Object.freeze({
    Overworld: 0,
    Nether: 1,
    End: 2,
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
            tree: new Noise(100, 10, 5),
            cave: new Noise(55, 10, 5),
            mountains: new Noise(30, 60, 30),
            coal: new Noise(100, 5.3, 5),
            iron: new Noise(100, 5, 5),
            diamond: new Noise(100, 6.8, 5),
            redstone: new Noise(100, 6.5, 5),
            gold: new Noise(100, 6.5, 5),
        },

        alwaysDay = false,
    }) {
        this.name = name;
        this.chunks = new Map();
        this.biomeSet = biomeSet;

        this.backgroundGradient = backgroundGradient;

        this.noiseMaps = noiseMaps;

        this.alwaysDay = alwaysDay;
    }
}

let dimensions = [
    new Dimension({ name: "Overworld", biomeSet: OverworldBiomes }),
    new Dimension({
        name: "Nether",
        biomeSet: NetherBiomes,
        backgroundGradient: {
            dayColor: "#FF7F00", // Daytime top color (orange)
            nightColor: "#000000", // Nighttime top color (black)
            sunsetColor: "#FF4500", // Sunset bottom color (red)
            midnightColor: "#000000", // Midnight bottom color (black)
        },
        alwaysDay: true,
    }),
];

function getDimension(index) {
    return dimensions[index];
}

function getDimensionChunks(index) {
    return dimensions[index].chunks;
}
