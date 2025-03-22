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
    Bucket: 17,
    WaterBucket: 18,
    LavaBucket: 19,

    DiamondAxe: 40,
    DiamondPickaxe: 41,
    DiamondShovel: 42,
    DiamondHoe: 43,
    DiamondSword: 44,

    GoldenAxe: 45,
    GoldenPickaxe: 46,
    GoldenShovel: 47,
    GoldenHoe: 48,
    GoldenSword: 49,

    WoodHammer: 1000,
    StoneHammer: 1001,
    IronHammer: 1002,
    DiamondHammer: 1003,
    GoldenHammer: 1004,

    Coal: 20,
    IronIngot: 21,
    Charcoal: 22,
    Diamond: 23,
    GoldIngot: 24,
    RedstoneDust: 25,
    GoldNugget: 26,
    IronNugget: 27,

    RawBeef: 1500,
    CookedBeef: 1501,
    RawPorkchop: 1502,
    CookedPorkchop: 1503,
    Apple: 1504,
    RottenFlesh: 1505,
    GoldenApple: 1506,
    Bread: 1507,
    Carrot: 1508,
    GoldenCarrot: 1509,
    Potato: 1510,
    BakedPotato: 1511,
    RawMutton: 1512,
    CookedMutton: 1513,

    Leather: 50,
    Bone: 51,

    Seeds: 100,

    Wheat: 110,

    MusicDisc13: 2256,
    MusicDiscCat: 2257,
    MusicDiscBlocks: 2258,
    MusicDiscChirp: 2259,
    MusicDiscFar: 2260,
    MusicDiscMall: 2261,
    MusicDiscMellohi: 2262,
    MusicDiscStal: 2263,
    MusicDiscStrad: 2264,
    MusicDiscWard: 2265,
    MusicDisc11: 2266,
    MusicDiscWait: 2267,

    Snowball: 300,
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
    new Item({
        itemId: 17,
        name: "Bucket",
        sprite: "bucket_empty",
        heldInHand: true,
    }),
    new Item({
        itemId: 18,
        name: "Water Bucket",
        sprite: "bucket_water",
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 19,
        name: "Lava Bucket",
        sprite: "bucket_lava",
        heldInHand: true,
        stackSize: 1,
        fuelTime: 1000,
    }),
    //#endregion

    //#region Diamond Tools
    new Item({
        itemId: 40,
        name: "Diamond Axe",
        sprite: "diamond_axe",
        toolType: ToolType.Axe,
        toolLevel: 4,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 3.7,
    }),
    new Item({
        itemId: 41,
        name: "Diamond Pickaxe",
        sprite: "diamond_pickaxe",
        toolType: ToolType.Pickaxe,
        toolLevel: 14.8,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 42,
        name: "Diamond Shovel",
        sprite: "diamond_shovel",
        toolType: ToolType.Shovel,
        toolLevel: 1.5,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 43,
        name: "Diamond Hoe",
        sprite: "diamond_hoe",
        toolType: ToolType.Hoe,
        toolLevel: 4,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 44,
        name: "Diamond Sword",
        sprite: "diamond_sword",
        toolType: ToolType.Sword,
        toolLevel: 4,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 4,
    }),

    //#endregion

    //#region Golden Tools
    new Item({
        itemId: 45,
        name: "Golden Axe",
        sprite: "gold_axe",
        toolType: ToolType.Axe,
        toolLevel: 3.5,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 2.7,
    }),
    new Item({
        itemId: 46,
        name: "Golden Pickaxe",
        sprite: "gold_pickaxe",
        toolType: ToolType.Pickaxe,
        toolLevel: 14.5,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 47,
        name: "Golden Shovel",
        sprite: "gold_shovel",
        toolType: ToolType.Shovel,
        toolLevel: 1.25,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 48,
        name: "Golden Hoe",
        sprite: "gold_hoe",
        toolType: ToolType.Hoe,
        toolLevel: 3,
        heldInHand: true,
        stackSize: 1,
    }),
    new Item({
        itemId: 49,
        name: "Golden Sword",
        sprite: "gold_sword",
        toolType: ToolType.Sword,
        toolLevel: 3,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 3,
    }),
    //#endregion

    //#endregion

    //#region Hammers

    new Item({
        itemId: 1000,
        name: "Wood Hammer",
        sprite: "wood_hammer",
        toolType: ToolType.Hammer,
        toolLevel: 1,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 2,
    }),
    new Item({
        itemId: 1001,
        name: "Stone Hammer",
        sprite: "stone_hammer",
        toolType: ToolType.Hammer,
        toolLevel: 1.2,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 3,
    }),
    new Item({
        itemId: 1002,
        name: "Iron Hammer",
        sprite: "iron_hammer",
        toolType: ToolType.Hammer,
        toolLevel: 1.4,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 4,
    }),
    new Item({
        itemId: 1003,
        name: "Diamond Hammer",
        sprite: "diamond_hammer",
        toolType: ToolType.Hammer,
        toolLevel: 1.6,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 5,
    }),
    new Item({
        itemId: 1004,
        name: "Gold Hammer",
        sprite: "gold_hammer",
        toolType: ToolType.Hammer,
        toolLevel: 1.7,
        heldInHand: true,
        stackSize: 1,
        baseDamage: 6,
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
    new Item({
        itemId: 24,
        name: "Gold Ingot",
        sprite: "gold_ingot",
    }),
    new Item({
        itemId: 25,
        name: "Redstone Dust",
        sprite: "redstone_dust",

        placeBlock: 67,
    }),

    new Item({
        itemId: 26,
        name: "Gold Nugget",
        sprite: "gold_nugget",
    }),
    new Item({
        itemId: 27,
        name: "Iron Nugget",
        sprite: "iron_nugget",
    }),

    //#endregion

    //#region Food
    new Item({
        itemId: 1500,
        name: "Raw Beef",
        sprite: "beef_raw",
        smeltOutput: { itemId: 1501 },
        foodValue: 2,
    }),
    new Item({
        itemId: 1501,
        name: "Cooked Beef",
        sprite: "beef_cooked",
        foodValue: 6,
    }),
    new Item({
        itemId: 1502,
        name: "Raw Porkchop",
        sprite: "porkchop_raw",
        smeltOutput: { itemId: 1503 },
        foodValue: 2,
    }),
    new Item({
        itemId: 1503,
        name: "Cooked Porkchop",
        sprite: "porkchop_cooked",
        foodValue: 6,
    }),
    new Item({
        itemId: 1504,
        name: "Apple",
        sprite: "apple",
        foodValue: 3,
    }),
    new Item({
        itemId: 1505,
        name: "Rotten Flesh",
        sprite: "rotten_flesh",
        foodValue: 2,
    }),
    new Item({
        itemId: 1506,
        name: "Golden Apple",
        sprite: "apple_gold",
        foodValue: 7,
    }),
    new Item({
        itemId: 1507,
        name: "Bread",
        sprite: "bread",
        foodValue: 5,
    }),
    new Item({
        itemId: 1508,
        name: "Carrot",
        sprite: "carrot",
        foodValue: 3,
        placeBlock: 101,
    }),
    new Item({
        itemId: 1509,
        name: "Golden Carrot",
        sprite: "carrot_gold",
        foodValue: 6,
    }),
    new Item({
        itemId: 1510,
        name: "Potato",
        sprite: "potato",
        foodValue: 2,
        placeBlock: 102,
        smeltOutput: { itemId: 1511 },
    }),
    new Item({
        itemId: 1511,
        name: "Baked Potato",
        sprite: "potato_baked",
        foodValue: 5,
    }),
    new Item({
        itemId: 1512,
        name: "Raw Mutton",
        sprite: "mutton_raw",
        smeltOutput: { itemId: 1513 },
        foodValue: 2,
    }),
    new Item({
        itemId: 1513,
        name: "Cooked Mutton",
        sprite: "mutton_cooked",
        foodValue: 6,
    }),
    //#endregion

    //#region Mob Drops
    new Item({
        itemId: 50,
        name: "Leather",
        sprite: "leather",
    }),
    new Item({
        itemId: 51,
        name: "Bone",
        sprite: "bone",
    }),
    //#endregion

    //#region Seeds
    new Item({
        itemId: 100,
        name: "Seeds",
        sprite: "seeds_wheat",

        placeBlock: 100,
    }),
    //#endregion

    //#region Crops
    new Item({
        itemId: 110,
        name: "Wheat",
        sprite: "wheat",
    }),
    //#endregion

    //#region Music Discs
    new Item({
        itemId: 2256,
        name: "C418 - 13",
        sprite: "record_13",
        playMusicInJukebox: "discs/13.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2257,
        name: "C418 - Cat",
        sprite: "record_cat",
        playMusicInJukebox: "discs/cat.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2258,
        name: "C418 - Blocks",
        sprite: "record_blocks",
        playMusicInJukebox: "discs/blocks.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2259,
        name: "C418 - Chirp",
        sprite: "record_chirp",
        playMusicInJukebox: "discs/chirp.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2260,
        name: "C418 - Far",
        sprite: "record_far",
        playMusicInJukebox: "discs/far.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2261,
        name: "C418 - Mall",
        sprite: "record_mall",
        playMusicInJukebox: "discs/mall.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2262,
        name: "C418 - Mellohi",
        sprite: "record_mellohi",
        playMusicInJukebox: "discs/mellohi.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2263,
        name: "C418 - Stal",
        sprite: "record_stal",
        playMusicInJukebox: "discs/stal.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2264,
        name: "C418 - Strad",
        sprite: "record_strad",
        playMusicInJukebox: "discs/strad.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2265,
        name: "C418 - Ward",
        sprite: "record_ward",
        playMusicInJukebox: "discs/ward.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2266,
        name: "C418 - 11",
        sprite: "record_11",
        playMusicInJukebox: "discs/11.ogg",
        stackSize: 1,
    }),
    new Item({
        itemId: 2267,
        name: "C418 - Wait",
        sprite: "record_wait",
        playMusicInJukebox: "discs/wait.ogg",
        stackSize: 1,
    }),
    //#endregion

    //#region Projectiles
    new Item({
        itemId: 300,
        name: "Snowball",
        sprite: "snowball",
        stackSize: 16,
        projectile: "Snowball",
        throwPower: 25,
    }),
    //#endregion
];

const itemMap = new Map(items.map((item) => [item.itemId, item]));
