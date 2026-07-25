/**
 * Dimension ids/state without Blocks/biome imports.
 * Keeps block.js out of the blocks.js init cycle.
 */
export { Dimensions } from "@minecraftjs/shared/dimensions.js";
import { Dimensions } from "@minecraftjs/shared/dimensions.js";

export let activeDimension = Dimensions.Overworld;

/** Filled by dimension.js after Dimension instances are constructed. */
export let dimensions = [];

export function setActiveDimension(dimension) {
    activeDimension = dimension;
}

export function setDimensions(next) {
    dimensions = next;
}

export function getDimension(index = activeDimension) {
    return dimensions[index];
}

export function getDimensionChunks(index = activeDimension) {
    return dimensions[index].chunks;
}
