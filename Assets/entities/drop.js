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

    getStackSize() {
        if (this.itemId != null) return GetItem(this.itemId).stackSize;

        return 64;
    }

    collisionLogic() {
        this.getOutBlockLogic();
        const other = this.entityCollision();

        if (other.type !== EntityTypes.Drop) return;

        const isSameBlock = other.blockId && other.blockId === this.blockId;
        const isSameItem = other.itemId != null && other.itemId === this.itemId;

        if (isSameBlock || isSameItem) {
            const maxStackSize = this.getStackSize();
            const combinedCount = this.count + other.count;

            if (combinedCount <= maxStackSize) {
                this.count = combinedCount;
                removeEntity(other);
            } else {
                const remainingSpace = maxStackSize - this.count;
                this.count += remainingSpace;
                other.count -= remainingSpace;

                if (other.count <= 0) removeEntity(other);
            }
        }
    }

    getOutBlockLogic() {
        if (
            this.filterBlocksByProperty(
                this.isCollidingWithBlockType(),
                "collision"
            ).length > 0
        ) {
            this.position.y -= BLOCK_SIZE;
        }
    }

    update(deltaTime) {
        this.updateEntity(deltaTime);
        this.collisionLogic();
    }
}
