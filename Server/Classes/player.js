import { Vector2 } from "./helper.js";

export class Player {
    constructor({ UUID, name, ws, skin = "steve" }) {
        this.UUID = UUID;
        this.name = name;
        this.ws = ws;
        this.skin = skin;
    }
}
