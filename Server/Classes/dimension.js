export class Dimension {
    constructor(name, chunks = new Map()) {
        this.name = name;
        this.chunks = chunks;
    }

    getChunk(x) {
        return this.chunks.get(x) || null;
    }

    uploadChunk(chunk, x) {
        this.chunks.set(x, chunk);
    }

    getChunksForSaving() {
        const chunks = [];
        this.chunks.forEach((chunk, x) => {
            chunks.push({ x: x, chunk: chunk });
        });
        return chunks;
    }
}
