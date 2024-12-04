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

    update(player) {
        if (!player) {
            const calculatedSpeed = input.isKeyDown("ShiftLeft")
                ? this.speed * 2
                : this.speed;

            // Update camera position based on velocity
            this.x += this.velocity.x * calculatedSpeed * deltaTime;
            this.y += this.velocity.y * calculatedSpeed * deltaTime;
        } else {
            this.followPlayer();
        }

        // Trigger world generation when the camera moves
        GenerateWorld();
    }

    followPlayer() {
        const increment = deltaTime * this.lerpSpeed;

        let targetX = player.position.x - CANVAS.width / 2;
        let targetY = this.getWorldY(player.position.y);

        // Define a maximum distance threshold
        const maxDistance = 500; // Adjust this value as needed

        // Calculate the distances between the current position and the target
        const distanceX = Math.abs(this.x - targetX);
        const distanceY = Math.abs(this.y - targetY);

        // If the distance is greater than maxDistance, snap to the target position
        if (distanceX > maxDistance) {
            this.x = targetX;
        } else {
            this.x = lerp(this.x, targetX, increment);
        }

        if (distanceY > maxDistance) {
            this.y = targetY;
        } else {
            this.y = lerp(this.y, targetY, increment);
        }
    }
}
