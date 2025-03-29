import { RandomRange } from "./helper.js";

export class World {
    constructor() {
        this.seed = Math.floor(RandomRange(-1000000, 1000000));
        this.chunks = new Map();
    }

    getChunk(x) {
        return this.chunks.get(x) || null;
    }

    uploadChunk(chunk) {
        this.chunks.set(chunk.x, chunk);
    }
}
