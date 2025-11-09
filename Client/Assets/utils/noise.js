class Noise {
    constructor(scale = 100, intensity = 1, min = 0) {
        this.scale = scale / 1000;
        this.intensity = intensity;
        this.min = min;
    }

    getNoise(x, y = 0, multiplier = 1) {
        // Tooloud is used to generate noise based on scaled inputs
        const noiseRaw = tooloud.Perlin.noise(
            x * this.scale * multiplier,
            y * this.scale * multiplier,
            0
        );

        // Ensure noise is within range and apply intensity and min adjustments
        return noiseRaw * this.intensity + this.min;
    }
}

const NoisePresets = Object.freeze({
    Flat: new Noise(7, 10, TERRAIN_HEIGHT),
    SmallHills: new Noise(5, 35, TERRAIN_HEIGHT),
    Mountains: new Noise(1.5, 120, TERRAIN_HEIGHT + 8),
    LowHills: new Noise(5, 35, TERRAIN_HEIGHT - 2),
});
