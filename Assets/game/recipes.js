const recipes = [
    //#region Planks

    // Oak Planks
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.OakLog }),
        output: new InventoryItem({ blockId: Blocks.OakPlanks, count: 4 }),
    }),
    // Spruce Planks
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.SpruceLog }),
        output: new InventoryItem({ blockId: Blocks.SprucePlanks, count: 4 }),
    }),
    // Acacia Planks
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.AcaciaLog }),
        output: new InventoryItem({ blockId: Blocks.AcaciaPlanks, count: 4 }),
    }),
    // Birch Planks
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.BirchLog }),
        output: new InventoryItem({ blockId: Blocks.BirchPlanks, count: 4 }),
    }),
    // Jungle Planks
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.JungleLog }),
        output: new InventoryItem({ blockId: Blocks.JunglePlanks, count: 4 }),
    }),

    //#endregion

    // Sticks
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ blockCategory: BlockCategory.Planks })],
            [new RecipeItem({ blockCategory: BlockCategory.Planks })],
        ],
        output: new InventoryItem({ itemId: Items.Stick, count: 4 }),
    }),

    // Crafting Table
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.CraftingTable, count: 1 }),
    }),

    //#region Tools

    //#region Wooden Tools

    // Wooden Axe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.WoodAxe, count: 1 }),
    }),

    // Wooden Pickaxe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
                ,
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.WoodPickaxe, count: 1 }),
    }),

    // Wooden Hoe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                ,
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.WoodHoe, count: 1 }),
    }),

    // Wooden Shovel
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ blockCategory: BlockCategory.Planks })],
            [new RecipeItem({ itemId: Items.Stick }), ,],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ itemId: Items.WoodShovel, count: 1 }),
    }),

    // Wooden Sword
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ blockCategory: BlockCategory.Planks })],
            [new RecipeItem({ blockCategory: BlockCategory.Planks })],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ itemId: Items.WoodSword, count: 1 }),
    }),

    //#endregion

    //#region Stone Tools

    // Stone Axe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.StoneAxe, count: 1 }),
    }),

    // Stone Pickaxe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
                ,
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.StonePickaxe, count: 1 }),
    }),

    // Stone Hoe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                ,
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.StoneHoe, count: 1 }),
    }),

    // Stone Shovel
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ blockId: Blocks.Cobblestone })],
            [new RecipeItem({ itemId: Items.Stick }), ,],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ itemId: Items.StoneShovel, count: 1 }),
    }),

    // Stone Sword
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ blockId: Blocks.Cobblestone })],
            [new RecipeItem({ blockId: Blocks.Cobblestone })],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ itemId: Items.StoneSword, count: 1 }),
    }),

    //#endregion

    //#region Iron Tools

    // Shears
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.Shears, count: 1 }),
    }),

    // Iron Axe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.IronAxe, count: 1 }),
    }),

    // Iron Pickaxe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
                ,
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.IronPickaxe, count: 1 }),
    }),

    // Iron Hoe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                ,
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.IronHoe, count: 1 }),
    }),

    // Iron Shovel
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ itemId: Items.IronIngot })],
            [new RecipeItem({ itemId: Items.Stick }), ,],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ itemId: Items.IronShovel, count: 1 }),
    }),

    // Iron Sword
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ itemId: Items.IronIngot })],
            [new RecipeItem({ itemId: Items.IronIngot })],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ itemId: Items.IronSword, count: 1 }),
    }),

    //#endregion

    //#endregion Tools

    // Furnace
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ count: 0 }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.Furnace, count: 1 }),
    }),

    // Stone Bricks
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Stone }),
                new RecipeItem({ blockId: Blocks.Stone }),
            ],
            [
                new RecipeItem({ blockId: Blocks.Stone }),
                new RecipeItem({ blockId: Blocks.Stone }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.StoneBricks, count: 4 }),
    }),
];
