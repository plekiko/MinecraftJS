class BlockType {
    constructor({
        blockId,
        sprite = null,
        name = "New block",
        hardness = -2,
        grassOffset = false,
        animationSpeed = null,
        fluid = false,
        drag = 1,
        collision = true,

        breakSound = Sounds.Break_Wood,
        breakingSound = Sounds.Breaking_Wood,

        toolType = ToolType.Nothing,
        requiredToolLevel = 0,
        dropWithoutTool = true,
        category = null,

        dropBlock = blockId,
        dropItem = null,

        breakWithoutBlockUnderneath = false,

        fuelTime = null,
        smeltOutput = false,

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

        this.breakWithoutBlockUnderneath = breakWithoutBlockUnderneath;

        this.toolType = toolType;
        this.dropWithoutTool = dropWithoutTool;
        this.requiredToolLevel = requiredToolLevel;
        this.category = category;

        this.dropBlock = dropBlock;
        this.dropItem = dropItem;

        this.fuelTime = fuelTime;
        this.smeltOutput = smeltOutput;

        this.specialType = specialType;
    }
}

const SpecialType = Object.freeze({
    CraftingTable: 1,
    Furnace: 2,
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
                        new InventoryItem({
                            blockId: Blocks.IronOre,
                            count: 20,
                        }),
                        new InventoryItem({ itemId: Items.Coal, count: 20 }),
                    ],
                    [new InventoryItem()],
                ];
                updating = true;
                break;
        }

        this.metaData = new Metadata({ storage: storage, updating: updating });
    }

    setBlockType(blockType) {
        if (this.blockType === blockType) return;

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

    update(deltaTime) {
        if (!this.metaData) return;

        if (GetBlock(this.blockType).specialType === SpecialType.Furnace)
            this.furnaceLogic(deltaTime);

        if (!this.metaData.isActive) {
            this.resetProgression();
            return;
        }

        this.metaData.progression += deltaTime;
    }

    furnaceLogic(deltaTime) {
        if (this.metaData.isActive)
            this.setSprite("blocks/furnace_front_on.png");
        else this.setSprite("blocks/furnace_front_off.png");

        if (!this.metaData.storage) return;

        const storage = this.metaData.storage;

        const input = this.getSlotItem(storage[0][0]);
        const fuel = this.getSlotItem(storage[0][1]);
        if (!fuel || !input) {
            this.metaData.isActive = false;
            this.resetProgression();
            return;
        }
        const output = this.getSlotItem(storage[1][0]);
        const outputItem = this.getSlotItem(input.smeltOutput);

        if (
            fuel.fuelTime &&
            input.smeltOutput &&
            (!output ||
                (output == outputItem &&
                    storage[1][0].count + 1 <=
                        this.getSlotItem(input.smeltOutput).stackSize))
        )
            this.metaData.isActive = true;
        else this.metaData.isActive = false;

        if (!this.metaData.isActive) return;

        // chat.message(
        //     "Fueltime: " +
        //         fuel.fuelTime +
        //         " Progression: " +
        //         this.metaData.progression
        // );

        this.metaData.fuelProgression += deltaTime;

        if (fuel.fuelTime <= this.metaData.fuelProgression) {
            // Fuel gone
            this.removeOneFromStack(storage[0][1]);
            this.metaData.fuelProgression = 0;
        }

        if (this.metaData.progression >= 10) {
            this.removeOneFromStack(storage[0][0]);

            storage[1][0].itemId = outputItem.itemId;
            storage[1][0].blockId = outputItem.blockId;
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
        return aboveBlock && aboveBlock.img === null;
    }

    breakBlock(drop = false) {
        if (this.blockType === Blocks.Air) return;

        if (chunks.has(this.chunkX)) {
            chunks.get(this.chunkX).checkForBlockWithAirBeneath(this.x, this.y);
        }

        if (drop) this.dropBlock();

        this.playBreakSound();

        this.setBlockType(Blocks.Air);
    }

    playBreakSound() {
        const soundArray = GetBlock(this.blockType).breakSound;

        if (!soundArray) return;

        PlayRandomSoundFromArray({ array: soundArray });
    }

    dropBlock() {
        const block = GetBlock(this.blockType);
        entities.push(
            new Drop({
                x:
                    this.transform.position.x +
                    camera.x +
                    RandomRange(0, BLOCK_SIZE / 3),
                y: this.transform.position.y + camera.y + BLOCK_SIZE / 4,
                blockId: block.dropItem == null ? block.dropBlock : null,
                itemId: block.dropItem != null ? block.dropItem : null,
            })
        );
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
