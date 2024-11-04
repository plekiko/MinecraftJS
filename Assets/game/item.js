class Item {
    constructor({
        itemId = 0,
        name = "New Item",
        sprite = "",
        stackSize = 64,
        toolType = ToolType.Nothing,
        toolLevel = 0,
        heldInHand = false,
        baseDamage = 0,
    }) {
        this.itemId = itemId;
        this.name = name;
        this.sprite = sprite;

        this.toolType = toolType;
        this.toolLevel = toolLevel;

        this.baseDamage = baseDamage;

        this.stackSize = stackSize;

        this.heldInHand = heldInHand;
    }
}

function GetItem(itemId) {
    return itemMap.has(itemId) ? itemMap.get(itemId) : 0;
}
