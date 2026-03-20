class Snowball extends Projectile {
    constructor(
        world,
        {
            position = new Vector2(),
            velocity = new Vector2(15 * BLOCK_SIZE, -15 * BLOCK_SIZE),
        } = {},
    ) {
        super(world, {
            name: "Snowball",
            position: position,
            sprite: getSpriteUrl("items/snowball"),
            damage: 0,
            velocity: velocity,
            hitbox: new Vector2(BLOCK_SIZE / 3, BLOCK_SIZE / 3),
            scale: 2,
            drag: 0,
        });
    }

    tickUpdate() {
        this.entityTickUpdate();
    }

    dieEvent() {
        // Play particle effect
        const emitter = createParticleEmitter({
            x: this.position.x + this.hitbox.x / 2,
            y: this.position.y + this.hitbox.y / 2,
            radius: 1,
            scale: 20,
            type: PARTICLE.Smoke,
            maxParticles: 20,
            speed: 20,
            fadeOutTime: 500,
            color: Colors.White,
            randomScale: true,
            range: 10,
        });
        emitter.emitAndDie();

        playRandomSoundFromArray({
            array: Sounds.Break_Snow,
            volume: 0.5,
            range: 10,
            origin: this.position,
        });
        removeEntity(this);
    }
}
