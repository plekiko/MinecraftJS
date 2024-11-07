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
        dropWithoutTool = true,
        category = null,

        drop = blockId,

        breakWithoutBlockUnderneath = false,

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
        this.category = category;

        this.drop = drop;

        this.specialType = specialType;
    }
}

const SpecialType = Object.freeze({
    CraftingTable: 1,
});

const BlockCategory = Object.freeze({
    Logs: 1,
    Planks: 2,
});

const ToolType = Object.freeze({
    Nothing: 0,
    Pickaxe: 1,
    Axe: 2,
    Shovel: 3,
    Shears: 4,
    Hoe: 5,
    Sword: 6,
});

class Metadata {}

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
        // this.metaData = new Metadata();
    }

    setBlockType(blockType) {
        this.blockType = blockType;
        const block = GetBlock(blockType);

        // Set a random draw offset for grass blocks
        this.drawOffset = block.grassOffset ? RandomRange(-2, 2) : 0;

        // Determine if this block should display a fluid sprite
        this.fluidSprite = this.shouldDisplayFluidSprite(block);

        this.updateSprite();
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
        entities.push(
            new Drop({
                x:
                    this.transform.position.x +
                    camera.x +
                    RandomRange(0, BLOCK_SIZE / 3),
                y: this.transform.position.y + camera.y + BLOCK_SIZE / 4,
                blockId: GetBlock(this.blockType).drop,
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
