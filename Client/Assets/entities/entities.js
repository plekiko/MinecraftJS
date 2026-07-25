import { entityRegistry } from "./entityRegistry.js";
import { FallingBlock } from "./fallingBlock.js";
import { Cow } from "./mobs/cow.js";
import { Creeper } from "./mobs/creeper.js";
import { Pig } from "./mobs/pig.js";
import { Sheep } from "./mobs/sheep.js";
import { WitherSkeleton } from "./mobs/wither_skeleton.js";
import { Zombie } from "./mobs/zombie.js";
import { Snowball } from "./projectiles/snowBall.js";

export const Entities = Object.freeze({
    Pig: Pig,
    Cow: Cow,
    Zombie: Zombie,
    Creeper: Creeper,
    Sand: FallingBlock,
    Snowball: Snowball,
    Sheep: Sheep,
    WitherSkeleton: WitherSkeleton,
});
entityRegistry.Entities = Entities;
