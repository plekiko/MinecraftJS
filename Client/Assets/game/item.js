import { ToolType } from "../utils/globals.js";

export class Item {
    constructor({
        itemId = 0,
        name = "New Item",
        sprite = "",
        stackSize = 64,
        toolType = ToolType.Nothing,
        toolLevel = 0,
        heldInHand = false,
        fuelTime = null,
        smeltOutput = null,
        baseDamage = 0,
        foodValue = 0,
        foodSaturation = 0,
        playMusicInJukebox = null,
        projectile = null,
        throwPower = 0,
        excludeFromCreativeInventory = false,
        durability = null,

        placeBlock = null,
    }) {
        this.itemId = itemId;
        this.name = name;
        this.sprite = sprite;

        this.toolType = toolType;
        this.toolLevel = toolLevel;
        this.durability = durability;

        this.foodValue = foodValue;
        this.foodSaturation = foodSaturation;

        this.baseDamage = baseDamage;

        this.stackSize = stackSize;

        this.playMusicInJukebox = playMusicInJukebox;

        this.projectile = projectile;
        this.throwPower = throwPower;

        this.fuelTime = fuelTime;
        this.smeltOutput = smeltOutput;

        this.heldInHand = heldInHand;

        this.excludeFromCreativeInventory = excludeFromCreativeInventory;

        this.placeBlock = placeBlock;
    }
}

let itemMapRef = null;

export function bindItemMap(map) {
    itemMapRef = map;
}

export function getItem(itemId) {
    return itemMapRef?.has(itemId) ? itemMapRef.get(itemId) : null;
}
