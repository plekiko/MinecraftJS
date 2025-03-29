export class World {
    constructor() {
        this.chunks = new Map();
    }

    getChunk(x) {
        return this.chunks.get(x) || null;
    }

    uploadChunk(chunk) {
        this.chunks.set(chunk.x, chunk);
    }
}
