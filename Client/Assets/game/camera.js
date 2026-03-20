class Camera {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this._zoom = 1;
        this.velocity = new Vector2();
        this.speed = 50;

        this.lerpTimeX = 0;
        this.lerpTimeY = 0;
        this.lerpSpeed = 10;
    }

    get zoom() {
        return this._zoom;
    }

    set zoom(value) {
        const MIN_ZOOM = 0.25;
        const MAX_ZOOM = 4;

        const parsedZoom = Number(value);
        if (!Number.isFinite(parsedZoom) || parsedZoom <= 0) return;

        const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parsedZoom));

        const oldZoom = this._zoom;
        if (oldZoom === clampedZoom) return;

        this._zoom = clampedZoom;

        this.clampY();
    }

    getWorldX(x) {
        return x + CANVAS.width / 2;
    }

    getWorldY(y) {
        return y - CANVAS.height / 2;
    }

    getCurrentChunkIndex() {
        let worldX = this.getWorldX(this.x);
        const chunkIndex = Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)); // Calculate the chunk index
        return chunkIndex;
    }

    worldToScreen(worldPos) {
        const centerX = CANVAS.width / 2;
        const centerY = CANVAS.height / 2;

        return new Vector2(
            (worldPos.x - this.x - centerX) * this.zoom + centerX,
            (worldPos.y - this.y - centerY) * this.zoom + centerY,
        );
    }

    screenToWorld(screenPos) {
        const centerX = CANVAS.width / 2;
        const centerY = CANVAS.height / 2;

        return new Vector2(
            (screenPos.x - centerX) / this.zoom + centerX + this.x,
            (screenPos.y - centerY) / this.zoom + centerY + this.y,
        );
    }

    isInScreen(worldPos, worldSize) {
        const screenPos = this.worldToScreen(worldPos);
        const scaledSizeX = worldSize.x * this.zoom;
        const scaledSizeY = worldSize.y * this.zoom;

        return !(
            screenPos.x + scaledSizeX < 0 ||
            screenPos.x > CANVAS.width ||
            screenPos.y + scaledSizeY < 0 ||
            screenPos.y > CANVAS.height
        );
    }

    clampY() {
        const halfScreen = CANVAS.height / 2;
        const minY = halfScreen / this.zoom - halfScreen;
        const maxY =
            CHUNK_HEIGHT * BLOCK_SIZE - halfScreen - halfScreen / this.zoom;

        this.y = Math.min(this.y, maxY);
        this.y = Math.max(this.y, minY);
    }

    update(target = world.player) {
        if (!target) {
            const calculatedSpeed = input.isActionDown("sprint")
                ? this.speed * 2
                : this.speed;

            // Update camera position based on velocity
            this.x += this.velocity.x * calculatedSpeed * deltaTime;
            this.y += this.velocity.y * calculatedSpeed * deltaTime;
        } else {
            this.followPlayer(target);
        }

        // Clamp the camera's y so that the bottom edge doesn't go below the world bottom.
        // The bottom edge is at: this.y + CANVAS.height/2.
        // Therefore, ensure: this.y <= CHUNK_HEIGHT * BLOCK_SIZE - CANVAS.height/2.
        this.clampY();
    }

    followPlayer(target = world.player) {
        if (!target) return;

        const increment = deltaTime * this.lerpSpeed;

        let targetX = target.position.x - CANVAS.width / 2;
        let targetY = this.getWorldY(target.position.y);

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

        // Clamp the camera's y after following the player as well.
        this.clampY();
    }
}
