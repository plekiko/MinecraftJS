const Items = Object.freeze({
    Stick: 0,

    WoodAxe: 1,
    WoodPickaxe: 2,
    WoodShovel: 3,
    WoodHoe: 4,
    WoodSword: 5,

    StoneAxe: 6,
    StonePickaxe: 7,
    StoneShovel: 8,
    StoneHoe: 9,
    StoneSword: 10,

    Shears: 11,
    IronAxe: 12,
    IronPickaxe: 13,
    IronShovel: 14,
    IronHoe: 15,
    IronSword: 16,

    Coal: 20,
    IronIngot: 21,
    Charcoal: 22,

    RawBeef: 30,
    CookedBeef: 31,
    RawPorkchop: 32,
    CookedPorkchop: 33,
    Apple: 34,
    RottenFlesh: 35,

    Leather: 50,

    Seeds: 100,
});

const items = [
    new Item({ itemId: 0, name: "Stick", sprite: "stick", fuelTime: 5 }),

    //#region Wooden Tools
    new Item({
        itemId: 1,
        name: "Wood Axe",
        sprite: "wood_axe",
        toolType: ToolType.Axe,
        toolLevel: 1,
        heldInHand: true,
        stackSize: 1,
        fuelTime: 10,
        baseDamage: 0.7,
    }),
    new Item({
        itemId: 2,
        name: "Wood Pickaxe",
        sprite: "wood_pickaxe",
        toolType: ToolType.Pickaxe,
        toolLevel: 11.5,
        heldInHand: true,
        stackSize: 1,
        fuelTime: 10,
    }),
    new Item({
        itemId: 3,
        name: "Wood Shovel",
        sprite: "wood_shovel",
        toolType: ToolType.Shovel,
        toolLevel: 0.5,
        heldInHand: true,
        stackSize: 1,
        fuelTime: 10,
    }),
    new Item({
        itemId: 4,
        name: "Wood Hoe",
        sprite: "wood_hoe",
        toolType: ToolType.Hoe,
        toolLevel: 1,
        heldInHand: true,
        stackSize: 1,
        fuelTime: 10,
    }),
    new Item({
        itemId: 5,
        name: "Wood Sword",
        sprite: "wood_sword",
        toolType: ToolType.Sword,
        toolLevel: 1,
        heldInHand: true,
        stackSize: 1,
        fuelTime: 10,
        baseDamage: 1,
    }),
    //#endregion

    //#region Stone Tools
    new Item({
        itemId: 6,
        name: "Stone Axe",
        sprite: "stone_axe",
        toolType: ToolType.Axe,
        toolLevel: 2,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 1.7,
    }),
    new Item({
        itemId: 7,
        name: "Stone Pickaxe",
        sprite: "stone_pickaxe",
        toolType: ToolType.Pickaxe,
        toolLevel: 13.5,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 8,
        name: "Stone Shovel",
        sprite: "stone_shovel",
        toolType: ToolType.Shovel,
        toolLevel: 1,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 9,
        name: "Stone Hoe",
        sprite: "stone_hoe",
        toolType: ToolType.Hoe,
        toolLevel: 2,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 10,
        name: "Stone Sword",
        sprite: "stone_sword",
        toolType: ToolType.Sword,
        toolLevel: 2,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 2,
    }),
    //#endregion

    //#region Iron Tools
    new Item({
        itemId: 11,
        name: "Shears",
        sprite: "shears",
        toolType: ToolType.Shears,
        toolLevel: 2,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 12,
        name: "Iron Axe",
        sprite: "iron_axe",
        toolType: ToolType.Axe,
        toolLevel: 3,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 2.7,
    }),
    new Item({
        itemId: 13,
        name: "Iron Pickaxe",
        sprite: "iron_pickaxe",
        toolType: ToolType.Pickaxe,
        toolLevel: 14.5,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 14,
        name: "Iron Shovel",
        sprite: "iron_shovel",
        toolType: ToolType.Shovel,
        toolLevel: 1.25,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 15,
        name: "Iron Hoe",
        sprite: "iron_hoe",
        toolType: ToolType.Hoe,
        toolLevel: 3,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 16,
        name: "Iron Sword",
        sprite: "iron_sword",
        toolType: ToolType.Sword,
        toolLevel: 3,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 3,
    }),
    //#endregion

    //#region Ores
    new Item({
        itemId: 20,
        name: "Coal",
        sprite: "coal",
        fuelTime: 80,
    }),
    new Item({
        itemId: 21,
        name: "Iron Ingot",
        sprite: "iron_ingot",
    }),
    new Item({
        itemId: 22,
        name: "Charcoal",
        sprite: "charcoal",
        fuelTime: 80,
    }),
    new Item({
        itemId: 23,
        name: "Diamond",
        sprite: "diamond",
    }),
    //#endregion

    //#region Food
    new Item({
        itemId: 30,
        name: "Raw Beef",
        sprite: "beef_raw",
        smeltOutput: { itemId: 31 },
        foodValue: 1,
    }),
    new Item({
        itemId: 31,
        name: "Cooked Beef",
        sprite: "beef_cooked",
        foodValue: 6,
    }),
    new Item({
        itemId: 32,
        name: "Raw Porkchop",
        sprite: "porkchop_raw",
        smeltOutput: { itemId: 33 },
        foodValue: 1,
    }),
    new Item({
        itemId: 33,
        name: "Cooked Porkchop",
        sprite: "porkchop_cooked",
        foodValue: 6,
    }),
    new Item({
        itemId: 34,
        name: "Apple",
        sprite: "apple",
        foodValue: 3,
    }),
    new Item({
        itemId: 35,
        name: "Rotten Flesh",
        sprite: "rotten_flesh",
        foodValue: 2,
    }),
    //#endregion

    //#region Mob Drops
    new Item({
        itemId: 50,
        name: "Leather",
        sprite: "leather",
    }),
    //#endregion

    //#region Seeds
    new Item({
        itemId: 100,
        name: "Seeds",
        sprite: "seeds_wheat",
    }),
    //#endregion
];

const itemMap = new Map(items.map((item) => [item.itemId, item]));
