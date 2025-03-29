import { Vector2 } from "./helper.js";

export class Player {
    constructor({ UUID, name, ws }) {
        this.UUID = UUID;
        this.name = name;
        this.ws = ws;

        this.lookDirection = new Vector2(0, 0);
    }
}
