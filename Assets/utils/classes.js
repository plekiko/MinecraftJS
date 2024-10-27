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
        this.fluidSprite = false;

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

    draw(ctx) {
        if (!this.img) return;

        ctx.save();
        ctx.globalAlpha = this.alpha; // Apply the object's alpha transparency

        // Translate to the center of the object
        const centerX = this.transform.position.x + this.transform.size.x / 2;
        const centerY = this.transform.position.y + this.transform.size.y / 2;
        ctx.translate(centerX, centerY);

        // Rotate if necessary
        if (this.transform.rotation !== 0) {
            ctx.rotate((this.transform.rotation * Math.PI) / 180); // Convert degrees to radians
        }

        // Draw outline if present
        if (this.outline > 0) {
            ctx.fillStyle = "white";
            ctx.fillRect(
                -this.transform.size.x / 2 - this.outline + this.drawOffset,
                -this.transform.size.y / 2 - this.outline,
                this.transform.size.x + this.outline * 2,
                this.transform.size.y + this.outline * 2
            );

            ctx.fillStyle = this.color;
        }

        // Draw the main object (image or fallback rect)
        if (this.img && (!this.frameCount || this.frameCount == 0)) {
            ctx.drawImage(
                this.img,
                -this.transform.size.x / 2 + this.drawOffset,
                -this.transform.size.y / 2,
                this.img.width * this.spriteScale,
                this.img.height * this.spriteScale
            );

            // Apply dark overlay if required
            if (this.dark) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = "black";
                ctx.fillRect(
                    -this.transform.size.x / 2 + this.drawOffset,
                    -this.transform.size.y / 2,
                    this.transform.size.x,
                    this.transform.size.y
                );
                ctx.globalAlpha = this.alpha;
            }
        }

        if (this.img && this.frameCount > 0) {
            this.drawAnimation(ctx);
        }

        ctx.restore(); // Restore the context to its original state
    }

    drawAnimation() {
        const frameHeight = 16;

        const offset = this.fluidSprite ? BLOCK_SIZE / 8 : 0;

        const effectiveFrame =
            Math.floor(globalFrame * this.frameRate) % this.frameCount;
        const frameY = effectiveFrame * frameHeight;

        ctx.drawImage(
            this.img,
            0, // X position in the image (always 0 in a vertical strip)
            frameY, // Y position based on frame index
            16, // Width of a single frame
            frameHeight, // Height of a single frame
            -this.transform.size.x / 2 + this.drawOffset,
            -this.transform.size.y / 2 + offset,
            this.img.width * this.spriteScale,
            frameHeight * this.spriteScale - offset
        );
    }

    isAnimated() {
        return this.img.height > 16;
    }
}

class RigidBodyItem extends Square {
    constructor(transform, rb, sprite, spriteScale) {
        super(transform, "black", 1, sprite, spriteScale);
        this.rb = rb;

        this.ID = Date.now();

        setInterval(() => {
            this.update();
        }, 1000 / 60);
    }

    update() {
        this.transform.position.x += this.rb.velocity.x;
        this.transform.position.y += this.rb.velocity.y;
    }
}

class Rigidbody2D {
    constructor(
        velocity = new Vector2(),
        gravityScale = 1,
        speed = 8,
        decelaration = 5,
        maxVelocity = new Vector2(10, 30)
    ) {
        this.velocity = velocity;
        this.gravityScale = gravityScale;
        this.speed = speed;

        this.decelaration = decelaration;

        this.maxVelocity = maxVelocity;

        if (getBrowser() != "Chrome")
            setInterval(() => this.update(), 1000 / 60);
        else setInterval(() => this.update(), 1000 / 37);
    }

    addForce(direction, force) {
        this.velocity = direction.scale(force);
    }

    update() {
        this.velocity.y += this.gravityScale;

        if (this.velocity.x > 0)
            this.velocity.x -= this.speed / this.decelaration;
        else if (this.velocity.x < 0)
            this.velocity.x += this.speed / this.decelaration;
        if (
            this.velocity.x <= this.speed / this.decelaration &&
            this.velocity.x >= -this.speed / this.decelaration
        )
            this.velocity.x = 0;

        //Correct Speed
        if (this.velocity.y > this.maxVelocity.y)
            this.velocity.y = this.maxVelocity.y;
        if (this.velocity.y < -this.maxVelocity.y)
            this.velocity.y = -this.maxVelocity.y;

        if (this.velocity.x > this.maxVelocity.x)
            this.velocity.x = this.maxVelocity.x;
        if (this.velocity.x < -this.maxVelocity.x)
            this.velocity.x = -this.maxVelocity.x;
    }
}

function RandomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function AngleToVector(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
}

class Camera {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = new Vector2();
        this.speed = 3;
    }

    getWorldX() {
        return this.x + CANVAS.width / 2; // Calculate the world X position of the camera
    }

    getWorldY() {
        return this.y + CANVAS.height / 2;
    }

    zoomIn() {}

    zoomOut() {}

    getCurrentChunkIndex() {
        const worldX = this.getWorldX(); // Get the current world X position of the camera
        const chunkIndex = Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)); // Calculate the chunk index
        return chunkIndex;
    }

    update(deltaTime) {
        // Update camera position based on velocity
        this.x += this.velocity.x * this.speed * deltaTime;
        this.y += this.velocity.y * this.speed * deltaTime;

        // Trigger world generation when the camera moves
        GenerateWorld();
    }
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpEaseInOut(a, b, t) {
    const easedT = easeInOut(t);
    return a + (b - a) * easedT;
}
