class Snowball extends Projectile {
    constructor({
        position,
        velocity = new Vector2(15 * BLOCK_SIZE, -15 * BLOCK_SIZE),
    }) {
        super({
            position: position,
            sprite: "Assets/sprites/items/snowball.png",
            damage: 0,
            velocity: velocity,
            hitbox: new Vector2(BLOCK_SIZE / 2, BLOCK_SIZE / 2),
            scale: 2,
            drag: 0,
        });
    }

    tickUpdate() {
        this.entityTickUpdate();
    }

    dieEvent() {
        PlayRandomSoundFromArray({
            array: Sounds.Break_Snow,
            volume: 0.5,
            range: 10,
            origin: this.position,
        });
        removeEntity(this);
    }
}
