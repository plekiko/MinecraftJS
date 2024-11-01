class Drop extends Entity {
    constructor({ x, y, blockId = null, itemId = null, count = 1 }) {
        super({
            position: new Vector2(x, y),
            hitbox: new Vector2(BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5),
            sprite: blockId
                ? "Assets/sprites/blocks/" + GetBlock(blockId).sprite + ".png"
                : null,
            bouncing: true,
            type: EntityTypes.Drop,
        });

        this.x = x;
        this.y = y;
        this.blockId = blockId;
        this.itemId = itemId;
        this.count = count;
    }

    collisionLogic() {
        const other = this.entityCollision();

        if (!other.type === EntityTypes.Drop) return;
        if (other.blockId && other.blockId == this.blockId) {
            this.count += other.count;
            removeEntity(other);
        }
    }

    update(deltaTime) {
        this.updateEntity(deltaTime);
        this.collisionLogic();
    }
}
