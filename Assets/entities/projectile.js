class Projectile extends Entity {
    constructor({
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
    hit() {}
}
