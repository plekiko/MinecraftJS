class Drop extends Entity {
    constructor({ x, y, blockId = null, itemId = null, count = 1 }) {
        const spritePath =
            "Assets/sprites/" +
            (blockId
                ? "blocks/" + GetBlock(blockId).sprite
                : "items/" + GetItem(itemId).sprite) +
            ".png";
        super({
            position: new Vector2(x, y),
            hitbox: new Vector2(BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5),
            sprite: spritePath,
            bouncing: true,
            type: EntityTypes.Drop,
        });

        this.x = x;
        this.y = y;
        this.blockId = blockId;
        this.itemId = itemId;
        this.count = count;

        this.isReady = false;

        setTimeout(() => {
            this.isReady = true;
        }, 1500);
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
