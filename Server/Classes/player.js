export class Player {
    constructor({ UUID, name, ws, skin = "steve", dimension = 0 }) {
        this.UUID = UUID;
        this.name = name;
        this.ws = ws;
        this.skin = skin;
        this.dimension = dimension;
    }
}
