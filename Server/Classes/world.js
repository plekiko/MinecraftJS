import { Dimension } from "./dimension.js";
import { RandomRange } from "./helper.js";

export class World {
    constructor() {
        this.seed = Math.floor(RandomRange(-1000000, 1000000));
        this.dimensions = [
            new Dimension("Overworld"),
            new Dimension("Nether"),
            new Dimension("Eather"),
        ];
    }

    getDimension(index) {
        if (index < 0 || index >= this.dimensions.length) {
            return null;
        }
        return this.dimensions[index];
    }
}
