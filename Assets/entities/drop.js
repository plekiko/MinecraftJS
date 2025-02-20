class Drop extends Entity {
    constructor({
        position,
        blockId = null,
        itemId = null,
        count = 1,
        props = {},
    }) {
        const spritePath =
            "Assets/sprites/" +
            (blockId
                ? "blocks/" + GetBlock(blockId).sprite
                : "items/" + GetItem(itemId).sprite) +
            ".png";
        super({
            position: position,
            hitbox: new Vector2(BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5),
            sprite: spritePath,
            bouncing: true,
            type: EntityTypes.Drop,
            float: true,
            playWaterEnterSound: false,
            dark: props.wall === true,
        });

        this.position = position;
        this.blockId = blockId;
        this.itemId = itemId;
        this.count = count;
        this.props = props;

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

        const isSameBlock =
            other.blockId &&
            other.blockId === this.blockId &&
            arePropsEqual(other.props, this.props);
        const isSameItem =
            other.itemId != null &&
            other.itemId === this.itemId &&
            arePropsEqual(other.props, this.props);

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

    hit() {}

    getOutBlockLogic() {
        const collidingWith = this.isCollidingWithBlockType();
        if (
            this.filterBlocksByProperty(collidingWith, "collision").length >
                0 &&
            this.filterBlocksByProperty(collidingWith, "fluid").length === 0
        ) {
            this.position.y -= BLOCK_SIZE;
        }
    }

    update() {
        this.updateEntity();
        this.collisionLogic();
    }
}
