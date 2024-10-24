class Noise {
    constructor(scale, intensity, min = 0) {
        this.scale = scale / 1000;
        this.intensity = intensity;
        this.min = min;
    }

    getNoise(x, y = 0, z = 0, intensityAmplifier = 1) {
        const noiseRaw = tooloud.Perlin.noise(
            x * this.scale,
            y * this.scale,
            z * this.scale
        );

        return noiseRaw * (this.intensity * intensityAmplifier) + this.min;
    }
}
