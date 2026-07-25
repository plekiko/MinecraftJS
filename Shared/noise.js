import tooloud from "./tooloud.js";
import { TERRAIN_HEIGHT } from "./constants.js";

export class Noise {
    constructor(scale = 100, intensity = 1, min = 0) {
        this.scale = scale / 1000;
        this.intensity = intensity;
        this.min = min;
    }

    getNoise(x, y = 0, multiplier = 1) {
        const noiseRaw = tooloud.Perlin.noise(
            x * this.scale * multiplier,
            y * this.scale * multiplier,
            0,
        );

        return noiseRaw * this.intensity + this.min;
    }
}

export const NoisePresets = Object.freeze({
    Flat: new Noise(7, 10, TERRAIN_HEIGHT),
    SmallHills: new Noise(5, 35, TERRAIN_HEIGHT),
    Mountains: new Noise(1.5, 160, TERRAIN_HEIGHT + 18),
    LowHills: new Noise(5, 35, TERRAIN_HEIGHT - 2),
});
