const RENDER_DISTANCE = 1; // In Chunks
const ENTITY_UPDATE_DISTANCE = 50; // In Blocks
const CHUNK_WIDTH = 16;
const CHUNK_HEIGHT = 110; // 150
const BLOCK_SIZE = 64; // 64
const CAVES_THRESHOLD = 4;
const TERRAIN_HEIGHT = 30; // 50
const WATER_LEVEL = 25;
const CHUNK_FILE_SIZE = 7.5; // kB
const GRAVITY = 30 * BLOCK_SIZE;
const INTERACT_DISTANCE = 4;
const TICK_SPEED = 20;

let deltaTime;

const mobSpawnDelay = { min: 10, max: 120 };

let passedTime = 0;

let lighting = true;

let time = 1;
const dayNightSpeed = 0.09;
let day = true;

const ORE_THRESHOLDS = {
    coal: 2.5,
    iron: 2,
    redstone: 1.5,
    diamond: 0.8,
    gold: 1.4,
};

const SPAWN_PLAYER = true;

let globalFrame = 0;
let updatingBlocks = []; //eg furnace

let chat = null;

const ToolType = Object.freeze({
    Nothing: 0,
    Pickaxe: 1,
    Axe: 2,
    Shovel: 3,
    Shears: 4,
    Hoe: 5,
    Sword: 6,
    Hammer: 7,
});
