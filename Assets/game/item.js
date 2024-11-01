class Item {
    constructor({ itemId = 0, name = "New Item", sprite = "" }) {
        this.itemId = itemId;
        this.name = name;
        this.sprite = sprite;
    }
}

function GetItem(itemId) {
    return itemMap.has(itemId) ? itemMap.get(itemId) : 0;
}
