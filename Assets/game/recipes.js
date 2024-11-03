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
];
