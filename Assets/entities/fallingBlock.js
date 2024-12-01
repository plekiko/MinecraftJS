class FallingBlock extends Entity {
    constructor({ position, blockType = Blocks.Sand } = {}) {
        super({
            position: position,
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

    update(deltaTime) {
        this.updateEntity(deltaTime);

        if (this.grounded) {
            removeEntity(this);

            const position = new Vector2(
                this.position.x - Math.round(BLOCK_SIZE / 4 / BLOCK_SIZE),
                this.position.y + Math.round(this.lastVelocityY / BLOCK_SIZE)
            );

            const previousBlock = this.getBlockAtPosition(
                position.x,
                position.y
            );

            previousBlock.breakBlock(
                GetBlock(previousBlock.blockType).dropWithoutTool
            );

            SetBlockTypeAtPosition(
                position.x,
                position.y,
                this.blockType,
                false
            );
        } else {
            this.lastVelocityY = this.velocity.y / 2;
        }
    }

    hit() {}
}
