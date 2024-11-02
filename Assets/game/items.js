const Items = Object.freeze({
    Stick: 0,
    WoodAxe: 1,
    StoneAxe: 2,
});

const items = [
    new Item({ itemId: 0, name: "Stick", sprite: "stick" }),
    new Item({
        itemId: 1,
        name: "Wood Axe",
        sprite: "wood_axe",
        toolType: ToolType.Axe,
        toolLevel: 1,
    }),
    new Item({
        itemId: 2,
        name: "Stone Axe",
        sprite: "stone_axe",
        toolType: ToolType.Axe,
        toolLevel: 2,
    }),
];

const itemMap = new Map(items.map((item) => [item.itemId, item]));
