class InventoryItem {
    constructor({ blockId = null, itemId = null, count = 0 } = {}) {
        this.blockId = blockId;
        this.itemId = itemId;
        this.count = count;
    }
}
