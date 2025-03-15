class FallingBlock extends Entity {
    constructor({ position, blockType = Blocks.Sand } = {}) {
        super({
            position: new Vector2(
                position.x + BLOCK_SIZE / 20,
                position.y + BLOCK_SIZE / 20
            ),
            sprite:
                "Assets/sprites/blocks/" + GetBlock(blockType).sprite + ".png",
            hitbox: new Vector2(
                BLOCK_SIZE - BLOCK_SIZE / 10,
                BLOCK_SIZE - BLOCK_SIZE / 10
            ),
            spriteScale: BLOCK_SIZE / 16,
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
            this.lastVelocityY = this.velocity.y / 2;
        }
    }

    hit() {}
}
