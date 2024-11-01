const recipes = [
    new Recipe({
        type: RecipeType.Shapeless,
        input: new InventoryItem({ blockId: Blocks.OakLog, count: 1 }),
        output: new InventoryItem({ blockId: Blocks.OakPlanks, count: 4 }),
    }),
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new InventoryItem({ blockId: Blocks.OakPlanks, count: 1 })],
            [new InventoryItem({ blockId: Blocks.OakPlanks, count: 1 })],
        ],
        output: new InventoryItem({ itemId: Items.Stick, count: 4 }),
    }),
];
