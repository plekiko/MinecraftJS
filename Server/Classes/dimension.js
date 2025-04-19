export class Dimension {
    constructor(name) {
        this.name = name;
        this.chunks = new Map();
    }

    getChunk(x) {
        return this.chunks.get(x) || null;
    }

    uploadChunk(chunk, x) {
        this.chunks.set(x, chunk);
    }
}
