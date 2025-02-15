class BlockType {
    constructor({
        blockId,
        sprite = null,
        name = "New block",
        hardness = -2,
        grassOffset = false,
        animationSpeed = null,
        fluid = false,
        drag = 40,
        collision = true,

        breakSound = Sounds.Break_Wood,
        breakingSound = Sounds.Breaking_Wood,

        toolType = ToolType.Nothing,
        requiredToolLevel = 0,
        dropWithoutTool = true,
        category = null,

        fall = false,

        ambientSound = null,

        dropBlock = blockId,
        dropItem = null,

        breakWithoutBlockUnderneath = false,

        dropTable = null,

        fuelTime = null,
        smeltOutput = null,

        specialType = null,
    } = {}) {
        this.blockId = blockId;
        this.sprite = sprite;
        this.name = name;
        this.hardness = hardness;
        this.grassOffset = grassOffset;
        this.animationSpeed = animationSpeed;
        this.fluid = fluid;
        this.drag = drag;
        this.collision = collision;
        this.breakSound = breakSound;
        this.breakingSound = breakingSound;

        this.fall = fall;

        this.ambientSound = ambientSound;

        this.breakWithoutBlockUnderneath = breakWithoutBlockUnderneath;

        this.toolType = toolType;
        this.dropWithoutTool = dropWithoutTool;
        this.requiredToolLevel = requiredToolLevel;
        this.category = category;

        this.dropBlock = dropBlock;
        this.dropItem = dropItem;
        this.dropTable = dropTable;

        this.fuelTime = fuelTime;
        this.smeltOutput = smeltOutput;

        this.specialType = specialType;
    }
}

const SpecialType = Object.freeze({
    CraftingTable: 1,
    Furnace: 2,
    SingleChest: 3,
});

const BlockCategory = Object.freeze({
    Logs: 1,
    Planks: 2,
});

class Metadata {
    constructor({ storage = null, updating = false }) {
        this.storage = storage;
        this.updating = updating;
        this.progression = 0;
        this.fuelProgression = 0;
        this.isActive = false;
        this.burningFuelTime = 0;
    }
}

class Block extends Square {
    constructor(
        x = 0,
        y = 0,
        blockType = Blocks.Air,
        chunkX = 0,
        wall = false
    ) {
        super(
            new Transform(new Vector2(), new Vector2()),
            blockType == Blocks.Air ? 0 : 1,
            GetBlock(blockType).sprite
                ? "blocks/" + GetBlock(blockType).sprite + ".png"
                : null,
            BLOCK_SIZE / 16,
            wall
        );
        this.x = x;
        this.y = y;
        this.chunkX = chunkX;
        this.blockType = blockType;
        if (GetBlock(blockType).specialType) this.setMetaData();
    }

    setMetaData() {
        const specialType = GetBlock(this.blockType).specialType;
        if (specialType == SpecialType.CraftingTable) return;

        let storage = [];
        let updating = false;

        switch (specialType) {
            case SpecialType.Furnace:
                storage = [
                    [
                        // input
                        new InventoryItem(),
                        // fuel
                        new InventoryItem(),
                    ],
                    // output
                    [new InventoryItem()],
                ];
                updating = true;
                break;
            case SpecialType.SingleChest:
                for (let y = 0; y < 3; y++) {
                    storage[y] = [];
                    for (let x = 0; x < 9; x++) {
                        storage[y][x] = new InventoryItem();
                    }
                }
        }

        this.metaData = new Metadata({ storage: storage, updating: updating });
    }

    setBlockType(blockType, override = false) {
        if (this.blockType === blockType && !override) return;

        const existingIndex = updatingBlocks.indexOf(this);
        if (existingIndex !== -1) updatingBlocks.splice(existingIndex, 1);

        this.blockType = blockType;

        const block = GetBlock(blockType);

        this.metaData = undefined;

        if (block.specialType) this.setMetaData();

        if (this.metaData && this.metaData.updating) {
            updatingBlocks.push(this);
        }

        this.drawOffset = block.grassOffset ? RandomRange(-2, 2) : 0;

        this.fluidSprite = this.shouldDisplayFluidSprite(block);

        this.updateSprite();
    }

    update() {
        if (!this.metaData) return;

        if (GetBlock(this.blockType).specialType === SpecialType.Furnace)
            this.furnaceLogic();

        if (!this.metaData.isActive) {
            this.resetProgression();
            return;
        }

        this.metaData.progression += deltaTime;
    }

    furnaceLogic() {
        if (!this.metaData.storage) return;

        const storage = this.metaData.storage;
        const input = this.getSlotItem(storage[0][0]);
        const fuel = this.getSlotItem(storage[0][1]);
        const output = this.getSlotItem(storage[1][0]);
        const outputItem =
            input && input.smeltOutput
                ? this.getSlotItem(input.smeltOutput)
                : null;

        // Determine if furnace should be visually "on" based on fuel availability
        if (this.metaData.burningFuelTime > 0) {
            this.setSprite("blocks/furnace_front_on.png");
            this.metaData.isActive = true;
            if (!input) this.resetProgression();
        } else {
            this.setSprite("blocks/furnace_front_off.png");
            this.metaData.isActive = false;
            this.resetProgression();
        }

        // Only start burning fuel if there's an input item with a smeltable output
        if (!this.metaData.burningFuelTime && input && input.smeltOutput) {
            if (fuel) {
                this.metaData.burningFuelTime = fuel.fuelTime;
                this.removeOneFromStack(storage[0][1]);
            } else {
                this.metaData.isActive = false;
                return;
            }
        }

        // If burning fuel time is active, increment fuel progression
        if (this.metaData.burningFuelTime > 0) {
            this.metaData.fuelProgression += deltaTime;
        }

        // Reset burning fuel time if it has been used up
        if (this.metaData.fuelProgression >= this.metaData.burningFuelTime) {
            this.metaData.fuelProgression = 0;
            this.metaData.burningFuelTime = 0;

            if (fuel && input) {
                this.metaData.burningFuelTime = fuel.fuelTime;
                this.removeOneFromStack(storage[0][1]);
            }
        }

        // Only progress smelting if input and output conditions are met
        if (
            !(
                input &&
                input.smeltOutput &&
                (!output ||
                    (((output.blockId !== undefined &&
                        output.blockId === outputItem.blockId) ||
                        output.itemId === outputItem.itemId) &&
                        storage[1][0].count + 1 <=
                            (outputItem.stackSize || 64)))
            )
        ) {
            this.resetProgression();
        }

        // Complete smelting process if progression threshold is met
        if (this.metaData.progression >= 10) {
            this.removeOneFromStack(storage[0][0]);

            storage[1][0].itemId = outputItem ? outputItem.itemId : null;
            storage[1][0].blockId = outputItem ? outputItem.blockId : null;
            storage[1][0].count++;

            this.resetProgression();
        }
    }

    removeOneFromStack(item) {
        item.count--;

        if (item.count <= 0) {
            item.itemId = null;
            item.blockId = null;
        }
    }

    getSlotItem(item) {
        return item.blockId ? GetBlock(item.blockId) : GetItem(item.itemId);
    }

    resetProgression() {
        this.metaData.progression = 0;
    }

    shouldDisplayFluidSprite(block) {
        if (!block.fluid) return false;
        // console.log(this.chunkX);
        const aboveBlock = GetChunk(this.chunkX).getUp(this.x, this.y);
        return !GetBlock(aboveBlock.blockType).fluid;
    }

    breakBlock(drop = false) {
        if (this.blockType === Blocks.Air) return;

        if (chunks.has(this.chunkX)) {
            chunks.get(this.chunkX).checkForBlockWithAirBeneath(this.x, this.y);
        }

        if (drop) this.dropBlock();

        if (GetBlock(this.blockType).dropTable) this.dropTable();

        this.playBreakSound();

        if (this.metaData && this.metaData.storage) this.dropStorage();

        this.setBlockType(Blocks.Air);
    }

    gravityBlock() {
        let fallEntity = Entities.Sand;

        summonEntity(fallEntity, getBlockWorldPosition(this), {
            blockType: this.blockType,
        });

        this.breakBlock(false);
    }

    playBreakSound() {
        const soundArray = GetBlock(this.blockType).breakSound;

        if (!soundArray) return;

        PlayRandomSoundFromArray({
            array: soundArray,
            positional: true,
            origin: getBlockWorldPosition(this),
        });
    }

    dropTable() {
        const block = GetBlock(this.blockType);

        const loot = block.dropTable.getRandomLoot();

        loot.forEach((item) => {
            summonEntity(
                Drop,
                new Vector2(
                    this.transform.position.x +
                        camera.x +
                        RandomRange(0, BLOCK_SIZE / 3),
                    this.transform.position.y + camera.y + BLOCK_SIZE / 4
                ),
                {
                    blockId: item.blockId,
                    itemId: item.itemId,
                    count: item.count,
                }
            );
        });
    }

    dropBlock() {
        const block = GetBlock(this.blockType);

        summonEntity(
            Drop,
            new Vector2(
                this.transform.position.x +
                    camera.x +
                    RandomRange(0, BLOCK_SIZE / 3),
                this.transform.position.y + camera.y + BLOCK_SIZE / 4
            ),
            {
                blockId: block.dropItem == null ? block.dropBlock : null,
                itemId: block.dropItem != null ? block.dropItem : null,
            }
        );
    }

    dropStorage() {
        const storage = this.metaData.storage;

        for (let y = 0; y < storage.length; y++) {
            for (let x = 0; x < storage[y].length; x++) {
                const item = storage[y][x];
                if (!item.blockId && item.itemId === null) continue;
                summonEntity(
                    Drop,
                    new Vector2(
                        this.transform.position.x +
                            camera.x +
                            RandomRange(0, BLOCK_SIZE / 3),
                        this.transform.position.y + camera.y + BLOCK_SIZE / 4
                    ),
                    {
                        blockId: item.blockId,
                        itemId: item.itemId,
                        count: item.count,
                    }
                );
            }
        }
    }

    updateSprite() {
        if (!GetBlock(this.blockType).sprite) {
            this.alpha = 0;
            return;
        }

        this.alpha = 1;

        this.frameRate = GetBlock(this.blockType).animationSpeed;

        this.setSprite("blocks/" + GetBlock(this.blockType).sprite + ".png");
    }
}

function GetBlock(blockId) {
    return blockMap.has(blockId) ? blockMap.get(blockId) : 0;
}
