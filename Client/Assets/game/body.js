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
        this.setSprite(sprite);

        this.sprite = sprite;

        this.initParts();
    }

    setSprite(sprite) {
        this.sprite = sprite;

        this.image.src = getSpriteUrl(
            "entity/" + sprite,
            isEqualToOriginal("entity/" + sprite)
        );
    }

    initParts() {
        // Set the id's of the parts
        for (const partName in this.parts) {
            this.parts[partName].id = partName;
        }
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

    updateBody(speed, grounded, lookDirection) {
        for (const partName in this.parts) {
            const part = this.parts[partName];

            if (part.sways) {
                part.rotation = part.getSwayRotation(speed, grounded);
            }

            if (part.mainArm) {
                part.updateDirection(lookDirection);
                part.updateSwing();
            }

            if (part.eyes) {
                // Adjust the look direction based on the body and direction
                let adjustedLookDirection = lookDirection;

                // Adjust for flipping logic based on body direction or eyes flip
                if (part.flip || lookDirection < -90 || lookDirection > 90) {
                    adjustedLookDirection = 180 + lookDirection;
                }

                // Normalize adjustedLookDirection to range [-180, 180]
                if (adjustedLookDirection > 180) {
                    adjustedLookDirection -= 360; // Adjust to wrap around
                } else if (adjustedLookDirection < -180) {
                    adjustedLookDirection += 360; // Adjust to wrap around
                }

                // Clamp the adjustedLookDirection to be between -90 and 90 degrees
                let targetRotation = Math.max(
                    -90,
                    Math.min(90, adjustedLookDirection)
                );

                // Smoothly interpolate between current rotation and the adjusted look direction
                const rotationSpeed = 1000 * deltaTime; // You can adjust this speed to make it smoother or faster

                // Update the rotation towards the target rotation
                part.rotation +=
                    Math.sign(targetRotation - part.rotation) * rotationSpeed;

                // When it's close enough to the target rotation, lock it in
                if (Math.abs(targetRotation - part.rotation) < rotationSpeed) {
                    part.rotation = targetRotation;
                }
            }
        }
    }

    flashColor(color, duration) {
        this.flashingColor = color;
        setTimeout(() => {
            this.flashingColor = null;
        }, duration * 1000);
    }

    draw(ctx, direction, lookDirection, holdItem) {
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
                lookDirection,
                holdItem,
                this.flashingColor,
                this.brightness,
                this.image,
                direction
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
        id = 0,

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
        this.id = id;
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
        lookDirection,
        holdItem,
        flashingColor,
        brightness = 1,
        image,
        direction
    ) {
        const img = this.loadSprite(image);

        ctx.save();
        ctx.filter = `brightness(${brightness})`;

        // Step 1: Translate to the initial position
        this.applyTranslation(ctx);

        // Step 2: Apply flip
        let shouldFlip = false;
        // Use exact same flipping logic as before
        if (this.eyes) {
            shouldFlip = lookDirection < -90 || lookDirection > 90;
        } else {
            shouldFlip = direction < 0;
        }

        const finalRotation = this.rotation;

        // Apply the rotation and flipping
        this.applyRotationAndFlip(ctx, finalRotation, shouldFlip);

        // Step 3: Apply spriteRotation around the rotation origin
        ctx.translate(this.rotationOrigin.x, this.rotationOrigin.y);
        ctx.rotate((this.spriteRotation * Math.PI) / 180);
        ctx.translate(-this.rotationOrigin.x, -this.rotationOrigin.y);

        // Render held item and sprite
        this.renderHeldItem(ctx, holdItem, this.direction);

        const spriteSize = getSpriteSize(this.ownSpriteMap || this.sprite);
        const baseSize = spriteSize.width || 16;
        const scaleFactor = BLOCK_SIZE / baseSize;
        const destWidth = this.spriteCrop.width * scaleFactor;
        const destHeight = this.spriteCrop.height * scaleFactor;

        ctx.drawImage(
            img,
            this.spriteCrop.x,
            this.spriteCrop.y,
            this.spriteCrop.width,
            this.spriteCrop.height,
            -destWidth / (scaleFactor * 2),
            -destHeight / (scaleFactor * 2),
            destWidth,
            destHeight
        );

        if (this.zIndex < 0) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "black";
            ctx.fillRect(
                -destWidth / (scaleFactor * 2),
                -destHeight / (scaleFactor * 2),
                destWidth,
                destHeight
            );
        }

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

        // Continue with swing logic
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

    updateDirection(lookDirection) {
        if (lookDirection < 90 && lookDirection > -90) {
            this.direction = 1; // Left
        } else {
            this.direction = -1; // Right
        }
    }

    applyRotationAndFlip(ctx, finalRotation, shouldFlip) {
        // Determine if we need to flip the sprite based on 'shouldFlip' and the 'eyes' flag
        const willFlip = shouldFlip && (this.eyes || this.flip);

        if (willFlip || this.zIndex < 0) {
            ctx.scale(willFlip ? -1 : 1, 1);
            // Invert the final rotation if we are flipping
            finalRotation = -finalRotation;
        }

        // Apply rotation
        ctx.rotate((finalRotation * Math.PI) / 180);

        // Set the origin of rotation to either flipOrigin or rotationOrigin
        const origin =
            this.flip && shouldFlip ? this.flipOrigin : this.rotationOrigin;
        ctx.translate(-origin.x, -origin.y);
    }

    loadSprite(image) {
        let img = image;

        if (this.ownSpriteMap) {
            img = new Image();
            img.src = getSpriteUrl(
                "entity/" + this.ownSpriteMap,
                isEqualToOriginal("entity/" + this.ownSpriteMap)
            );
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

        const spritePath = this.getHeldItemSpritePath(holdItem);

        if (!spritePath) return;

        const spriteSize = getSpriteSize(spritePath).width;

        const sprite = getSpriteUrl(spritePath);

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
            x: (-spriteSize * scale * (BLOCK_SIZE / spriteSize)) / 2,
            y: (-spriteSize * scale * (BLOCK_SIZE / spriteSize)) / 2,
            scale: (BLOCK_SIZE / spriteSize) * scale,
            centerX: false,
            sizeY: spriteSize - cutoff * spriteSize,
            crop: {
                x: 0,
                y: 0,
                width: spriteSize,
                height: spriteSize,
            },
        });

        ctx.restore();
    }

    isTool(item) {
        if (item.itemId) {
            if (GetItem(item.itemId).toolType != ToolType.Nothing) return true;
        }
        return false;
    }

    getHeldItemSpritePath(holdItem) {
        if (holdItem.blockId) {
            return "blocks/" + GetBlock(holdItem.blockId).iconSprite;
        }
        if (holdItem.itemId != null) {
            return "items/" + GetItem(holdItem.itemId).sprite;
        }
        return null;
    }
}
