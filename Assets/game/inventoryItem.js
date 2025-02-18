class InventoryItem {
    constructor({ blockId = null, itemId = null, count = 0, props = {} } = {}) {
        this.blockId = blockId;
        this.itemId = itemId;
        this.count = count;
        this.props = props;
    }
}
