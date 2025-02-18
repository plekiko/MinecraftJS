class Structure {
    constructor({
        blocks = [[]],
        walls = null,
        biome = null,
        underground = false,
    }) {
        this.blocks = blocks;
        this.walls = walls;
        this.biome = biome;
        this.underground = underground;
    }
}
