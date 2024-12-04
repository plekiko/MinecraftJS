const EntityTypes = Object.freeze({
    Drop: 0,
    Player: 1,
    Entity: 2,
    Mob: 3,
});

class Entity {
    constructor({
        position = new Vector2(),
        rotation = new Vector2(),
        hitbox = new Vector2(1, 1),
        velocity = new Vector2(),
        targetVelocity = new Vector2(),
        acceleration = 90,
        maxVelocity = new Vector2(1000, 1000),
        noGravity = false,
        invulnerable = false,
        sprite = null,
        spriteScale = BLOCK_SIZE / 32,
        outline = 0,
        color = "black",
        drag = 40,
        bouncing = false,
        type = EntityTypes.Entity,
        stepSize = 1,
        footstepSounds = null,

        canSwim = true,

        offset = new Vector2(),

        float = false,

        forceDirection = false,

        fallDamage = false,

        body = null,

        direction = 1,

        holdItem = new InventoryItem(),
    }) {
        this.position = position;
        this.rotation = rotation;
        this.hitbox = hitbox;
        this.velocity = velocity;
        this.targetVelocity = targetVelocity;
        this.acceleration = acceleration;
        this.maxVelocity = maxVelocity;
        this.grounded = false;
        this.standingOnBlockType = null;
        this.noGravity = noGravity;

        this.fallDistance = 0;
        this.fallDamage = fallDamage;

        this.invulnerable = invulnerable;
        this.type = type;

        this.canSwim = canSwim;

        this.isGettingKnockback = false;
        this.knockBackBuffer = false;

        this.forceDirection = forceDirection;

        this.float = float;

        this.direction = direction;

        this.sprite = sprite;
        this.body = body;

        this.img = new Image();
        this.img.src = sprite ? sprite : "";

        this.spriteScale = spriteScale;
        this.outline = outline;
        this.color = color;
        this.originalColor = color;
        this.drag = drag;

        this.bouncing = bouncing;
        this.offset = offset;

        this.lookDirection = 0;

        this.swimming = false;

        this.originDate = Date.now();

        this.stepCounter = 0;
        this.stepSize = stepSize;
        this.footstepSounds = footstepSounds;

        this.holdItem = holdItem;

        this.shouldAddForce = { x: 0, y: 0 };

        this.hurtCooldown = 0.3;
    }

    rotateToPoint(targetPosition, objectPosition) {
        // Calculate the object's center point (if needed)
        const centerX = objectPosition.x;
        const centerY = objectPosition.y;

        // Calculate the difference in x and y positions between the target and object
        const dx = targetPosition.x - centerX;
        const dy = targetPosition.y - centerY;

        // Calculate the angle in radians and convert to degrees
        const angle = Math.atan2(dy, dx);
        const rotationInDegrees = (angle * 180) / Math.PI;

        return rotationInDegrees; // Return the calculated rotation in degrees
    }

    addForce(x = 0, y = 0) {
        if (
            this.filterBlocksByProperty(
                this.isCollidingWithBlockType(),
                "collision"
            ).length > 0
        ) {
            return;
        }

        this.shouldAddForce.x += x * BLOCK_SIZE;
        this.shouldAddForce.y += y * BLOCK_SIZE;
    }

    getBlockAtPosition(worldX, worldY) {
        worldX = Math.floor(worldX / BLOCK_SIZE) * BLOCK_SIZE;
        worldY = Math.floor(worldY / BLOCK_SIZE) * BLOCK_SIZE;
        return GetBlockAtWorldPosition(worldX, worldY, false);
    }

    isFluid(blockType) {
        return GetBlock(blockType).fluid;
    }

    checkDownCollision(futureY) {
        const blockBelowRight = this.getBlockAtPosition(
            this.position.x + this.hitbox.x,
            futureY + this.hitbox.y
        );
        const blockBelowLeft = this.getBlockAtPosition(
            this.position.x,
            futureY + this.hitbox.y
        );

        if (blockBelowLeft && this.isSolid(blockBelowLeft.blockType)) {
            return blockBelowLeft;
        }
        if (blockBelowRight && this.isSolid(blockBelowRight.blockType)) {
            return blockBelowRight;
        }

        return null;
    }

    checkLeftCollision(futureX) {
        const blockLeft = this.getBlockAtPosition(
            futureX,
            this.position.y + this.hitbox.y / 2
        );
        const blockLeftBottom = this.getBlockAtPosition(
            futureX,
            this.position.y + this.hitbox.y
        );
        const blockLeftTop = this.getBlockAtPosition(futureX, this.position.y);

        if (
            (blockLeft && this.isSolid(blockLeft.blockType)) ||
            (blockLeftBottom && this.isSolid(blockLeftBottom.blockType)) ||
            (blockLeftTop && this.isSolid(blockLeftTop.blockType))
        ) {
            return blockLeft;
        }
        return null;
    }

    checkRightCollision(futureX) {
        const blockRight = this.getBlockAtPosition(
            futureX + this.hitbox.x,
            this.position.y + this.hitbox.y / 2
        );
        const blockRightBottom = this.getBlockAtPosition(
            futureX + this.hitbox.x,
            this.position.y + this.hitbox.y
        );
        const blockRightTop = this.getBlockAtPosition(
            futureX + this.hitbox.x,
            this.position.y
        );

        if (
            (blockRight && this.isSolid(blockRight.blockType)) ||
            (blockRightBottom && this.isSolid(blockRightBottom.blockType)) ||
            (blockRightTop && this.isSolid(blockRightTop.blockType))
        ) {
            return blockRight;
        }
        return null;
    }

    checkUpCollision(futureY) {
        const blockUpRight = this.getBlockAtPosition(
            this.position.x + this.hitbox.x,
            futureY
        );
        const blockUpLeft = this.getBlockAtPosition(this.position.x, futureY);

        if (blockUpLeft && this.isSolid(blockUpLeft.blockType)) {
            return blockUpLeft;
        }
        if (blockUpRight && this.isSolid(blockUpRight.blockType)) {
            return blockUpRight;
        }

        return null;
    }

    knockBack(fromX, kb) {
        this.isGettingKnockback = true;
        this.addForce(
            fromX < this.position.x ? kb : -kb,
            this.grounded ? -kb : 0
        );
    }

    hurtCooldownLogic() {
        if (!this.hurtCooldown) return;
        this.hurtCooldown -= deltaTime;
        if (this.hurtCooldown <= 0) this.hurtCooldown = 0;
    }

    damage(damage) {
        if (this.hurtCooldown) return false;

        this.hurtCooldown = 0.3;

        this.flashColor();

        // Insert armor checks etc
        this.decreaseHealth(damage);

        return true;
    }

    forceDamage(damage) {
        this.flashColor();

        this.decreaseHealth(damage);
    }

    decreaseHealth(amount) {
        if (this.health === undefined) return;

        this.health -= amount;

        if (this.health <= 0) this.die();
    }

    die() {
        this.health = 0;
        this.dieEvent();
    }

    setOnGround() {
        const currentChunk = this.getCurrentChunk();
        if (!currentChunk) return;
        const groundLevel = currentChunk.findGroundLevel(this.getXInChunk());
        if (groundLevel === 0) return false;
        const y = (CHUNK_HEIGHT - groundLevel) * BLOCK_SIZE - this.hitbox.y - 1;

        this.position.y = y;
    }

    getXInChunk() {
        const chunkOriginX = this.getCurrentChunk().x;
        const relativeX = this.position.x - chunkOriginX;

        const xInChunk = Math.floor(relativeX / BLOCK_SIZE);

        return xInChunk;
    }

    flashColor(color = "red", duration = 0.05) {
        if (!this.body) {
            this.color = color;
            setTimeout(() => {
                this.color = this.originalColor;
            }, duration * 1000);
            return;
        }

        this.body.flashColor(color, duration);
    }

    getCurrentChunk() {
        const chunkPosition =
            Math.floor(this.position.x / (CHUNK_WIDTH * BLOCK_SIZE)) *
            CHUNK_WIDTH *
            BLOCK_SIZE;

        if (!chunks.has(chunkPosition)) return null;

        return chunks.get(chunkPosition);
    }

    isSolid(blockType) {
        if (GetBlock(blockType).fluid) return false;
        return GetBlock(blockType).collision;
    }

    updateEntity() {
        this.calculateGravity();
        this.updatePositionWithVelocity();
        this.bounceSprite();
        this.playFootstepSounds();
        this.hurtCooldownLogic();
        if (this.body) this.body.updateBody();
    }

    swing() {
        if (!this.body) return;

        this.body.swing();
    }

    bounceSprite() {
        this.offset.y = 0;

        if (!this.bouncing) return;
        if (!this.grounded) return;

        this.offset.y = Math.sin((Date.now() - this.originDate) / 120) * 1.5;
    }

    calculateGravity() {
        if (this.noGravity) return;
        this.velocity.y += GRAVITY * deltaTime;
    }

    calculateForce() {
        this.velocity.x += this.shouldAddForce.x;
        this.velocity.y += this.shouldAddForce.y;

        this.shouldAddForce = { x: 0, y: 0 };
    }

    handleTargetVelocity() {
        if (this.isGettingKnockback) return;

        if (this.targetVelocity.x === 0) return;

        if (this.velocity.x < this.targetVelocity.x) {
            this.velocity.x += this.acceleration * BLOCK_SIZE * deltaTime;

            // Clamp to avoid overshoot
            if (this.velocity.x > this.targetVelocity.x) {
                this.velocity.x = this.targetVelocity.x;
            }
        }

        if (this.velocity.x > this.targetVelocity.x) {
            this.velocity.x -= this.acceleration * BLOCK_SIZE * deltaTime;

            // Clamp to avoid overshoot
            if (this.velocity.x < this.targetVelocity.x) {
                this.velocity.x = this.targetVelocity.x;
            }
        }

        this.targetVelocity = new Vector2();
    }

    updatePositionWithVelocity() {
        this.handleTargetVelocity();

        const nextPositionX = this.position.x + this.velocity.x * deltaTime;
        const nextPositionY = this.position.y + this.velocity.y * deltaTime;

        this.applyDrag();
        this.clampHorizontalVelocity();

        const leftCollision = this.checkLeftCollision(nextPositionX);
        const rightCollision = this.checkRightCollision(nextPositionX);

        if (!this.forceDirection) this.direction = this.velocity.x < 0 ? -1 : 1;

        if (nextPositionX > this.position.x) {
            if (rightCollision) {
                this.velocity.x = 0;
            }
        }
        if (nextPositionX < this.position.x) {
            if (leftCollision) {
                this.velocity.x = 0;
            }
        }

        if (!this.grounded) {
            this.velocity.y += this.drag * deltaTime;
        }

        this.clampVerticalVelocity();

        const upCollision = this.checkUpCollision(nextPositionY);
        const downCollision = this.checkDownCollision(nextPositionY);

        const collidingBlocks = this.isCollidingWithBlockType();

        if (!upCollision) {
            if (downCollision) {
                this.standingOnBlockType = downCollision.blockType;
                this.ground();
            } else {
                this.grounded = false;
            }
        } else {
            this.velocity.y = 0;
        }

        this.fluidLogic(collidingBlocks, deltaTime);

        this.calculateForce();

        if (!this.grounded && !this.swimming)
            this.fallDistance += (this.velocity.y / BLOCK_SIZE) * deltaTime;
        else this.fallDistance = 0;

        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    ground() {
        this.velocity.y = 0;
        this.grounded = true;

        this.takeFallDamage();

        this.drag = GetBlock(this.standingOnBlockType).drag;
        if (this.knockBackBuffer) {
            this.isGettingKnockback = false;
            this.knockBackBuffer = false;
        }
        if (this.isGettingKnockback) this.knockBackBuffer = true;
    }

    takeFallDamage() {
        if (!this.fallDamage) return;

        if (this.fallDistance < 2) return;

        const damage = Math.round(this.fallDistance - 2);

        if (this.fallDistance < 4)
            playPositionalSound(this.position, "misc/fallsmall.ogg");
        else playPositionalSound(this.position, "misc/fallbig.ogg");

        this.hit(damage);
    }

    fluidLogic(collidingBlocks, deltaTime) {
        this.swimming = false;

        const isCollidingWithFluid =
            this.filterBlocksByProperty(collidingBlocks, "fluid").length > 0;

        if (isCollidingWithFluid && this.canSwim) {
            this.grounded = false;
            if (!this.swimming) {
                this.enterFluid();
            }

            if (this.float) this.floatLogic();
        }
    }

    floatLogic() {
        this.velocity.y += -GRAVITY * 2 * deltaTime;
    }

    playFootstepSounds() {
        if (!this.grounded || Math.abs(this.velocity.x) === 0) return;
        if (!this.standingOnBlockType) return;

        this.stepCounter += Math.abs(this.velocity.x / 100) * deltaTime;

        if (this.stepCounter >= this.stepSize) {
            if (!this.footstepSounds) {
                const block = GetBlock(this.standingOnBlockType);
                if (!block) return;
                this.playFootstepFromBlock(block);
                this.stepCounter -= this.stepSize;
                return;
            }

            PlayRandomSoundFromArray({
                array: this.footstepSounds,
                volume: 0.2,
                positional: true,
                range: 6,
                origin: this.position,
            });

            this.stepCounter -= this.stepSize;
        }
    }

    playFootstepFromBlock(block) {
        const sounds = block.breakingSound;
        if (!sounds) return;
        PlayRandomSoundFromArray({
            array: sounds,
            volume: 0.2,
            positional: true,
            range: 6,
            origin: this.position,
        });
    }

    isCollidingWithBlockType() {
        const collidingBlocks = [];

        // Define the range of grid coordinates covered by the entity's hitbox
        const startX = Math.floor(this.position.x / BLOCK_SIZE);
        const endX = Math.floor((this.position.x + this.hitbox.x) / BLOCK_SIZE);
        const startY = Math.floor(this.position.y / BLOCK_SIZE);
        const endY = Math.floor((this.position.y + this.hitbox.y) / BLOCK_SIZE);

        // Iterate over all grid cells covered by the entity's hitbox
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                // Get the block at the current grid position
                const block = GetBlockAtWorldPosition(
                    x * BLOCK_SIZE,
                    y * BLOCK_SIZE,
                    false
                );
                if (
                    block &&
                    block.blockType &&
                    GetBlock(block.blockType).collision
                ) {
                    collidingBlocks.push(block);
                }
            }
        }

        return collidingBlocks; // Return all colliding blocks
    }

    filterBlocksByProperty(blocks, property) {
        return blocks.filter((block) => {
            const blockData = GetBlock(block.blockType);
            return blockData && blockData[property];
        });
    }

    entityCollision(type = 0) {
        for (let other of entities) {
            if (other !== this) {
                if (
                    this.position.x < other.position.x + other.hitbox.x &&
                    this.position.x + this.hitbox.x > other.position.x &&
                    this.position.y < other.position.y + other.hitbox.y &&
                    this.position.y + this.hitbox.y > other.position.y
                ) {
                    if (other.type === type) return other;
                }
            }
        }
        return false;
    }

    enterFluid() {
        this.swimming = true;

        if (this.velocity.y > BLOCK_SIZE * 5) this.playWaterEnterSound();

        if (this.float && this.velocity.y > BLOCK_SIZE * 3) {
            this.velocity.y /= 1.1;
        }
    }

    playWaterEnterSound() {
        PlayRandomSoundFromArray({
            array: Sounds.Water_Enter,
            positional: true,
            origin: this.position,
        });
    }

    applyDrag() {
        if (this.targetVelocity.x !== 0) return;
        if (this.isGettingKnockback) return;
        // if (!this.grounded) return;
        if (this.velocity.x > 0) {
            this.velocity.x -=
                this.drag *
                100 *
                (this.type === EntityTypes.Player ? 1 : 0.2) *
                deltaTime;
            if (this.velocity.x < 0) this.velocity.x = 0;
        } else if (this.velocity.x < 0) {
            this.velocity.x +=
                this.drag *
                100 *
                (this.type === EntityTypes.Player ? 1 : 0.2) *
                deltaTime;
            if (this.velocity.x > 0) this.velocity.x = 0;
        }
    }

    clampHorizontalVelocity() {
        if (Math.abs(this.velocity.x) > this.maxVelocity.x) {
            this.velocity.x = Math.sign(this.velocity.x) * this.maxVelocity.x;
        }
    }

    clampVerticalVelocity() {
        if (Math.abs(this.velocity.y) > this.maxVelocity.y) {
            this.velocity.y = Math.sign(this.velocity.y) * this.maxVelocity.y;
        }
    }

    draw(ctx) {
        ctx.save();

        const centerX = this.position.x - camera.x + this.offset.x;
        const centerY = this.position.y - camera.y + this.offset.y;

        if (this.body) {
            this.body.updatePosition({
                x: centerX + this.hitbox.x / 4,
                y: centerY,
            });
            this.body.draw(
                ctx,
                this.velocity.x,
                this.direction,
                this.grounded,
                this.lookDirection,
                this.holdItem
            );
            ctx.restore();
            return;
        }

        ctx.translate(centerX, centerY);

        if (!this.sprite || this.sprite == "") {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(0, 0, this.hitbox.x, this.hitbox.y);
        }

        if (this.rotation) {
            ctx.rotate((this.rotation * Math.PI) / 180);
        }

        if (this.outline > 0) {
            ctx.fillStyle = "white";
            ctx.fillRect(
                -this.outline,
                -this.outline,
                this.hitbox.x + this.outline * 2,
                this.hitbox.y + this.outline * 2
            );
        }

        ctx.fillStyle = this.color;
        if (!this.sprite || this.sprite == "") {
            ctx.fillRect(0, 0, this.hitbox.x, this.hitbox.y);
        } else if (this.img) {
            const spriteWidth = this.img.width * this.spriteScale;
            const spriteHeight = this.img.height * this.spriteScale;

            const spriteOffsetX = (this.hitbox.x - spriteWidth) / 2;
            const spriteOffsetY = (this.hitbox.y - spriteHeight) / 2;

            ctx.drawImage(
                this.img,
                spriteOffsetX,
                spriteOffsetY,
                spriteWidth,
                spriteHeight
            );
        }

        ctx.restore();
    }

    drawHitbox(ctx) {
        ctx.save();

        const centerX = this.position.x - camera.x + this.offset.x;
        const centerY = this.position.y - camera.y + this.offset.y;

        ctx.translate(centerX, centerY);

        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 2;

        // Draw the hollow square
        ctx.strokeRect(0, 0, this.hitbox.x, this.hitbox.y);

        ctx.restore();
    }
}
