import { runtime } from "./runtime.js";

export const RENDER_DISTANCE = 1; // In Chunks
export const ENTITY_UPDATE_DISTANCE = 50; // In Blocks
export const CHUNK_WIDTH = 16;
export const CHUNK_HEIGHT = 110; // 150
export const BLOCK_SIZE = 64; // 64
export const CAVES_THRESHOLD = 4;
export const TERRAIN_HEIGHT = 50; // 50
export const WATER_LEVEL = 10;
export const CHUNK_FILE_SIZE = 7.5; // kB
export const GRAVITY = 30 * BLOCK_SIZE;
export const INTERACT_DISTANCE = 4;
export const TICK_SPEED = 20;
// Get multiplayer bool from url
export const url = new URL(window.location.href);
export const multiplayer = url.searchParams.get("multiplayer") === "true";


export const mobSpawnDelay = { min: 10, max: 120 };

runtime.isTexturePackLoaded = false;

runtime.passedTime = 0;

export let lighting = true;

runtime.time = 1;
export const dayNightSpeed = 0.001;
runtime.day = true;

export const ORE_THRESHOLDS = {
    coal: 2.5,
    iron: 2,
    redstone: 1.5,
    diamond: 0.8,
    gold: 1.4,
    quartz: 1.5,
    glowstone: 1.5,
    lavaPockets: 1.5,
    gravel: 1.5,
    sand: 1.5,
    dirt: 1.5,
};

export const SPAWN_PLAYER = true;

runtime.globalFrame = 0;
export let updatingBlocks = []; //eg furnace

runtime.GAMERULES = {
    keepInventory: false,
    doDaylightCycle: true,
    doMobSpawning: true,
    doMobLoot: true,
    doTileDrops: true,
    doFireTick: true,
    doMobGriefing: true,
};

export const ToolType = Object.freeze({
    Nothing: 0,
    Pickaxe: 1,
    Axe: 2,
    Shovel: 3,
    Shears: 4,
    Hoe: 5,
    Sword: 6,
    Hammer: 7,
    Flame: 8,
});

runtime.server = null;
