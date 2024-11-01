class Inventory {
    constructor() {
        this.items = Array.from({ length: 4 }, () =>
            Array.from({ length: 9 }, () => new InventoryItem())
        );

        this.selectedBlock = null;
        this.selectedItem = null;
        this.currentSlot = 0;

        this.inventoryUI = { x: 0, y: 0 };
        this.lastHoveredSlot = { x: null, y: null };

        this.hoverItem = null;

        this.holdingItem = null;
    }

    // Helper method to check if a slot is hovered over
    isSlotHovered(x, y) {
        const slotX = this.inventoryUI.x + 32 + x * 63;
        const slotY = y !== 3 ? this.inventoryUI.y + 298 + y * 63 : 651;
        return this.mouseOverPosition(slotX, slotY, 16 * 3, 16 * 3);
    }

    // Logic for right-click item spreading
    handleRightClickSpread(item, x, y) {
        if (
            input.isRightMouseDown() &&
            (this.lastHoveredSlot.x !== x || this.lastHoveredSlot.y !== y)
        ) {
            this.rightClickMovingLogic(item);
            this.lastHoveredSlot = { x, y };
        }
    }

    // Logic for picking up half the item stack
    handleRightClickGetHalf(item, x, y) {
        if (
            input.isRightMouseDown() &&
            !this.holdingItem &&
            (item.blockId || item.itemId)
        ) {
            this.getHalf(item, x, y);
            return true;
        }
        return false;
    }

    // Logic for picking up or moving items
    handleLeftClickItemInteraction(item, x, y) {
        if (input.isLeftMouseButtonPressed()) {
            if (this.holdingItem) {
                this.movingLogic(item);
            } else if (item.count > 0 && (item.blockId || item.itemId)) {
                this.holdingItem = structuredClone(item);
                this.removeItem(y, x, item.count);
            }
        }
    }

    removeItem(y, x, count = 1) {
        const item = this.items[y] && this.items[y][x];
        if (!item) return;

        item.count -= count;
        if (item.count <= 0) this.clearItem(item);
    }

    clearItem(item) {
        item.blockId = null;
        item.itemId = null;
        item.count = 0;
    }

    addItem(newItem) {
        let remainingCount = newItem.count;

        remainingCount = this.addToExistingStack(newItem, remainingCount);
        return this.addToEmptySlot(newItem, remainingCount);
    }

    addToExistingStack(newItem, remainingCount) {
        for (let row of this.items) {
            for (let item of row) {
                if (item.blockId === newItem.blockId && item.count < 64) {
                    const availableSpace = 64 - item.count;
                    const toAdd = Math.min(remainingCount, availableSpace);
                    item.count += toAdd;
                    remainingCount -= toAdd;

                    if (remainingCount === 0) return 0;
                }
            }
        }
        return remainingCount;
    }

    addToEmptySlot(newItem, remainingCount) {
        if (remainingCount === 0) return 0;

        for (let row of this.items) {
            for (let item of row) {
                if (item.blockId === null) {
                    item.blockId = newItem.blockId;
                    item.itemId = newItem.itemId;
                    item.count = remainingCount;
                    return 0;
                }
            }
        }

        return remainingCount;
    }

    update(deltaTime) {
        this.mouseHoverOverSlotsLogic();
        if (!input.isRightMouseDown()) this.resetLastHoveredSlot();
    }

    resetLastHoveredSlot() {
        this.lastHoveredSlot = { x: null, y: null };
    }

    mouseHoverOverSlotsLogic() {
        this.hoverItem = null;

        for (let y = 0; y < this.items.length; y++) {
            for (let x = 0; x < this.items[y].length; x++) {
                if (this.isSlotHovered(x, y)) {
                    this.mouseOverSlot(x, y);
                    break;
                }
            }
        }
    }

    mouseOverSlot(x, y) {
        const item = this.items[y][x];

        this.hoverItem = item;

        this.handleRightClickSpread(item, x, y);

        if (this.handleRightClickGetHalf(item, x, y)) return;

        this.handleLeftClickItemInteraction(item, x, y);
    }

    getHalf(item, x, y) {
        this.holdingItem = structuredClone(item);
        const half = Math.round(item.count / 2);
        this.holdingItem.count = half;
        this.removeItem(y, x, half);
    }

    rightClickMovingLogic(item) {
        if (
            this.holdingItem &&
            this.holdingItem.count > 0 &&
            item.count < 64 &&
            ((item.blockId === null && item.itemId === null) ||
                (item.blockId === this.holdingItem.blockId &&
                    item.itemId === this.holdingItem.itemId))
        ) {
            item.count += 1;
            this.holdingItem.count -= 1;

            if (item.count === 1) {
                item.blockId = this.holdingItem.blockId;
                item.itemId = this.holdingItem.itemId;
            }

            if (this.holdingItem.count === 0) {
                this.holdingItem = null;
            }
        }
    }

    movingLogic(item) {
        if (item.count <= 0 || (!item.blockId && !item.itemId)) {
            item.count = this.holdingItem.count;

            if (this.holdingItem.blockId)
                item.blockId = this.holdingItem.blockId;
            else if (this.holdingItem.itemId)
                item.itemId = this.holdingItem.itemId;

            this.holdingItem = null;
            return;
        }

        if (
            item.blockId !== this.holdingItem.blockId ||
            item.itemId !== this.holdingItem.itemId
        ) {
            const oldItem = structuredClone(item);
            item.blockId = this.holdingItem.blockId;
            item.itemId = this.holdingItem.itemId;
            item.count = this.holdingItem.count;
            this.holdingItem = oldItem;
            return;
        }

        if (
            item.blockId === this.holdingItem.blockId &&
            item.itemId === this.holdingItem.itemId
        ) {
            const maxStackSize = 64;
            const totalCount = item.count + this.holdingItem.count;

            item.count = Math.min(totalCount, maxStackSize);
            this.holdingItem.count =
                totalCount > maxStackSize ? totalCount - maxStackSize : 0;

            if (this.holdingItem.count === 0) {
                this.holdingItem = null;
            }
        }
    }

    mouseOverPosition(x, y, sizeX, sizeY) {
        const mousePos = input.getMousePosition();
        return (
            mousePos.x >= x &&
            mousePos.x <= x + sizeX &&
            mousePos.y >= y &&
            mousePos.y <= y + sizeY
        );
    }
}

class InventoryItem {
    constructor({ blockId = null, count = 0 } = {}) {
        this.blockId = blockId;
        this.itemId = null;
        this.count = count;
    }
}
