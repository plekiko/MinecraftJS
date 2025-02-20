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

    dieEvent() {
        PlayRandomSoundFromArray({
            array: Sounds.Break_Snow,
            volume: 0.5,
            range: 10,
            origin: this.position,
        });
        removeEntity(this);
    }

    update() {
        this.updateEntity();

        const other = this.entityCollision(EntityTypes.Mob);

        if (other) {
            if (this.damage > 0) other.hit(this.damage);
            this.dieEvent();
        }

        if (this.wasColliding) {
            this.dieEvent();
        }
    }
}
