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
            [new RecipeItem({ itemId: Items.Stick })],
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
    // Wooden Hammer
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.WoodHammer, count: 1 }),
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
            [new RecipeItem({ itemId: Items.Stick })],
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
    // Stone Hammer
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
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.StoneHammer, count: 1 }),
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
            [new RecipeItem({ itemId: Items.Stick })],
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
    // Iron Hammer
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.IronHammer, count: 1 }),
    }),
    // Bucket
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.Bucket, count: 1 }),
    }),
    //#endregion

    //#region Diamond Tools
    // Diamond Axe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.Diamond }),
                new RecipeItem({ itemId: Items.Diamond }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ itemId: Items.Diamond }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.DiamondAxe, count: 1 }),
    }),
    // Diamond Pickaxe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.Diamond }),
                new RecipeItem({ itemId: Items.Diamond }),
                new RecipeItem({ itemId: Items.Diamond }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.DiamondPickaxe, count: 1 }),
    }),
    // Diamond Hoe
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.Diamond }),
                new RecipeItem({ itemId: Items.Diamond }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.DiamondHoe, count: 1 }),
    }),
    // Diamond Shovel
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ itemId: Items.Diamond })],
            [new RecipeItem({ itemId: Items.Stick })],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ itemId: Items.DiamondShovel, count: 1 }),
    }),
    // Diamond Sword
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ itemId: Items.Diamond })],
            [new RecipeItem({ itemId: Items.Diamond })],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ itemId: Items.DiamondSword, count: 1 }),
    }),
    // Diamond Hammer
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.Diamond }),
                new RecipeItem({ itemId: Items.Diamond }),
                new RecipeItem({ itemId: Items.Diamond }),
            ],
            [
                new RecipeItem({ itemId: Items.Diamond }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ itemId: Items.Diamond }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.DiamondHammer, count: 1 }),
    }),
    //#endregion
    //#endregion Tools

    //#region Crafting Stations
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
    // Chest
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ count: 0 }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.Chest, count: 1 }),
    }),
    // Converter
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.Converter, count: 1 }),
    }),
    // Hopper
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ blockId: Blocks.Chest }),
                new RecipeItem({ itemId: Items.IronIngot }),
            ],
            [
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.IronIngot }),
                new RecipeItem({ count: 0 }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.Hopper, count: 1 }),
    }),
    //#endregion

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
    // Sandstone
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Sand }),
                new RecipeItem({ blockId: Blocks.Sand }),
            ],
            [
                new RecipeItem({ blockId: Blocks.Sand }),
                new RecipeItem({ blockId: Blocks.Sand }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.SandStone, count: 4 }),
    }),

    //#region Ore Blocks and Ores
    // Coal Block
    new Recipe({
        type: RecipeType.Filled,
        input: new RecipeItem({ itemId: Items.Coal }),
        output: new InventoryItem({ blockId: Blocks.CoalBlock, count: 1 }),
    }),
    // Coal
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.CoalBlock }),
        output: new InventoryItem({ itemId: Items.Coal, count: 9 }),
    }),
    // Iron Block
    new Recipe({
        type: RecipeType.Filled,
        input: new RecipeItem({ itemId: Items.IronIngot }),
        output: new InventoryItem({ blockId: Blocks.IronBlock, count: 1 }),
    }),
    // Iron Ingot from Iron Block
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.IronBlock }),
        output: new InventoryItem({ itemId: Items.IronIngot, count: 9 }),
    }),
    // Gold Block
    new Recipe({
        type: RecipeType.Filled,
        input: new RecipeItem({ itemId: Items.GoldIngot }),
        output: new InventoryItem({ blockId: Blocks.GoldBlock, count: 1 }),
    }),
    // Gold Ingot from Gold Block
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.GoldBlock }),
        output: new InventoryItem({ itemId: Items.GoldIngot, count: 9 }),
    }),
    // Redstone Block
    new Recipe({
        type: RecipeType.Filled,
        input: new RecipeItem({ itemId: Items.RedstoneDust }),
        output: new InventoryItem({ blockId: Blocks.RedstoneBlock, count: 1 }),
    }),
    // Redstone Dust
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.RedstoneBlock }),
        output: new InventoryItem({ itemId: Items.RedstoneDust, count: 9 }),
    }),
    // Diamond Block
    new Recipe({
        type: RecipeType.Filled,
        input: new RecipeItem({ itemId: Items.Diamond }),
        output: new InventoryItem({ blockId: Blocks.DiamondBlock, count: 1 }),
    }),
    // Diamond Ore
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.DiamondBlock }),
        output: new InventoryItem({ itemId: Items.Diamond, count: 9 }),
    }),
    // Gold Nugget
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ itemId: Items.GoldIngot }),
        output: new InventoryItem({ itemId: Items.GoldNugget, count: 9 }),
    }),
    // Iron Nugget
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ itemId: Items.IronIngot }),
        output: new InventoryItem({ itemId: Items.IronNugget, count: 9 }),
    }),
    // Gold Ingot from Gold Nuggets
    new Recipe({
        type: RecipeType.Filled,
        input: new RecipeItem({ itemId: Items.GoldNugget }),
        output: new InventoryItem({ itemId: Items.GoldIngot, count: 1 }),
    }),
    // Iron Ingot from Iron Nuggets
    new Recipe({
        type: RecipeType.Filled,
        input: new RecipeItem({ itemId: Items.IronNugget }),
        output: new InventoryItem({ itemId: Items.IronIngot, count: 1 }),
    }),
    //#endregion

    //#region Slabs
    // Stone Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Stone }),
                new RecipeItem({ blockId: Blocks.Stone }),
                new RecipeItem({ blockId: Blocks.Stone }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.StoneSlab, count: 6 }),
    }),
    // Oak Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.OakPlanks }),
                new RecipeItem({ blockId: Blocks.OakPlanks }),
                new RecipeItem({ blockId: Blocks.OakPlanks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.OakSlab, count: 6 }),
    }),
    // Spruce Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.SprucePlanks }),
                new RecipeItem({ blockId: Blocks.SprucePlanks }),
                new RecipeItem({ blockId: Blocks.SprucePlanks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.SpruceSlab, count: 6 }),
    }),
    // Acacia Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.AcaciaPlanks }),
                new RecipeItem({ blockId: Blocks.AcaciaPlanks }),
                new RecipeItem({ blockId: Blocks.AcaciaPlanks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.AcaciaSlab, count: 6 }),
    }),
    // Birch Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.BirchPlanks }),
                new RecipeItem({ blockId: Blocks.BirchPlanks }),
                new RecipeItem({ blockId: Blocks.BirchPlanks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.BirchSlab, count: 6 }),
    }),
    // Jungle Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.JunglePlanks }),
                new RecipeItem({ blockId: Blocks.JunglePlanks }),
                new RecipeItem({ blockId: Blocks.JunglePlanks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.JungleSlab, count: 6 }),
    }),
    // Cobblestone Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Cobblestone }),
            ],
        ],
        output: new InventoryItem({
            blockId: Blocks.CobblestoneSlab,
            count: 6,
        }),
    }),
    // Sandstone Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.SandStone }),
                new RecipeItem({ blockId: Blocks.SandStone }),
                new RecipeItem({ blockId: Blocks.SandStone }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.SandstoneSlab, count: 6 }),
    }),
    // Stone Brick Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.StoneBricks }),
                new RecipeItem({ blockId: Blocks.StoneBricks }),
                new RecipeItem({ blockId: Blocks.StoneBricks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.StoneBrickSlab, count: 6 }),
    }),
    // Mossy Cobblestone Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.MossyCobblestone }),
                new RecipeItem({ blockId: Blocks.MossyCobblestone }),
                new RecipeItem({ blockId: Blocks.MossyCobblestone }),
            ],
        ],
        output: new InventoryItem({
            blockId: Blocks.MossyCobblestoneSlab,
            count: 6,
        }),
    }),
    // Smooth Stone Slab
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.SmoothStone }),
                new RecipeItem({ blockId: Blocks.SmoothStone }),
                new RecipeItem({ blockId: Blocks.SmoothStone }),
            ],
        ],
        output: new InventoryItem({
            blockId: Blocks.SmoothStoneSlab,
            count: 6,
        }),
    }),
    //#endregion

    //#region Redstone
    // Redstone Torch
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ itemId: Items.RedstoneDust })],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ blockId: Blocks.RedstoneTorch, count: 1 }),
    }),
    // Wood Pressure Plate
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
        ],
        output: new InventoryItem({
            blockId: Blocks.WoodPressurePlate,
            count: 1,
        }),
    }),
    // Stone Pressure Plate
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Stone }),
                new RecipeItem({ blockId: Blocks.Stone }),
            ],
        ],
        output: new InventoryItem({
            blockId: Blocks.StonePressurePlate,
            count: 1,
        }),
    }),
    // Note Block
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ itemId: Items.RedstoneDust }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.NoteBlock, count: 1 }),
    }),
    // Redstone Lamp
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Glass }),
                new RecipeItem({ blockId: Blocks.Glass }),
                new RecipeItem({ blockId: Blocks.Glass }),
            ],
            [
                new RecipeItem({ blockId: Blocks.Glass }),
                new RecipeItem({ itemId: Items.RedstoneDust }),
                new RecipeItem({ blockId: Blocks.Glass }),
            ],
            [
                new RecipeItem({ blockId: Blocks.Glass }),
                new RecipeItem({ blockId: Blocks.Glass }),
                new RecipeItem({ blockId: Blocks.Glass }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.RedstoneLamp, count: 1 }),
    }),

    //#endregion

    //#region Food

    // Bread
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.Wheat }),
                new RecipeItem({ itemId: Items.Wheat }),
                new RecipeItem({ itemId: Items.Wheat }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.Bread, count: 1 }),
    }),

    // Golden Carrot
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.GoldNugget }),
                new RecipeItem({ itemId: Items.GoldNugget }),
                new RecipeItem({ itemId: Items.GoldNugget }),
            ],
            [
                new RecipeItem({ itemId: Items.GoldNugget }),
                new RecipeItem({ itemId: Items.Carrot }),
                new RecipeItem({ itemId: Items.GoldNugget }),
            ],
            [
                new RecipeItem({ itemId: Items.GoldNugget }),
                new RecipeItem({ itemId: Items.GoldNugget }),
                new RecipeItem({ itemId: Items.GoldNugget }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.GoldenCarrot, count: 1 }),
    }),

    //#endregion

    //#region Misc
    // Jukebox
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ itemId: Items.Diamond }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
            [
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
                new RecipeItem({ blockCategory: BlockCategory.Planks }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.Jukebox, count: 1 }),
    }),
    // Snow Block
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.Snowball }),
                new RecipeItem({ itemId: Items.Snowball }),
            ],
            [
                new RecipeItem({ itemId: Items.Snowball }),
                new RecipeItem({ itemId: Items.Snowball }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.SnowBlock, count: 1 }),
    }),
    // Snow Ball
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.SnowBlock }),
        output: new InventoryItem({ itemId: Items.Snowball, count: 4 }),
    }),
    // Torch
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ itemId: Items.Coal })],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ blockId: Blocks.Torch, count: 4 }),
    }),
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [new RecipeItem({ itemId: Items.Charcoal })],
            [new RecipeItem({ itemId: Items.Stick })],
        ],
        output: new InventoryItem({ blockId: Blocks.Torch, count: 4 }),
    }),
    // Golden Apple
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.GoldIngot }),
                new RecipeItem({ itemId: Items.GoldIngot }),
                new RecipeItem({ itemId: Items.GoldIngot }),
            ],
            [
                new RecipeItem({ itemId: Items.GoldIngot }),
                new RecipeItem({ itemId: Items.Apple }),
                new RecipeItem({ itemId: Items.GoldIngot }),
            ],
            [
                new RecipeItem({ itemId: Items.GoldIngot }),
                new RecipeItem({ itemId: Items.GoldIngot }),
                new RecipeItem({ itemId: Items.GoldIngot }),
            ],
        ],
        output: new InventoryItem({ itemId: Items.GoldenApple, count: 1 }),
    }),
    // Hay Bale
    new Recipe({
        type: RecipeType.Filled,
        input: new RecipeItem({ itemId: Items.Wheat }),
        output: new InventoryItem({ blockId: Blocks.HayBale, count: 1 }),
    }),
    // Wheat
    new Recipe({
        type: RecipeType.Shapeless,
        input: new RecipeItem({ blockId: Blocks.HayBale }),
        output: new InventoryItem({ itemId: Items.Wheat, count: 9 }),
    }),
    // Ladder
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ itemId: Items.Stick }),
            ],
            [
                new RecipeItem({ itemId: Items.Stick }),
                new RecipeItem({ count: 0 }),
                new RecipeItem({ itemId: Items.Stick }),
            ],
        ],
        output: new InventoryItem({ blockId: Blocks.Ladder, count: 3 }),
    }),
    //#endregion

    //#region Mossy Blocks
    // Mossy Cobblestone
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.Cobblestone }),
                new RecipeItem({ blockId: Blocks.Vines }),
            ],
        ],
        output: new InventoryItem({
            blockId: Blocks.MossyCobblestone,
            count: 1,
        }),
    }),
    // Mossy Stone Bricks
    new Recipe({
        type: RecipeType.Shaped,
        input: [
            [
                new RecipeItem({ blockId: Blocks.StoneBricks }),
                new RecipeItem({ blockId: Blocks.Vines }),
            ],
        ],
        output: new InventoryItem({
            blockId: Blocks.MossyStoneBricks,
            count: 1,
        }),
    }),
    //#endregion
];
