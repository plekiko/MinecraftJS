class Camera {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = new Vector2();
        this.speed = 3;

        this.lerpTimeX = 0;
        this.lerpTimeY = 0;
        this.lerpSpeed = 10;
    }

    getWorldX(x) {
        return x + CANVAS.width / 2; // Calculate the world X position of the camera
    }

    getWorldY(y) {
        return y - CANVAS.height / 2;
    }

    getCurrentChunkIndex() {
        let worldX = this.getWorldX(this.x);
        const chunkIndex = Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)); // Calculate the chunk index
        return chunkIndex;
    }

    update(deltaTime, player) {
        if (!player) {
            const calculatedSpeed = input.isKeyDown("ShiftLeft")
                ? this.speed * 2
                : this.speed;

            // Update camera position based on velocity
            this.x += this.velocity.x * calculatedSpeed * deltaTime;
            this.y += this.velocity.y * calculatedSpeed * deltaTime;
        } else {
            this.followPlayer(deltaTime);
        }

        // Trigger world generation when the camera moves
        GenerateWorld();
    }

    followPlayer(deltaTime) {
        const increment = deltaTime * this.lerpSpeed;

        let targetX = player.position.x - CANVAS.width / 2;
        let targetY = this.getWorldY(player.position.y);

        this.x = lerp(this.x, targetX, increment);
        this.y = lerp(this.y, targetY, increment);

        // this.x = player.position.x - CANVAS.width / 2;
        // this.y = this.getWorldY(player.position.y);

        // if (Math.abs(this.x - targetX) < 0.1) {
        //     this.x = targetX;
        // }
        // if (Math.abs(this.y - targetY) < 0.1) {
        //     this.y = targetY;
        // }
    }
}
