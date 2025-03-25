class Body {
    constructor({
        position = { x: 0, y: 0 },
        parts = [],
        flipCorrection = 0,
        sprite = "",
    }) {
        this.position = position;
        this.flipCorrection = flipCorrection;
        this.parts = parts;
        this.opacity = 1;

        this.flashingColor = null;

        this.brightness = 1;

        this.image = new Image();
        this.image.src = getSpriteUrl("entity/" + sprite);
    }

    updatePosition(newPosition) {
        this.position = newPosition;
        for (const partName in this.parts) {
            const part = this.parts[partName];

            // Apply position offset from body position

            // POTENTIAL FIX FOR BLOCK SCALING
            part.position = {
                x: newPosition.x + part.offset.x,
                y: newPosition.y + part.offset.y,
            };
        }
    }

    updateBody() {
        for (const partName in this.parts) {
            const part = this.parts[partName];
            if (part.mainArm) part.updateSwing();
        }
    }

    flashColor(color, duration) {
        this.flashingColor = color;
        setTimeout(() => {
            this.flashingColor = null;
        }, duration * 1000);
    }

    draw(ctx, speed, direction, grounded, lookDirection, holdItem) {
        const sortedParts = Object.values(this.parts).sort(
            (a, b) => a.zIndex - b.zIndex
        );

        ctx.globalAlpha = this.opacity;

        for (const part of sortedParts) {
            part.position = {
                x:
                    this.position.x +
                    (direction < 0
                        ? this.flipCorrection * (BLOCK_SIZE / 64)
                        : 0),
                y: this.position.y,
            };
            part.draw(
                ctx,
                speed,
                direction,
                grounded,
                lookDirection,
                holdItem,
                this.flashingColor,
                this.brightness,
                this.image
            );
        }

        ctx.globalAlpha = 1;
    }

    swing() {
        for (const partName in this.parts) {
            const part = this.parts[partName];

            if (!part.mainArm) continue;

            part.swing();

            return;
        }
    }
}

class BodyPart {
    constructor({
        spriteCrop = { x: 0, y: 0, width: 16, height: 16 },
        spriteRotation = 0,
        ownSpriteMap = "",

        position,
        offset = { x: 0, y: 0 },
        zIndex = 0,
        rotationOrigin = { x: 0, y: 0 },
        flipOrigin = { x: 0, y: 0 },
        eyes = false,
        sways = false,
        rotation = 0,
        swaySpeed = 90,
        swayIntensity = 1,
        maxSwayAngle = 90,
        mainArm = false,
        holdOrigin = { x: 0, y: 0 },
        flip = false,
    }) {
        this.spriteCrop = spriteCrop;
        this.spriteRotation = spriteRotation;
        this.ownSpriteMap = ownSpriteMap;

        this.position = position;
        this.offset = offset;
        this.zIndex = zIndex;

        this.flip = flip;
        this.flipOrigin = {
            x: flipOrigin.x * (BLOCK_SIZE / 64),
            y: flipOrigin.y * (BLOCK_SIZE / 64),
        };

        this.rotationOrigin = {
            x: rotationOrigin.x * (BLOCK_SIZE / 64),
            y: rotationOrigin.y * (BLOCK_SIZE / 64),
        };

        this.eyes = eyes;
        this.sways = sways;
        this.rotation = rotation;

        this.swaySpeed = swaySpeed;
        this.swayIntensity = swayIntensity;
        this.maxSwayAngle = maxSwayAngle;

        this.direction = -1;

        this.mainArm = mainArm;
        this.holdOrigin = holdOrigin;

        this.isSwinging = false;
        this.swingProgress = 0;
        this.swingSpeed = 10;
        this.swingAmplitude = 50;
    }
    getSwayRotation(speed, grounded) {
        const oscillation = Math.sin(
            Date.now() / (grounded ? this.swaySpeed : this.swaySpeed * 5)
        );
        const effectiveSwayAngle = Math.abs(speed / 1000) * this.maxSwayAngle;
        const output =
            oscillation *
            Math.min(effectiveSwayAngle, this.maxSwayAngle) *
            Math.sign(speed);
        return output * this.swayIntensity;
    }

    draw(
        ctx,
        speed,
        direction,
        grounded,
        lookDirection,
        holdItem,
        flashingColor,
        brightness = 1,
        image
    ) {
        const img = this.loadSprite(image);

        ctx.save();
        ctx.filter = `brightness(${brightness})`;

        // Step 1: Translate to the initial position
        this.applyTranslation(ctx);

        // Step 2: Apply flip and dynamic rotation
        const finalRotation = this.calculateFinalRotation(
            speed,
            grounded,
            lookDirection
        );
        let shouldFlip = lookDirection < -90 || lookDirection > 90;
        if (this.flip && direction < 0) {
            shouldFlip = true;
        }

        this.direction = shouldFlip ? -1 : 1;

        this.applyRotationAndFlip(ctx, finalRotation, shouldFlip);

        // Step 3: Apply spriteRotation around the rotation origin
        ctx.translate(this.rotationOrigin.x, this.rotationOrigin.y);
        ctx.rotate((this.spriteRotation * Math.PI) / 180);
        ctx.translate(-this.rotationOrigin.x, -this.rotationOrigin.y);

        // Render held item and sprite
        this.renderHeldItem(ctx, holdItem, this.direction);

        // Calculate scaled size based on spriteCrop
        const scaleFactor = BLOCK_SIZE / 16;
        const destWidth = this.spriteCrop.width * scaleFactor;
        const destHeight = this.spriteCrop.height * scaleFactor;

        // Draw the cropped image
        ctx.drawImage(
            img,
            this.spriteCrop.x, // sx: Source X
            this.spriteCrop.y, // sy: Source Y
            this.spriteCrop.width, // sWidth: Source width
            this.spriteCrop.height, // sHeight: Source height
            -destWidth / (scaleFactor * 2), // dx: Destination X (centered)
            -destHeight / (scaleFactor * 2), // dy: Destination Y (centered)
            destWidth, // dWidth: Destination width
            destHeight // dHeight: Destination height
        );

        // Draw dark overlay
        if (this.zIndex < 0) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = "black";
            ctx.fillRect(
                -destWidth / (scaleFactor * 2),
                -destHeight / (scaleFactor * 2),
                destWidth,
                destHeight
            );
        }

        // Draw flashing color aligned with the cropped image
        if (flashingColor) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = flashingColor;
            ctx.fillRect(
                -destWidth / (scaleFactor * 2),
                -destHeight / (scaleFactor * 2),
                destWidth,
                destHeight
            );
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    swing() {
        this.isSwinging = true;
        this.swingProgress = 0;
    }

    updateSwing() {
        if (!this.isSwinging) return;

        this.swingProgress += this.swingSpeed * deltaTime;

        let angle =
            Math.sin(this.swingProgress * Math.PI) * this.swingAmplitude;

        angle *= -this.direction;

        this.rotation = angle;

        if (this.swingProgress >= 1) {
            this.isSwinging = false;
            this.rotation = 0;
        }
    }

    calculateFinalRotation(speed, grounded, lookDirection) {
        let finalRotation = this.rotation;
        if (this.sways) {
            const swayRotation =
                this.getSwayRotation(speed, grounded) *
                (this.zIndex < 0 ? -1 : 1);
            finalRotation += swayRotation;
        }
        if (this.eyes) {
            finalRotation += lookDirection;
        }

        return finalRotation;
    }

    applyRotationAndFlip(ctx, finalRotation, shouldFlip) {
        const willFlip = shouldFlip && (this.eyes || this.flip);

        if (willFlip) {
            ctx.scale(this.eyes ? -1 : 1, this.flip ? -1 : 1);
            finalRotation = 180 - finalRotation;
        }

        ctx.rotate((finalRotation * Math.PI) / 180);

        const origin =
            this.flip && shouldFlip ? this.flipOrigin : this.rotationOrigin;

        ctx.translate(-origin.x, -origin.y); // Use precomputed origin
    }

    loadSprite(image) {
        let img = image;

        if (this.ownSpriteMap) {
            img = new Image();
            img.src = getSpriteUrl("entity/" + this.ownSpriteMap);
        }

        return img;
    }

    applyTranslation(ctx) {
        ctx.translate(
            this.position.x + BLOCK_SIZE * (this.offset.x / 64),
            this.position.y + BLOCK_SIZE * (this.offset.y / 64)
        );
        ctx.translate(this.rotationOrigin.x, this.rotationOrigin.y); // Use precomputed origin
    }

    renderHeldItem(ctx, holdItem, direction) {
        if (!this.mainArm || !holdItem) return;

        const sprite = this.getHeldItemSprite(holdItem);
        const isTool = this.isTool(holdItem);

        if (!sprite) return;

        ctx.save();

        ctx.translate(this.holdOrigin.x, this.holdOrigin.y);

        ctx.scale(!isTool ? direction : -direction, 1);

        ctx.translate(!isTool ? 10 : -20, 0);

        const rotationAngle = Math.PI / (isTool ? -1.35 : 2);
        ctx.rotate(rotationAngle);

        const scale = isTool ? 0.8 : 0.5;

        let cutoff = 0;
        // If it is a block, get the default draw cutoff
        if (holdItem.blockId) {
            cutoff = GetBlock(holdItem.blockId).defaultCutoff;
        }

        drawImage({
            url: sprite,
            x: (-16 * scale * (BLOCK_SIZE / 16)) / 2,
            y: (-16 * scale * (BLOCK_SIZE / 16)) / 2,
            scale: (BLOCK_SIZE / 16) * scale,
            centerX: false,
            sizeY: 16 - cutoff * 16,
        });

        ctx.restore();
    }

    isTool(item) {
        if (item.itemId) {
            if (GetItem(item.itemId).toolType != ToolType.Nothing) return true;
        }
        return false;
    }

    getHeldItemSprite(holdItem) {
        if (holdItem.blockId) {
            return getSpriteUrl(
                "blocks/" + GetBlock(holdItem.blockId).iconSprite
            );
        }
        if (holdItem.itemId != null) {
            return getSpriteUrl("items/" + GetItem(holdItem.itemId).sprite);
        }
        return null;
    }
}
