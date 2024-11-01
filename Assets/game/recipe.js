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
