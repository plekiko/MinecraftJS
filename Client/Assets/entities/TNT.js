class TNT extends Entity {
    constructor(world, { position } = {}) {
        // Get the sprite URL for TNT side
        const spritePath = "blocks/tnt_side";
        const sprite = getSpriteUrl(spritePath);

        // Get the sprite size (width and height)
        const spriteSize = getSpriteSize(spritePath);
        const spriteWidth = spriteSize.width;
        const spriteHeight = spriteSize.height;

        // Calculate the sprite scale based on the sprite size
        const spriteScale = BLOCK_SIZE / Math.max(spriteWidth, spriteHeight);

        // Call the superclass constructor with dynamically calculated sprite scale
        super(world, {
            name: "TNT",
            position: new Vector2(
                position.x + BLOCK_SIZE / 20,
                position.y + BLOCK_SIZE / 20,
            ),
            sprite: sprite,
            hitbox: new Vector2(
                BLOCK_SIZE - BLOCK_SIZE / 16,
                BLOCK_SIZE - BLOCK_SIZE / 16,
            ),
            spriteScale: spriteScale, // Dynamically calculated sprite scale
            canSwim: false,
            canBurn: false,
        });

        this.velocity.y = -4 * BLOCK_SIZE;

        this.fuse = 80;

        this.flashInterval = 10;
        this.flashCounter = 0;

        playPositionalSound(this.position, "tnt/fuse.ogg");
    }

    update() {
        this.updateEntity();
    }

    tickUpdate() {
        this.entityTickUpdate();

        this.playFuseEffect();

        this.fuse--;
        this.flashCounter--;
        if (this.fuse <= 0) {
            this.explode();
            removeEntity(this);
        }
    }

    hit() {}

    explode() {
        createExplosion(this.position, {
            excludeEntity: this,
        });
    }

    playFuseEffect() {
        if (this.flashCounter <= 0) {
            this.flashColor(this.fuse % 5 === 0 ? "white" : null, 0.1);
            this.flashCounter = this.flashInterval;
        }
    }

    dieEvent() {
        removeEntity(this);
    }
}
