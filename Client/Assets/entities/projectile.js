class Projectile extends Entity {
    constructor({
        name = "Projectile",
        position,
        sprite,
        scale = 1,
        velocity = new Vector2(),
        drag = 40,
        damage = 1,
        hitbox = new Vector2(BLOCK_SIZE, BLOCK_SIZE),
        props = {},
    }) {
        super({
            name: "Projectile",
            position: position,
            hitbox: hitbox,
            sprite: sprite,
            spriteScale: scale,
            type: EntityTypes.Projectile,
            drag: drag,
            velocity: velocity,
            ...props,
        });
        this.damage = damage;
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

    hit() {}
}
