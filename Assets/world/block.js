class BlockType {
    constructor(sprite, name, hardness) {
        this.sprite = sprite;
        this.name = name;
        this.hardness = hardness;
    }
}

const Blocks = Object.freeze({
    Air: new BlockType(null, "Air", -1),
    GrassBlock: new BlockType("grass_side", "Grass Block", 1.2),
    Dirt: new BlockType("dirt", "Dirt", 1),
    Podzol: new BlockType("dirt_podzol_side", "Podzol", 1),
    Stone: new BlockType("stone", "Stone", 8),
    Bedrock: new BlockType("bedrock", "Bedrock", -1),
    Sand: new BlockType("sand", "Sand", 1.3),
    SandStone: new BlockType("sandstone_normal", "Sand Stone", 7),
    SnowedGrassBlock: new BlockType("grass_side_snowed", "Snowed Grass", 2),
    Cactus: new BlockType("cactus_side", "Cactus", 1.5),
    OakLog: new BlockType("log_oak", "Oak Log", 3),
    OakLeaves: new BlockType("leaves_oak_opaque", "Oak Leaves", 0.6),
    SpruceLog: new BlockType("log_spruce", "Spruce Log", 3),
    SpruceLeaves: new BlockType("leaves_spruce_opaque", "Spruce Leaves", 0.6),
    AcaciaLog: new BlockType("log_acacia", "Acacia Log", 3),
    AcaciaLeaves: new BlockType("leaves_acacia_opaque", "Acacia Leaves", 0.6),
    BirchLog: new BlockType("log_birch", "Birch Log", 3),
    BirchLeaves: new BlockType("leaves_birch_opaque", "Birch Leaves", 0.6),
    Grass: new BlockType("grass", "Grass", 0),
    TallGrass: new BlockType("tallgrass", "Tall Grass", 0),
    DeadBush: new BlockType("deadbush", "Dead Bush", 0),
    Fern: new BlockType("fern", "Fern", 0),
    FlowerTulipRed: new BlockType("flower_tulip_red", "Red Tulip", 0),
    FlowerTulipRed: new BlockType("flower_tulip_red", "Red Tulip", 0),
    FlowerTulipWhite: new BlockType("flower_tulip_white", "White Tulip", 0),
    FlowerTulipPink: new BlockType("flower_tulip_pink", "Pink Tulip", 0),
    FlowerTulipOrange: new BlockType("flower_tulip_orange", "Orange Tulip", 0),
    FlowerRose: new BlockType("flower_rose", "Rose", 0),
    FlowerBlueOrchid: new BlockType("flower_blue_orchid", "Rose", 0),
    FlowerDandelion: new BlockType("flower_dandelion", "Dandelion", 0),
    FlowerDaisy: new BlockType("flower_oxeye_daisy", "Daisy", 0),
    FlowerAllium: new BlockType("flower_allium", "Allium", 0),
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
