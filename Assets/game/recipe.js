class Recipe {
    constructor({ type, output, input }) {
        this.type = type;
        this.output = output;
        this.input = input;
    }
}

const RecipeType = Object.freeze({
    Shapeless: 0,
    Shaped: 1,
});

class RecipeItem {
    constructor({
        blockId = null,
        itemId = null,
        blockCategory = null,
        count = 1,
    } = {}) {
        this.blockId = blockId;
        this.itemId = itemId;
        this.blockCategory = blockCategory;

        this.count = count;
    }
}
