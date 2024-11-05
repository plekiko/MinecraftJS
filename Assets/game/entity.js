const EntityTypes = Object.freeze({
    Drop: 0,
    Player: 1,
    Entity: 2,
});

class Entity {
    constructor({
        position = new Vector2(),
        rotation = new Vector2(),
        hitbox = new Vector2(1, 1),
        velocity = new Vector2(),
        maxVelocity = new Vector2(1000, 1000),
        noGravity = false,
        invulnerable = false,
        sprite = null,
        spriteScale = BLOCK_SIZE / 32,
        outline = 0,
        color = "black",
        drag = 3,
        bouncing = false,
        type = EntityTypes.Entity,

        body = null,

        holdItem = new InventoryItem(),
    }) {
        this.position = position;
        this.rotation = rotation;
        this.hitbox = hitbox;
        this.velocity = velocity;
        this.maxVelocity = maxVelocity;
        this.grounded = false;
        this.noGravity = noGravity;
        this.fallDistance = 0;
        this.invulnerable = invulnerable;
        this.type = type;

        this.sprite = sprite;
        this.body = body;

        this.img = new Image();
        this.img.src = sprite ? sprite : "";

        this.spriteScale = spriteScale;
        this.outline = outline;
        this.color = color;
        this.drag = drag;

        this.bouncing = bouncing;
        this.offset = new Vector2();

        this.lookDirection = 0;

        this.swimming = false;

        this.originDate = Date.now();

        this.holdItem = holdItem;
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

        if (
            blockBelowLeft &&
            this.isFluid(blockBelowLeft.blockType) &&
            blockBelowRight &&
            this.isFluid(blockBelowRight.blockType)
        ) {
            return "fluid";
        }

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

    isSolid(blockType) {
        if (GetBlock(blockType).fluid) return false;
        return GetBlock(blockType).collision;
    }

    updateEntity(deltaTime) {
        this.calculateGravity(deltaTime);
        this.updatePositionWithVelocity(deltaTime);
        this.bounceSprite(deltaTime);
    }

    bounceSprite(deltaTime) {
        this.offset.y = 0;

        if (!this.bouncing) return;
        if (!this.grounded) return;

        this.offset.y = Math.sin((Date.now() - this.originDate) / 120) * 1.5;
    }

    calculateGravity(deltaTime) {
        if (this.noGravity) return;
        this.velocity.y += GRAVITY * deltaTime;
    }

    updatePositionWithVelocity(deltaTime) {
        const nextPositionX = this.position.x + this.velocity.x * deltaTime;
        const nextPositionY = this.position.y + this.velocity.y * deltaTime;

        this.applyDrag(deltaTime);
        this.clampHorizontalVelocity();

        const leftCollision = this.checkLeftCollision(nextPositionX);
        const rightCollision = this.checkRightCollision(nextPositionX);

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

        this.swimming = false;

        if (!upCollision) {
            if (downCollision && downCollision !== "fluid") {
                this.velocity.y = 0;
                this.grounded = true;
            } else {
                if (downCollision && downCollision === "fluid") {
                    if (!this.swimming) {
                        this.enterFluid();
                    }
                }
            }
        } else {
            this.velocity.y = 0;
        }

        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    entityCollision() {
        for (let other of entities) {
            if (other !== this) {
                if (
                    this.position.x < other.position.x + other.hitbox.x &&
                    this.position.x + this.hitbox.x > other.position.x &&
                    this.position.y < other.position.y + other.hitbox.y &&
                    this.position.y + this.hitbox.y > other.position.y
                ) {
                    return other;
                }
            }
        }
        return false;
    }

    enterFluid() {
        this.swimming = true;
    }

    applyDrag(deltaTime) {
        if (this.velocity.x > 0) {
            this.velocity.x -= this.drag * deltaTime;
            if (this.velocity.x < 0) this.velocity.x = 0;
        } else if (this.velocity.x < 0) {
            this.velocity.x += this.drag * deltaTime;
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

    draw(ctx, camera) {
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
                this.grounded,
                this.lookDirection,
                this.holdItem
            );
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
        if (!this.sprite || this.sprite == "")
            ctx.fillRect(0, 0, this.hitbox.x, this.hitbox.y);

        if (this.img) {
            ctx.drawImage(
                this.img,
                0,
                0,
                this.img.width * this.spriteScale,
                this.img.height * this.spriteScale
            );
        }

        ctx.restore();
    }
}
