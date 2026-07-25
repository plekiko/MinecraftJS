export class Player {
    constructor({
        UUID,
        name,
        ws,
        skin = "player/steve",
        model = "steve",
        dimension = 0,
    }) {
        this.UUID = UUID;
        this.name = name;
        this.ws = ws;
        this.skin = skin;
        this.model = model === "alex" ? "alex" : "steve";
        this.dimension = dimension;

        this.position = { x: 0, y: 0 };
        this.gamemode = 0;
        this.health = 20;
        this.food = 20;
        this.inventory = [[]];
    }
}
