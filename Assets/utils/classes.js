class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static Distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    static XDistance(a, b) {
        let distance = Math.sqrt(Math.pow(a.x - b.x, 2));

        if (a.x < b.x) distance = -distance;

        return distance;
    }

    static YDistance(a, b) {
        let distance = Math.sqrt(Math.pow(a.y - b.y, 2));

        if (a.y < b.y) distance = -distance;

        return distance;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        return new Vector2(this.x / mag, this.y / mag);
    }

    scale(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }
}

function calculateDirection(positionA, positionB) {
    const direction = new Vector2(
        positionB.x - positionA.x,
        positionB.y - positionA.y
    ).normalize();

    return direction;
}

class Transform {
    constructor(position = new Vector2(), size = new Vector2()) {
        this.position = position;
        this.size = size;
        this.rotation = 0;
    }
}

class Square {
    constructor(
        transform,
        alpha = 1,
        sprite = "",
        spriteScale = 1,
        dark = false
    ) {
        this.transform = transform;
        this.alpha = alpha;
        this.img = null;
        this.spriteScale = spriteScale;
        this.outline = 0;
        this.dark = dark;

        this.brightness = 1;
        this.filterBrightness = 100;

        this.lightLevel = 15; // 0-15

        this.cutoff = 0;

        this.transform.size.x = BLOCK_SIZE;
        this.transform.size.y = BLOCK_SIZE;

        this.frameRate = null;

        if (!sprite) return;

        this.img = new Image();
        this.img.src = "Assets/sprites/" + sprite;
    }

    setSprite(sprite) {
        if (!sprite) return;

        this.img = new Image();
        this.img.src = "Assets/sprites/" + sprite;

        if (this.img)
            if (this.isAnimated()) this.frameCount = this.img.height / 16;
    }

    drawBrightness(ctx, camera) {
        ctx.globalAlpha = 1 - this.getBrightness();
        ctx.fillStyle = "black";
        ctx.fillRect(
            Math.round(-this.transform.size.x / 2 - camera.x),
            Math.round(-this.transform.size.y / 2 - camera.y),
            Math.round(this.transform.size.x),
            Math.round(this.transform.size.y)
        );
        ctx.globalAlpha = this.alpha;
    }

    getBrightness() {
        // Calculate the brightness of the block based on the light level
        // 15 is fully bright, 0 is fully dark
        return this.lightLevel / 15;
    }

    draw(ctx, camera) {
        const centerX = this.transform.position.x + this.transform.size.x / 2;
        const centerY = this.transform.position.y + this.transform.size.y / 2;
        ctx.save();
        ctx.translate(centerX, centerY);

        if (!this.img) {
            if (this.lightLevel < 15) {
                this.drawBrightness(ctx, camera, this.brightness);
            }
            ctx.restore();
            return;
        }

        ctx.globalAlpha = this.alpha;

        // Translate to the center of the object

        // Rotate if necessary
        if (this.transform.rotation !== 0) {
            ctx.rotate((this.transform.rotation * Math.PI) / 180); // Convert degrees to radiansb
        }

        // Draw outline if present
        if (this.outline > 0) {
            ctx.fillStyle = "white";
            ctx.fillRect(
                -this.transform.size.x / 2 -
                    this.outline +
                    this.drawOffset -
                    camera.x,
                -this.transform.size.y / 2 - this.outline - camera.y,
                this.transform.size.x + this.outline * 2,
                this.transform.size.y + this.outline * 2
            );

            ctx.fillStyle = this.color;
        }

        // let drawSquareBrightness = true;
        // const blockDef = this.blockType && GetBlock(this.blockType);
        // if (blockDef && blockDef.transparent) {
        //     drawSquareBrightness = false;
        //     ctx.filter = `brightness(${this.getBrightness()})`;
        // }

        // Draw the main object (image or fallback rect)
        if (this.filterBrightness < 100) {
            ctx.filter = `brightness(${this.filterBrightness}%)`;
        }

        if (this.img && (!this.frameCount || this.frameCount == 0)) {
            ctx.drawImage(
                this.img,
                Math.round(
                    -this.transform.size.x / 2 + this.drawOffset - camera.x
                ),
                Math.round(-this.transform.size.y / 2 - camera.y),
                16 * this.spriteScale,
                16 * this.spriteScale
            );

            // Apply dark overlay if required
            if (this.dark) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = "black";
                ctx.fillRect(
                    Math.round(
                        -this.transform.size.x / 2 + this.drawOffset - camera.x
                    ),
                    Math.round(-this.transform.size.y / 2 - camera.y),
                    this.transform.size.x,
                    this.transform.size.y
                );
                ctx.globalAlpha = this.alpha;
            }
        }

        if (this.img && this.frameCount > 0) {
            this.drawAnimation(ctx, camera);
        }

        if (this.lightLevel < 15) {
            this.drawBrightness(ctx, camera);
        }

        ctx.restore(); // Restore the context to its original state
    }

    drawAnimation(ctx, camera) {
        const frameHeight = 16;
        const effectiveFrame =
            Math.floor(globalFrame * this.frameRate) % this.frameCount;
        const frameY = effectiveFrame * frameHeight;

        const drawX = Math.round(
            -this.transform.size.x / 2 + this.drawOffset - camera.x
        );
        const drawY = Math.round(-this.transform.size.y / 2 - camera.y);
        const drawWidth = 16 * this.spriteScale;
        const drawHeight = 16 * this.spriteScale;

        // Calculate how much of the sprite should be visible:
        // When cutoff is 0, visibleFraction is 1 (full sprite).
        // When cutoff is 1, visibleFraction is 0 (nothing).
        const visibleFraction = 1 - this.cutoff;
        const visibleHeight = drawHeight * visibleFraction;

        // For a "cutoff from the top" effect, we want to clip away the top portion.
        // That is, our clipping rectangle starts at (drawY + (drawHeight - visibleHeight))
        // and spans the full width and visibleHeight.
        ctx.save();
        ctx.beginPath();
        ctx.rect(
            drawX,
            drawY + (drawHeight - visibleHeight),
            drawWidth,
            visibleHeight
        );
        ctx.clip();

        // Draw the entire sprite frame normally.
        ctx.drawImage(
            this.img,
            0, // source x
            frameY, // source y (the frame offset in the sprite sheet)
            16, // source width (one frame)
            frameHeight, // source height
            drawX, // destination x
            drawY, // destination y
            drawWidth, // destination width
            drawHeight // destination height
        );

        // Optionally apply a dark overlay (only over the visible portion).
        if (this.dark) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "black";
            ctx.fillRect(
                drawX,
                drawY + (drawHeight - visibleHeight),
                drawWidth,
                visibleHeight
            );
            ctx.globalAlpha = this.alpha;
        }

        ctx.restore();
    }

    isAnimated() {
        return this.img.height > 16;
    }
}

function arePropsEqual(a, b) {
    // Treat null/undefined as equal
    if (!a && !b) return true;
    if ((a && !b) || (!a && b)) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (let key of aKeys) {
        if (a[key] !== b[key]) return false;
    }
    return true;
}

function RandomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function AngleToVector(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function caculateDirection(positionA, positionB) {
    if (positionA.x > positionB.x) return -1;
    return 1;
}

function isValidClassType(variable) {
    try {
        if (typeof variable === "function" && variable.prototype) {
            Reflect.construct(() => {}, [], variable);
            return true;
        }
    } catch (e) {
        // If it fails instantiation, it's not a valid class
    }
    return false;
}

function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpEaseInOut(a, b, t) {
    const easedT = easeInOut(t);
    return a + (b - a) * easedT;
}

function easeIn(t) {
    return t * t * t; // Cubic ease-in
}

function easeOut(t) {
    return 1 - Math.pow(1 - t, 3); // Cubic ease-out
}

function lerpEaseIn(a, b, t) {
    const easedT = easeIn(t);
    return a + (b - a) * easedT;
}

function lerpEaseOut(a, b, t) {
    const easedT = easeOut(t);
    return a + (b - a) * easedT;
}
