class BlockType {
    constructor({
        blockId,
        sprite = null,
        name = "New block",
        hardness = -2,
        grassOffset = false,
        animationSpeed = null,
        fluid = false,
    } = {}) {
        this.blockId = blockId;
        this.sprite = sprite;
        this.name = name;
        this.hardness = hardness;
        this.grassOffset = grassOffset;
        this.animationSpeed = animationSpeed;
        this.fluid = fluid;
    }
}

class Metadata {}

class Block extends Square {
    constructor(x = 0, y = 0, blockType = Blocks.Air, wall = false) {
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
        this.blockType = blockType;
        // this.metaData = new Metadata();
    }

    setBlockType(blockType) {
        this.blockType = blockType;

        this.drawOffset = GetBlock(blockType).grassOffset
            ? RandomRange(-2, 2)
            : 0;

        this.updateSprite();
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
