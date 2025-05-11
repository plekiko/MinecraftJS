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

    loadWorld(world) {
        if (world == null) {
            return false;
        }

        this.seed = world.seed;
        this.dimensions = [];
        for (let i = 0; i < world.dimensions.length; i++) {
            if (world.dimensions[i].name == null) return false;
            if (world.dimensions[i].chunks == null) return false;

            const chunks = new Map();

            for (let j = 0; j < world.dimensions[i].chunks.length; j++) {
                if (world.dimensions[i].chunks[j].x == null) return false;
                if (world.dimensions[i].chunks[j].chunk == null) return false;

                chunks.set(
                    world.dimensions[i].chunks[j].x,
                    world.dimensions[i].chunks[j].chunk
                );
            }

            this.dimensions.push(
                new Dimension(world.dimensions[i].name, chunks)
            );
        }

        return true;
    }

    saveWorld() {
        let world = {
            seed: this.seed,
            dimensions: [],
        };
        for (let i = 0; i < this.dimensions.length; i++) {
            const chunks = this.dimensions[i].getChunksForSaving();

            world.dimensions.push({
                name: this.dimensions[i].name,
                chunks: chunks,
            });
        }
        return world;
    }
}
