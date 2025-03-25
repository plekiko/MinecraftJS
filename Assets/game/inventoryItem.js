class InventoryItem {
    constructor({ blockId = null, itemId = null, count = 0, props = {} } = {}) {
        this.blockId = blockId;
        this.itemId = itemId;
        this.count = count;
        this.props = props;

        this.init();
    }

    init() {
        if (this.itemId !== null) {
            const item = GetItem(this.itemId);

            if (item.durability) {
                if (!this.hasProp("durability"))
                    this.setProp("durability", item.durability);
            }
        }
    }

    addProps(props) {
        this.props = { ...this.props, ...props };
    }

    removeProps(props) {
        for (const prop in props) {
            delete this.props[prop];
        }
    }

    hasProp(prop) {
        return this.props[prop] !== undefined;
    }

    getProp(prop) {
        return this.props[prop];
    }

    setProp(prop, value) {
        this.props[prop] = value;
    }

    removeProp(prop) {
        delete this.props[prop];
    }
}

class InventorySlot {
    constructor({
        position = { x: 0, y: 0 },
        item = new InventoryItem(),
        onlyTake = false,
        infiniteTake = false,
    }) {
        this.position = position;
        this.item = item;
        this.onlyTake = onlyTake;
        this.infiniteTake = infiniteTake;
    }

    isEmpty() {
        return this.item.itemId === null && !this.item.blockId;
    }

    clear() {
        this.item.blockId = null;
        this.item.itemId = null;
        this.item.count = 0;
        this.item.props = {};
    }

    draw(offsetX = 0, offsetY = 0, overwritePosition = null, size = 1) {
        const item = this.item;

        if (item.count <= 0) return;
        if (!item.blockId && item.itemId === null) return;

        const slotX = overwritePosition
            ? overwritePosition.x
            : this.position.x + offsetX;
        const slotY = overwritePosition
            ? overwritePosition.y
            : this.position.y + offsetY;

        // const spritePath =
        //     "Assets/sprites/" +
        //     (item.blockId
        //         ? "blocks/" + GetBlock(item.blockId).iconSprite
        //         : "items/" + GetItem(item.itemId).sprite) +
        //     ".png";

        const isItem = item.itemId !== null;
        const spritePath = isItem
            ? getSpriteUrl("items/" + GetItem(item.itemId).sprite)
            : getSpriteUrl("blocks/" + GetBlock(item.blockId).iconSprite);

        // If block get the default draw cutoff
        let cutoff = 0;
        if (item.blockId) cutoff = GetBlock(item.blockId).defaultCutoff;

        const image = new Image();
        image.src = spritePath;

        // Draw the sprite
        drawImage({
            url: spritePath,
            x: slotX,
            y: slotY,
            scale: 3 * size,
            centerX: false,
            dark: item.props.wall === true,
            sizeY: 16 - cutoff * 16,
            fixAnimation: cutoff === 0,
            crop: {
                x: 0,
                y: 0,
                width: 16,
                height: 16,
            },
        });

        // Draw durability bar
        if (item.hasProp("durability")) {
            const durability = item.getProp("durability");

            const itemDef = GetItem(item.itemId);

            if (durability < itemDef.durability) {
                const maxWidth = 45;
                const width = maxWidth * size;
                const height = 3.5 * size;

                const offsetX = 2 * size;
                const offsetY = 40;

                const durabilityColor =
                    durability > itemDef.durability / 2
                        ? "rgba(0, 255, 0)"
                        : durability > itemDef.durability / 4
                        ? "rgba(255, 255, 0)"
                        : "rgba(255, 0, 0)";

                // Draw the background
                drawRect({
                    x: slotX + offsetX,
                    y: slotY + offsetY * size,
                    width: width,
                    height: height * 2,
                    color: "rgba(0, 0, 0)",
                });

                // Draw the durability
                drawRect({
                    x: slotX + offsetX,
                    y: slotY + offsetY * size,
                    width: width * (durability / itemDef.durability),
                    height: height,
                    color: durabilityColor,
                });
            }
        }

        if (item.count <= 1) return;

        // Draw the count
        drawText({
            text: item.count,
            x: slotX + 55 * size,
            y: slotY + 50 * size,
            size: 30 * size,
        });
    }
}
