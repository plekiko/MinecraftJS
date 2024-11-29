class FallingBlock extends Entity {
    constructor({ position, blockType }) {
        super({
            position: position,
            sprite:
                "Assets/sprites/blocks/" + GetBlock(blockType).sprite + ".png",
            hitbox: new Vector2(
                BLOCK_SIZE - BLOCK_SIZE / 10,
                BLOCK_SIZE - BLOCK_SIZE / 10
            ),
            spriteScale: BLOCK_SIZE / 16,
        });

        this.blockType = blockType;
    }

    update(deltaTime) {
        this.updateEntity(deltaTime);

        if (this.grounded) {
            removeEntity(this);
            SetBlockTypeAtPosition(
                this.position.x,
                this.position.y,
                this.blockType,
                false
            );
        }
    }

    hit() {}
}
