class Structure {
    constructor({
        blocks = [[]],
        walls = null,
        biome = null,
        underground = false,
        shift = { x: 0, y: 1 },
        dimension = Dimensions.Overworld,
    }) {
        this.blocks = blocks;
        this.walls = walls;
        this.biome = biome;
        this.underground = underground;
        this.shift = shift;
        this.dimension = dimension;
    }
}
