class BlockType {
    constructor(sprite, name, hardness) {
        this.sprite = sprite;
        this.name = name;
        this.hardness = hardness;
    }
}

const Blocks = Object.freeze({
    Air: new BlockType(null, "Air", -1),
    GrassBlock: new BlockType("grass_side", "Grass", 2),
    Dirt: new BlockType("dirt", "Dirt", 1.7),
    Stone: new BlockType("stone", "Stone", 8),
    Bedrock: new BlockType("bedrock", "Bedrock", -1),
    Sand: new BlockType("sand", "Sand", 1.3),
    SandStone: new BlockType("sandstone_normal", "Sand Stone", 7),
    SnowedGrassBlock: new BlockType("grass_side_snowed", "Snowed Grass", 2),
    Cactus: new BlockType("cactus_side", "Cactus", 1.5),
    OakLog: new BlockType("log_oak", "Oak Log", 3),
    OakLeaves: new BlockType("leaves_oak", "Oak Leaves", 0.6),
    SpruceLog: new BlockType("log_spruce", "Spruce Log", 3),
    SpruceLeaves: new BlockType("leaves_spruce", "Spruce Leaves", 0.6),
    AcaciaLog: new BlockType("log_acacia", "Acacia Log", 3),
    AcaciaLeaves: new BlockType("leaves_spruce", "Acacia Leaves", 0.6),
    BirchLog: new BlockType("log_birch", "Birch Log", 3),
    BirchLeaves: new BlockType("leaves_oak", "Birch Leaves", 0.6),
});

class Block extends Square {
    constructor(blockType = Blocks.Air, wall = false) {
        super(
            new Transform(new Vector2(), new Vector2()),
            blockType == blockType.Air ? 0 : 1,
            blockType.sprite ? "blocks/" + blockType.sprite + ".png" : null,
            BLOCK_SIZE / 16,
            wall
        );

        this.blockType = blockType;
    }

    setBlockType(blockType) {
        this.blockType = blockType;

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
