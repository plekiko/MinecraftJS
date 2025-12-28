class TNT extends Entity {
    constructor({ position } = {}) {
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
        super({
            name: "TNT",
            position: new Vector2(
                position.x + BLOCK_SIZE / 20,
                position.y + BLOCK_SIZE / 20
            ),
            sprite: sprite,
            hitbox: new Vector2(
                BLOCK_SIZE - BLOCK_SIZE / 16,
                BLOCK_SIZE - BLOCK_SIZE / 16
            ),
            spriteScale: spriteScale, // Dynamically calculated sprite scale
            canSwim: false,
            canBurn: false,
        });

        this.velocity.y = -4 * BLOCK_SIZE;

        this.fuse = 80;

        // Explosion properties
        this.explosionRadius = 4 * BLOCK_SIZE;
        this.explosionDamage = 15;
        this.explosionPower = 20;

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

    // Explosion logic: damage entities and destroy blocks in radius
    explode() {
        PlayRandomSoundFromArray({
            array: Sounds.Explosion,
            positional: true,
            origin: this.position,
        });

        // Damage nearby entities
        const entitiesInRange = this.getEntitiesInRadius(this.explosionRadius);
        entitiesInRange.forEach((entity) => {
            if (entity !== this && !entity.invulnerable) {
                const distance = Vector2.Distance(
                    this.position,
                    entity.position
                );
                const damage = this.calculateDamage(distance);
                if (typeof entity.hit === "function") entity.hit(damage);
                if (entity.type === EntityTypes.Drop) {
                    removeEntity(entity);
                    return;
                }
                // Apply knockback
                const knockbackForce = this.calculateKnockback(distance);
                const dx = entity.position.x - this.position.x;
                const dy = entity.position.y - this.position.y;
                const angle = Math.atan2(dy, dx);
                entity.knockBack(
                    this.position.x - this.hitbox.x / 2,
                    knockbackForce * Math.cos(angle)
                );
            }
        });

        // Destroy blocks in explosion radius
        this.destroyBlocksInRadius();
    }

    getEntitiesInRadius(radius) {
        const nearbyEntities = [];
        for (let entity of entities) {
            const distance = Vector2.Distance(this.position, entity.position);
            if (distance <= radius) {
                nearbyEntities.push(entity);
            }
        }
        return nearbyEntities;
    }

    calculateDamage(distance) {
        const maxDistance = this.explosionRadius;
        const damageFactor = 1 - distance / maxDistance;
        return Math.max(0, Math.round(this.explosionDamage * damageFactor));
    }

    calculateKnockback(distance) {
        const maxDistance = this.explosionRadius;
        const knockbackFactor = (1 - distance / maxDistance) / 5;
        return Math.max(0, this.explosionPower * BLOCK_SIZE * knockbackFactor);
    }

    destroyBlocksInRadius() {
        const startX = Math.floor(this.position.x / BLOCK_SIZE);
        const startY = Math.floor(this.position.y / BLOCK_SIZE);
        const maxPower = this.explosionPower; // Max explosion strength (e.g., 4)
        const maxRadius = Math.ceil(this.explosionRadius / BLOCK_SIZE); // Max distance in blocks

        // Set to track visited blocks (to avoid revisiting)
        const visited = new Set();
        // Queue for flood-fill: [x, y, remainingPower]
        const queue = [[startX, startY, maxPower]];

        while (queue.length > 0) {
            const [x, y, power] = queue.shift();

            // Convert block coordinates to world coordinates for distance check
            const worldX = x * BLOCK_SIZE;
            const worldY = y * BLOCK_SIZE;
            const distance = Math.sqrt(
                Math.pow(worldX - this.position.x, 2) +
                    Math.pow(worldY - this.position.y, 2)
            );

            // Skip if outside radius or power depleted
            if (distance > this.explosionRadius || power <= 0) continue;

            // Unique key for visited set
            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            visited.add(key);

            // Get block at current position
            const block = GetBlockAtWorldPosition(worldX, worldY);
            if (!block) continue;

            const blockDef = GetBlock(block.blockType);
            if (!blockDef) continue;

            // Calculate resistance (hardness) impact
            const resistance = blockDef.hardness || 0; // Default to 0 if undefined
            const powerThreshold = resistance + 1; // Minimum power needed to destroy (resistance + base cost)

            // Destroy block if remaining power exceeds the threshold
            if (power >= powerThreshold) {
                if (blockDef.hardness >= 0) {
                    if (blockDef.specialType === SpecialType.TNT) {
                        block.explode(true);
                    } else {
                        block.breakBlock(blockDef.dropWithoutTool);
                        setBlockType(block, Blocks.Air);
                    }
                }

                // Propagate to adjacent blocks with reduced power
                const reducedPower = power - 1 - resistance * 0.3; // Reduce power by distance and resistance
                if (reducedPower > 0) {
                    // Add adjacent blocks to queue (up, down, left, right)
                    queue.push([x, y - 1, reducedPower]); // Up
                    queue.push([x, y + 1, reducedPower]); // Down
                    queue.push([x - 1, y, reducedPower]); // Left
                    queue.push([x + 1, y, reducedPower]); // Right
                }
            }
        }
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
