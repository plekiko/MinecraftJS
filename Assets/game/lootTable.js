class LootItem {
    constructor({
        blockId = null,
        itemId = null,
        maxCount = 1,
        subtract = 0,
    } = {}) {
        this.blockId = blockId;
        this.itemId = itemId;
        this.maxCount = maxCount;
        this.subtract = subtract;
    }
}

class LootTable {
    constructor(items) {
        this.items = items;
    }

    getRandomLoot() {
        const loot = [];
        this.items.forEach((item) => {
            const count = RandomRange(
                item.maxCount - item.subtract,
                item.maxCount + 1
            );

            if (count > 0) {
                loot.push(
                    new InventoryItem({
                        blockId: item.blockId,
                        itemId: item.itemId,
                        count: count,
                    })
                );
            }
        });

        return loot;
    }
}
