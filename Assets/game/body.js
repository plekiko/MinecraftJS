class Body {
    constructor({ position = { x: 0, y: 0 }, parts = [], flipCorrection = 0 }) {
        this.position = position;
        this.flipCorrection = flipCorrection;
        this.parts = parts;
        this.opacity = 1;

        this.flashingColor = null;

        this.brightness = 1;
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
                this.brightness
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
        sprite,
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
        this.sprite = sprite;
        this.position = position;
        this.offset = offset;
        this.zIndex = zIndex;

        this.flip = flip;
        this.flipOrigin = {
            x: flipOrigin.x * (BLOCK_SIZE / 64),
            y: flipOrigin.y * (BLOCK_SIZE / 64),
        };

        // Precompute and store the scaled rotation origin
        this.rotationOrigin = {
            x: rotationOrigin.x * (BLOCK_SIZE / 64),
            y: rotationOrigin.y * (BLOCK_SIZE / 64),
        };

        this.eyes = eyes;
        this.sways = sways;
        this.rotation = rotation;

        // Sway properties
        this.swaySpeed = swaySpeed;
        this.swayIntensity = swayIntensity;
        this.maxSwayAngle = maxSwayAngle;

        this.direction = -1;

        this.mainArm = mainArm;
        this.holdOrigin = holdOrigin;

        // Swing properties
        this.isSwinging = false;
        this.swingProgress = 0;
        this.swingSpeed = 10; // Speed of the swing (adjust as needed)
        this.swingAmplitude = 50; // Maximum swing rotation in degrees
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
        brightness = 1
    ) {
        const img = this.loadSprite();

        ctx.save();

        ctx.filter = `brightness(${brightness})`;

        this.applyTranslation(ctx);

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
        this.renderHeldItem(ctx, holdItem, this.direction);

        ctx.drawImage(
            img,
            -img.width / 2,
            -img.height / 2,
            img.width * (BLOCK_SIZE / 16),
            img.height * (BLOCK_SIZE / 16)
        );

        // Draw flashing color
        if (flashingColor) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = flashingColor;

            ctx.fillRect(
                -img.width / 2,
                -img.height / 2,
                img.width * (BLOCK_SIZE / 16),
                img.height * (BLOCK_SIZE / 16)
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

    loadSprite() {
        const img = new Image();
        img.src = getSpriteUrl(this.sprite);
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

const playerBody = {
    head: new BodyPart({
        sprite: "entities/player/head",
        offset: { x: -6, y: 0 },
        rotationOrigin: { x: 12, y: 32 },
        zIndex: 1,
        eyes: true,
    }),
    torso: new BodyPart({
        sprite: "entities/player/torso",
        offset: { x: 0, y: 34 },
    }),
    leftArm: new BodyPart({
        sprite: "entities/player/left-arm",
        offset: { x: 0, y: 34 },
        zIndex: 2,
        rotationOrigin: { x: 4, y: 4 },
        sways: true,
        mainArm: true,
        holdOrigin: { x: 6, y: 35 },
    }),
    rightArm: new BodyPart({
        sprite: "entities/player/right-arm",
        offset: { x: 0, y: 34 },
        rotationOrigin: { x: 4, y: 4 },
        zIndex: -2,
        sways: true,
    }),
    leftLeg: new BodyPart({
        sprite: "entities/player/left-leg",
        offset: { x: 0, y: 74 },
        rotationOrigin: { x: 4, y: 0 },
        zIndex: 1,
        sways: true,
    }),
    rightLeg: new BodyPart({
        sprite: "entities/player/right-leg",
        offset: { x: 0, y: 74 },
        rotationOrigin: { x: 4, y: 0 },
        zIndex: -1,
        sways: true,
    }),
};
