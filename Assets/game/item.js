class Item {
    constructor({
        itemId = 0,
        name = "New Item",
        sprite = "",
        stackable = true,
        toolType = ToolType.Nothing,
        toolLevel = 0,
    }) {
        this.itemId = itemId;
        this.name = name;
        this.sprite = sprite;

        this.toolType = toolType;
        this.toolLevel = toolLevel;

        this.stackable = stackable;
    }
}

function GetItem(itemId) {
    return itemMap.has(itemId) ? itemMap.get(itemId) : 0;
}
