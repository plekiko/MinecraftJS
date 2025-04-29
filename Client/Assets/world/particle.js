class Particle extends SimpleSprite {
    constructor(x, y, type, scale = 1) {
        super({
            sprite: type ? "particle/particles" : null,
            transform: new Transform(
                new Vector2(x, y),
                new Vector2(type?.width || 8, type?.width || 8)
            ),
            crop: {
                x: type?.x * 8 || 0,
                y: type?.y * 8 || 0,
                width: type?.width || 8,
                height: type?.height || 8,
            },
            scale: scale,
        });
        this.speedX = 0;
        this.speedY = 0;
        this.gravity = 0;
        this.fadeOutTime = 0;
        this.startTime = Date.now();
    }

    update() {
        const elapsedTime = Date.now() - this.startTime;

        // Update position based on speed
        this.transform.position.x += this.speedX;
        this.transform.position.y += this.speedY;

        // Apply gravity
        this.speedY += this.gravity;

        // Fade out effect
        if (this.fadeOutTime > 0) {
            const fadeOutProgress = Math.min(elapsedTime / this.fadeOutTime, 1);
            this.alpha = 1 - fadeOutProgress;
        }
    }
}

class ParticleType {
    constructor(x, y, frameCount, animationSpeed = 1, width = 8, height = 8) {
        this.x = x;
        this.y = y;
        this.frameCount = frameCount;
        this.animationSpeed = animationSpeed;

        this.width = width;
        this.height = height;
    }
}

const PARTICLE = Object.freeze({
    Heart: new ParticleType(0, 5, 1),
});
