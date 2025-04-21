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

    isEmpty() {
        if (this.count <= 0) return true;
        return this.blockId === null && this.itemId === null;
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

        const isItem = item.itemId !== null;
        const path = isItem
            ? "items/" + GetItem(item.itemId).sprite
            : "blocks/" + GetBlock(item.blockId).iconSprite;

        const spritePath = getSpriteUrl(path);
        const spriteSize = getSpriteSize(path);
        const actualWidth = spriteSize.width || 16;
        const actualHeight = spriteSize.height || 16;

        // Get the default cutoff for block
        let cutoff = 0;
        if (item.blockId) cutoff = GetBlock(item.blockId).defaultCutoff || 0;

        // Calculate the height to draw based on cutoff
        const drawHeight = actualHeight - cutoff * actualHeight;

        // The amount to move the sprite down due to the cutoff
        const moveDown = cutoff * actualHeight;

        const baseDrawSize = 48;
        const scaleX = (baseDrawSize / actualWidth) * size;
        const scaleY = (baseDrawSize / actualHeight) * drawHeight * size;

        // Frame animation logic based on time (globalFrame could be set elsewhere)
        const frameCount = Math.floor(actualHeight / actualWidth); // Total number of frames in the sprite sheet

        const animationSpeed = 2;
        const frame = Math.floor(globalFrame / animationSpeed) % frameCount;

        // Calculate the crop Y offset for the current frame
        const cropY = frame * actualWidth; // Adjust the Y position for the current frame

        // Ensure we don't go out of bounds
        const cropHeight = Math.min(actualWidth, actualHeight - cropY); // Max height for each frame

        // Set crop to match the current animation frame
        const crop = {
            x: 0,
            y: moveDown + cropY, // Apply the moveDown offset for cutoff
            width: actualWidth,
            height: cropHeight,
        };

        // Draw the sprite with animation applied through the crop
        drawImage({
            url: spritePath,
            x: slotX,
            y: slotY + moveDown * Math.min(scaleX, scaleY),
            scale: Math.min(scaleX, scaleY),
            centerX: false,
            dark: item.props.wall === true,
            fixAnimation: false, // No longer need to fix to 16x16
            crop: crop,
        });

        // Draw durability bar
        if (item.hasProp("durability")) {
            const durability = item.getProp("durability");
            const itemDef = GetItem(item.itemId);

            if (durability < itemDef.durability) {
                const maxWidth = 45 * size;
                const height = 3.5 * size;

                const durabilityColor =
                    durability > itemDef.durability / 2
                        ? "rgba(0, 255, 0)"
                        : durability > itemDef.durability / 4
                        ? "rgba(255, 255, 0)"
                        : "rgba(255, 0, 0)";

                drawRect({
                    x: slotX + 2 * size,
                    y: slotY + 40 * size,
                    width: maxWidth,
                    height: height * 2,
                    color: "rgba(0, 0, 0)",
                });

                drawRect({
                    x: slotX + 2 * size,
                    y: slotY + 40 * size,
                    width: maxWidth * (durability / itemDef.durability),
                    height: height,
                    color: durabilityColor,
                });
            }
        }

        if (item.count > 1) {
            drawText({
                text: item.count,
                x: slotX + 55 * size,
                y: slotY + 50 * size,
                size: 30 * size,
            });
        }
    }
}
