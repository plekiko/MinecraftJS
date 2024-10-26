class BlockType {
    constructor({
        sprite = null,
        name = "New block",
        hardness = 1,
        grassOffset = false,
    } = {}) {
        this.sprite = sprite;
        this.name = name;
        this.hardness = hardness;
        this.grassOffset = grassOffset;
    }
}

class Metadata {}

class Block extends Square {
    constructor(blockType = Blocks.Air, wall = false) {
        super(
            new Transform(new Vector2(), new Vector2()),
            blockType == Blocks.Air ? 0 : 1,
            blockType.sprite ? "blocks/" + blockType.sprite + ".png" : null,
            BLOCK_SIZE / 16,
            wall
        );

        this.blockType = blockType;
        this.metaData = new Metadata();
    }

    setBlockType(blockType) {
        this.blockType = blockType;

        this.drawOffset = blockType.grassOffset ? RandomRange(-2, 2) : 0;

        this.updateSprite();
    }

    updateSprite() {
        if (!this.blockType.sprite) {
            this.alpha = 0;
            return;
        }

        this.alpha = 1;

        this.setSprite("blocks/" + this.blockType.sprite + ".png");
    }
}
