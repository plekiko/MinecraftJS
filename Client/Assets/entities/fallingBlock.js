class FallingBlock extends Entity {
    constructor({ position, blockType = Blocks.Sand } = {}) {
        const spritePath = "blocks/" + GetBlock(blockType).sprite;
        const sprite = getSpriteUrl(spritePath);

        const spriteSize = getSpriteSize(spritePath);
        const spriteWidth = spriteSize.width;
        const spriteHeight = spriteSize.height;

        const spriteScale = BLOCK_SIZE / Math.max(spriteWidth, spriteHeight);

        super({
            name: "Falling Block",
            position: new Vector2(
                position.x + BLOCK_SIZE / 20,
                position.y + BLOCK_SIZE / 20
            ),
            sprite: sprite,
            hitbox: new Vector2(
                BLOCK_SIZE - BLOCK_SIZE / 10,
                BLOCK_SIZE - BLOCK_SIZE / 10
            ),
            spriteScale: spriteScale, // Dynamically calculated sprite scale
            canSwim: false,
        });

        this.blockType = blockType;
        this.lastVelocityY = 0;
    }

    update() {
        this.updateEntity();

        if (this.grounded) {
            removeEntity(this);

            const position = new Vector2(
                Math.round(
                    this.position.x -
                        Math.round(BLOCK_SIZE / 4 / BLOCK_SIZE) -
                        BLOCK_SIZE / 20
                ),
                Math.round(
                    this.position.y +
                        Math.round(this.lastVelocityY / BLOCK_SIZE) -
                        BLOCK_SIZE / 20
                )
            );

            // chat.message(`${position.x} ${position.y}`);

            const previousBlock = this.getBlockAtPosition(
                position.x,
                position.y
            );

            previousBlock.breakBlock(
                GetBlock(previousBlock.blockType).dropWithoutTool
            );

            // chat.message(position.x, position.y);

            const myBlock = this.getBlockAtPosition(position.x, position.y);

            setBlockType(myBlock, this.blockType);
        } else {
            if (
                this.filterBlocksByProperty(
                    this.collidingWithBlocks,
                    "collision"
                ).length > 0
            ) {
                this.grounded = true;
            }

            this.lastVelocityY = this.velocity.y / 2;
        }
    }
}
