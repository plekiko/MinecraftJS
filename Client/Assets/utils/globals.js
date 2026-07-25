import { runtime } from "./runtime.js";

export {
    RENDER_DISTANCE,
    ENTITY_UPDATE_DISTANCE,
    CHUNK_WIDTH,
    CHUNK_HEIGHT,
    BLOCK_SIZE,
    CAVES_THRESHOLD,
    TERRAIN_HEIGHT,
    WATER_LEVEL,
    CHUNK_FILE_SIZE,
    GRAVITY,
    INTERACT_DISTANCE,
    TICK_SPEED,
    mobSpawnDelay,
    dayNightSpeed,
    ORE_THRESHOLDS,
    SPAWN_PLAYER,
    ToolType,
} from "@minecraftjs/shared/constants.js";

// Get multiplayer bool from url
export const url = new URL(window.location.href);
export const multiplayer = url.searchParams.get("multiplayer") === "true";

export let lighting = true;
export let updatingBlocks = []; //eg furnace

// runtime defaults live in runtime.js — do not reset them here.
// Shared/ no longer imports this module early; re-running these assignments
// after initializeTextures() would clear isTexturePackLoaded and hang boot.
if (runtime.GAMERULES == null) {
    runtime.GAMERULES = {
        keepInventory: false,
        doDaylightCycle: true,
        doMobSpawning: true,
        doMobLoot: true,
        doTileDrops: true,
        doFireTick: true,
        doMobGriefing: true,
    };
}
