const Items = Object.freeze({
    Stick: 0,
});

const items = [new Item({ itemId: 0, name: "Stick", sprite: "stick" })];

const itemMap = new Map(items.map((item) => [item.itemId, item]));
