class ParticleEmitter {
    constructor({
        x = 0,
        y = 0,
        radius = 1,
        type = null,
        maxParticles = 1000,
        speed = 1,
        direction = 0,
        gravity = 0,
        initialVelocity = new Vector2(),
        fadeOutTime = 1000,
        color = "white",
        randomScale = false,
    } = {}) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxParticles = maxParticles;
        this.particles = [];
        this.particleType = type;
        this.speed = speed;
        this.direction = direction;
        this.gravity = gravity;
        this.initialVelocity = initialVelocity;
        this.fadeOutTime = fadeOutTime; // Fade out duration in milliseconds
        this.color = color; // Particle color
        this.randomScale = randomScale; // Random scale for particles
    }

    emitSingle() {
        if (this.particles.length < this.maxParticles) {
            let angle = Math.random() * 2 * Math.PI * this.radius;

            // Add direction to angle
            angle += this.direction * (Math.PI / 180); // Convert direction to radians

            const speed = Math.random() * 2 * this.speed; // Random speed

            const particleX = this.x + Math.cos(angle);
            const particleY = this.y + Math.sin(angle);

            const scale = this.randomScale ? RandomRange(8, 12) / 10 : 1; // Random scale between 0.5 and 1.5

            const particle = new Particle(
                particleX,
                particleY,
                this.particleType,
                scale
            );

            particle.speedX = Math.cos(angle) * speed + this.initialVelocity.x;
            particle.speedY = Math.sin(angle) * speed + this.initialVelocity.y;
            particle.color = this.color; // Set particle color
            particle.fadeOutTime = this.fadeOutTime; // Fade out duration in milliseconds
            particle.gravity = this.gravity; // Apply gravity

            this.particles.push(particle);
        }
    }

    emitBurst() {
        for (let i = this.particles.length; i < this.maxParticles; i++) {
            this.emitSingle();
        }
    }

    update() {
        for (const particle of this.particles) {
            particle.update();

            if (particle.alpha <= 0) {
                const index = this.particles.indexOf(particle);
                if (index > -1) {
                    this.particles.splice(index, 1);
                }
            }
        }
    }

    draw(camera) {
        for (const particle of this.particles) {
            particle.draw(camera);
        }
    }
}

function createParticleEmitter({
    x = 0,
    y = 0,
    radius = 1,
    type = PARTICLE.Heart,
    maxParticles = 1000,
    speed = 1,
    direction = 0,
    gravity = 0,
    initialVelocity = new Vector2(),
    fadeOutTime = 1000,
    color = Colors.White,
    randomScale = false,
} = {}) {
    const newEmitter = new ParticleEmitter({
        x: x,
        y: y,
        radius: radius,
        type: type,
        maxParticles: maxParticles,
        speed: speed,
        direction: direction,
        gravity: gravity,
        initialVelocity: initialVelocity,
        fadeOutTime: fadeOutTime,
        color: color,
        randomScale: randomScale,
    });

    particleEmitters.push(newEmitter);

    return newEmitter;
}

function removeParticleEmitter(emitter) {
    const index = particleEmitters.indexOf(emitter);
    if (index > -1) {
        particleEmitters.splice(index, 1);
    }
}

function createParticleEmitterAtPlayer(
    radius,
    type,
    maxParticles,
    direction = 0
) {
    const emitter = createParticleEmitter({
        x: player.position.x,
        y: player.position.y,
        radius: radius,
        type: type,
        maxParticles: maxParticles,
        speed: 5,
        direction: direction,
    });

    emitter.emitBurst();
}
