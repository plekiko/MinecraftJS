const RENDER_DISTANCE = 2; // In Chunks
const ENTITY_UPDATE_DISTANCE = 50; // In Blocks
const CHUNK_WIDTH = 16;
const CHUNK_HEIGHT = 110; // 150
const BLOCK_SIZE = 16; // 64
const CAVES_THRESHOLD = 4;
const TERRAIN_HEIGHT = 30; // 50
const WATER_LEVEL = 25;
const CHUNK_FILE_SIZE = 7.5; // kB
const GRAVITY = 30 * BLOCK_SIZE;
const INTERACT_DISTANCE = 4;
const TICK_SPEED = 20;
// Get multiplayer bool from url
const url = new URL(window.location.href);
const multiplayer = url.searchParams.get("multiplayer") === "true";

let deltaTime;

const mobSpawnDelay = { min: 10, max: 120 };

let passedTime = 0;

let lighting = true;

let time = 1;
const dayNightSpeed = 0.009;
let day = true;

const ORE_THRESHOLDS = {
    coal: 2.5,
    iron: 2,
    redstone: 1.5,
    diamond: 0.8,
    gold: 1.4,
    quartz: 1.5,
    glowstone: 1.5,
};

const SPAWN_PLAYER = false;

let globalFrame = 0;
let updatingBlocks = []; //eg furnace

let chat = null;

let GAMERULES = {
    keepInventory: false,
    doDaylightCycle: true,
    doMobSpawning: true,
    doMobLoot: true,
    doTileDrops: true,
    doFireTick: true,
};

const ToolType = Object.freeze({
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

let server = null;
