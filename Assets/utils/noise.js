class Noise {
    constructor(scale = 100, intensity = 1, min = 0) {
        this.scale = scale / 1000;
        this.intensity = intensity;
        this.min = min;
    }

    getNoise(x, y = 0) {
        // Tooloud is used to generate noise based on scaled inputs
        const noiseRaw = tooloud.Perlin.noise(
            x * this.scale,
            y * this.scale,
            0
        );

        // Ensure noise is within range and apply intensity and min adjustments
        return noiseRaw * this.intensity + this.min;
    }
}

const NoisePresets = Object.freeze({
    Flat: new Noise(100, 5, TERRAIN_HEIGHT),
    SmallHills: new Noise(100, 10, TERRAIN_HEIGHT),
});
