import { Sounds } from "./sounds.js";
import { ToolType } from "./constants.js";

export class BlockType {
    constructor({
        blockId,
        sprite = null,
        wallSprite = null,
        iconSprite = null,
        states = [],
        name = "New block",
        hardness = -2,
        grassOffset = false,
        blockOffset = { x: 0, y: 0 },
        animationSpeed = 0.2,
        fluid = false,
        drag = 40,
        collision = true,

        excludeFromCreativeInventory = false,

        stackSize = 64,

        hoeAble = false,

        climable = false,

        defaultCutoff = 0,

        noPriority = false,

        transparent = false,

        changeToBlockWithBlockAbove = null,

        changeToBlockWhenBroken = null,

        fire = false,

        cannotBeConverted = false,

        extendedBlock = null,

        saplingOutcome = null,

        extinguishEntity = false,

        air = false,

        chunkProtection = false,

        spawnerType = null,

        updateSpeed = 0,
        chunkUpdate = false,

        breakSound = Sounds.Break_Wood,
        breakingSound = Sounds.Breaking_Wood,

        toolType = ToolType.Nothing,
        requiredToolLevel = 0,
        dropWithoutTool = true,
        breakByFluid = false,
        category = null,

        fall = false,

        ambientSound = null,

        dropBlock = blockId,
        dropItem = null,

        breakWithoutBlockUnderneath = false,
        onlyPlacableOn = null,

        lightLevel = 0,
        sunLight = false,

        dropTable = null,

        noteBlockSound = "harp",

        fuelTime = null,
        smeltOutput = null,

        baseRedstoneOutput = 0,

        specialType = null,

        cropOutcome = null,
        cropSpeed = 20, // 20 ticks per second

        canBePlacedOnWall = false,
        canBePlacedOnSelf = false,
    } = {}) {
        this.blockId = blockId;
        this.sprite = sprite;
        this.wallSprite = wallSprite;
        this.iconSprite = iconSprite ? iconSprite : sprite;
        this.states = states;
        this.name = name;
        this.hardness = hardness;
        this.grassOffset = grassOffset;
        this.blockOffset = blockOffset;
        this.animationSpeed = animationSpeed;
        this.fluid = fluid;
        this.drag = drag;
        this.collision = collision;
        this.breakSound = breakSound;
        this.breakingSound = breakingSound;

        this.extendedBlock = extendedBlock;

        this.stackSize = stackSize;

        this.changeToBlockWithBlockAbove = changeToBlockWithBlockAbove;

        this.spawnerType = spawnerType;

        this.hoeAble = hoeAble;

        this.changeToBlockWhenBroken = changeToBlockWhenBroken;

        this.noPriority = noPriority;

        this.climable = climable;

        this.excludeFromCreativeInventory = excludeFromCreativeInventory;

        this.fire = fire;
        this.extinguishEntity = extinguishEntity;

        this.defaultCutoff = defaultCutoff;

        this.cannotBeConverted = cannotBeConverted;

        this.noteBlockSound = noteBlockSound;

        this.air = air;

        this.lightLevel = lightLevel;
        this.sunLight = sunLight;

        this.baseRedstoneOutput = baseRedstoneOutput;

        this.transparent = transparent;

        this.chunkProtection = chunkProtection;

        this.updateSpeed = updateSpeed;
        this.chunkUpdate = chunkUpdate;

        this.fall = fall;

        this.ambientSound = ambientSound;

        this.breakWithoutBlockUnderneath = breakWithoutBlockUnderneath;
        this.onlyPlacableOn = onlyPlacableOn;

        this.toolType = toolType;
        this.dropWithoutTool = dropWithoutTool;
        this.requiredToolLevel = requiredToolLevel;
        this.breakByFluid = breakByFluid;
        this.category = category;

        this.dropBlock = dropBlock;
        this.dropItem = dropItem;
        this.dropTable = dropTable;

        this.fuelTime = fuelTime;
        this.smeltOutput = smeltOutput;

        this.specialType = specialType;

        this.saplingOutcome = saplingOutcome;

        this.cropOutcome = cropOutcome;
        this.cropSpeed = cropSpeed;

        this.canBePlacedOnWall = canBePlacedOnWall;
        this.canBePlacedOnSelf = canBePlacedOnSelf;
    }
}

export const SpecialType = Object.freeze({
    CraftingTable: 1,
    Furnace: 2,
    SingleChest: 3,
    Jukebox: 4,
    Converter: 5,
    NoteBlock: 6,
    RedstoneDust: 7,
    RedstoneLamp: 8,
    PressurePlate: 9,
    Hopper: 10,
    Lever: 11,
    TNT: 12,
    NetherPortal: 13,
    Sign: 14,
});

export const BlockCategory = Object.freeze({
    Logs: 1,
    Planks: 2,
    Wool: 3,
});
