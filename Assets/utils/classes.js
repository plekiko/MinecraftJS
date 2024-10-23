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

        if(a.x < b.x)
            distance = -distance;

        return distance;
    }

    static YDistance(a, b) {
        let distance = Math.sqrt(Math.pow(a.y - b.y, 2));

        if(a.y < b.y)
            distance = -distance;

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

class Sprite {
    constructor(url, size) {
        this.url = url;
        this.size = size;
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
    constructor(transform, alpha = 1, sprite = "", spriteScale = 1, dark = false) {
        this.transform = transform;
        this.alpha = alpha;
        this.img = null;
        this.spriteScale = spriteScale;
        this.specialType = -1;
        this.outline = 0;
        this.dark = dark;

        this.transform.size.x = BLOCK_SIZE;
        this.transform.size.y = BLOCK_SIZE;

        if(!sprite)
            return;

        this.img = new Image();
        this.img.src = "Assets/sprites/" + sprite;
    }

    setSprite(sprite) {
        if(!sprite)
            return;

        this.img = new Image();
        this.img.src = "Assets/sprites/" + sprite;
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
                (-this.transform.size.x / 2) - this.outline,
                (-this.transform.size.y / 2) - this.outline,
                this.transform.size.x + this.outline * 2,
                this.transform.size.y + this.outline * 2
            );
    
            ctx.fillStyle = this.color;
        }
    
        // Draw the main object (image or fallback rect)
        if (this.img) {
            ctx.drawImage(
                this.img, 
                -this.transform.size.x / 2, 
                -this.transform.size.y / 2, 
                this.img.width * this.spriteScale, 
                this.img.height * this.spriteScale
            );
    
            // Apply dark overlay if required
            if (this.dark) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = "black";
                ctx.fillRect(
                    -this.transform.size.x / 2, 
                    -this.transform.size.y / 2, 
                    this.transform.size.x, 
                    this.transform.size.y
                );
                ctx.globalAlpha = this.alpha;
            }
        } else {
            // Fallback to drawing a rectangle if no image
            ctx.fillRect(
                -this.transform.size.x / 2, 
                -this.transform.size.y / 2, 
                this.transform.size.x, 
                this.transform.size.y
            );
        }
    
        ctx.restore(); // Restore the context to its original state
    }
    
}

class RigidBodyItem extends Square {
    constructor(transform, rb, sprite, spriteScale) {
        super(transform, "black", 1, sprite, spriteScale);
        this.rb = rb;

        this.ID = Date.now();

        setInterval(()=> {this.update();}, 1000/60);
    }

    update() {
        this.transform.position.x += this.rb.velocity.x;
        this.transform.position.y += this.rb.velocity.y;
    }
}

class Rigidbody2D {
    constructor(velocity = new Vector2(), gravityScale = 1, speed = 8, decelaration = 5, maxVelocity = new Vector2(10, 30)) {
        this.velocity = velocity;
        this.gravityScale = gravityScale;
        this.speed = speed;
        
        this.decelaration = decelaration;

        this.maxVelocity = maxVelocity;

        if(getBrowser() != "Chrome")
            setInterval(()=> this.update(), 1000/60);
        else setInterval(()=> this.update(), 1000/37);
    }

    addForce(direction, force) {
        this.velocity = direction.scale(force);
    }

    update() {
        this.velocity.y += this.gravityScale;

        if(this.velocity.x > 0)
            this.velocity.x -= this.speed/this.decelaration;
        else if(this.velocity.x < 0)
            this.velocity.x += this.speed/this.decelaration;
        if(this.velocity.x <= this.speed/this.decelaration && this.velocity.x >= -this.speed/this.decelaration)
            this.velocity.x = 0;

        //Correct Speed
        if(this.velocity.y > this.maxVelocity.y)
            this.velocity.y = this.maxVelocity.y;
        if(this.velocity.y < -this.maxVelocity.y)
            this.velocity.y = -this.maxVelocity.y;

        if(this.velocity.x > this.maxVelocity.x)
            this.velocity.x = this.maxVelocity.x;
        if(this.velocity.x < -this.maxVelocity.x)
            this.velocity.x = -this.maxVelocity.x;
    }
}

function RandomRange(min, max) {
    return Math.floor(Math.random() * (max - min )) + min;
}

function AngleToVector(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
}

class Camera {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 1;
        this.velocity = new Vector2()
    }

    getWorldX() {
        return this.x + CANVAS.width/2;
    }

    getCurrentChunkIndex(chunks) {
        chunks.sort((a, b) => a.x - b.x);

        const worldX = this.getWorldX(); // Get the current world X position of the camera

        // Perform binary search to find the chunk
        let left = 0;
        let right = chunks.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const chunk = chunks[mid];
            const chunkStart = chunk.x; // Start of the chunk
            const chunkEnd = chunk.x + chunk.width * BLOCK_SIZE; // End of the chunk

            if (worldX >= chunkStart && worldX < chunkEnd) {
                return mid; // We found the chunk containing the worldX
            } else if (worldX < chunkStart) {
                right = mid - 1; // Search in the left half
            } else {
                left = mid + 1; // Search in the right half
            }
        }

        return -1; // If no chunk is found, return -1 (handle errors if needed)
    }

    update(deltaTime) {
        this.x += (this.velocity.x * this.speed) * deltaTime;
        this.y += (this.velocity.y * this.speed) * deltaTime;

        GenerateWorld();
    }
}