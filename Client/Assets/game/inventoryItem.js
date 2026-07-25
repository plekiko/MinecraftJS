import { runtime } from "../utils/runtime.js";
import { InventoryItem as SharedInventoryItem } from "@minecraftjs/shared/inventoryItem.js";
import { getItem } from "@minecraftjs/shared/item.js";
import { inventoryRegistry } from "@minecraftjs/shared/inventoryRegistry.js";
import { drawImage, drawRect, drawText } from "../utils/renderer.js";
import { getSpriteSize, getSpriteUrl } from "../utils/texturePackLoader.js";
import { getBlock } from "../world/block.js";

export class InventoryItem extends SharedInventoryItem {}

export class InventorySlot {
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
            ? "items/" + getItem(item.itemId).sprite
            : "blocks/" + getBlock(item.blockId).iconSprite;

        const spritePath = getSpriteUrl(path);
        const spriteSize = getSpriteSize(path);
        const actualWidth = spriteSize.width || 16;
        const actualHeight = spriteSize.height || 16;

        let cutoff = 0;
        if (item.blockId) cutoff = getBlock(item.blockId).defaultCutoff || 0;

        const drawHeight = actualHeight - cutoff * actualHeight;
        const moveDown = cutoff * actualHeight;

        const baseDrawSize = 48;
        const scaleX = (baseDrawSize / actualWidth) * size;
        const scaleY = (baseDrawSize / actualHeight) * drawHeight * size;

        const frameCount = Math.floor(actualHeight / actualWidth);

        const animationSpeed = 2;
        const frame = Math.floor(runtime.globalFrame / animationSpeed) % frameCount;

        const cropY = frame * actualWidth;
        const cropHeight = Math.min(actualWidth, actualHeight - cropY);

        const crop = {
            x: 0,
            y: moveDown + cropY,
            width: actualWidth,
            height: cropHeight,
        };

        drawImage({
            url: spritePath,
            x: slotX,
            y: slotY + moveDown * Math.min(scaleX, scaleY),
            scale: Math.min(scaleX, scaleY),
            centerX: false,
            dark: item.props.wall === true,
            fixAnimation: false,
            crop: crop,
        });

        if (item.hasProp?.("durability")) {
            const durability = item.getProp("durability");
            const itemDef = getItem(item.itemId);

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

inventoryRegistry.InventoryItem = InventoryItem;
