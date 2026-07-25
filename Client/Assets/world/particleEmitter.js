import { runtime } from "../utils/runtime.js";
import { Vector2, adjustColorBrightness, randomRange } from "../utils/classes.js";
import { lighting } from "../utils/globals.js";
import { Particle } from "./particle.js";

export class ParticleEmitter {
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
        color = "#FFFFFF",
        randomScale = false,
        range = 0,
        lighting = false,
        scale = 1,
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
        this.range = range; // Range for random scale
        this.lighting = lighting; // Lighting effect
        this.scale = scale; // Scale for particles

        this.checkForDeath = false;
    }

    emitSingle() {
        if (this.particles.length < this.maxParticles) {
            let angle = Math.random() * 2 * Math.PI * this.radius;

            // Add direction to angle
            angle += this.direction * (Math.PI / 180); // Convert direction to radians

            const speed = Math.random() * 2 * this.speed; // Random speed

            const particleX =
                this.x + Math.cos(angle) + randomRange(-this.range, this.range);
            const particleY =
                this.y + Math.sin(angle) + randomRange(-this.range, this.range);

            const scale = this.randomScale
                ? randomRange(this.scale - 2, this.scale + 2) / 10
                : this.scale;

            const particle = new Particle(
                particleX,
                particleY,
                this.particleType,
                scale,
            );

            let color = this.color;

            if (this.lighting) {
                const lighting = this.getLightLevel();
                const adjustedColor = adjustColorBrightness(color, lighting);

                color = adjustedColor; // Adjust color based on light level
            }

            particle.speedX = Math.cos(angle) * speed + this.initialVelocity.x;
            particle.speedY = Math.sin(angle) * speed + this.initialVelocity.y;
            particle.color = color; // Set particle color
            particle.fadeOutTime = this.fadeOutTime; // Fade out duration in milliseconds
            particle.gravity = this.gravity; // Apply gravity

            this.particles.push(particle);
        }
    }

    getLightLevel() {
        return runtime.world.getBlockAtWorldPosition(this.x, this.y)?.lightLevel;
    }

    emitBurst() {
        for (let i = this.particles.length; i < this.maxParticles; i++) {
            this.emitSingle();
        }
    }

    emitAndDie() {
        this.emitBurst();

        this.checkForDeath = true;
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

        if (this.checkForDeath) {
            if (this.particles.length === 0) {
                removeParticleEmitter(this);
            }
        }
    }

    draw(camera) {
        for (const particle of this.particles) {
            particle.draw(camera);
        }
    }
}

export function createParticleEmitter({
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
    color = "#FFFFFF",
    randomScale = false,
    range = 0,
    lighting = true,
    scale = 10,
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
        range: range,
        lighting: lighting,
        scale: scale,
    });

    runtime.world.particleEmitters.push(newEmitter);

    return newEmitter;
}

export function removeParticleEmitter(emitter) {
    const index = runtime.world.particleEmitters.indexOf(emitter);
    if (index > -1) {
        runtime.world.particleEmitters.splice(index, 1);
    }
}

export function createParticleEmitterAtPlayer(
    radius,
    type,
    maxParticles,
    direction = 0,
) {
    const emitter = createParticleEmitter({
        x: runtime.world.player.position.x,
        y: runtime.world.player.position.y,
        radius: radius,
        type: type,
        maxParticles: maxParticles,
        speed: 5,
        direction: direction,
    });

    emitter.emitBurst();
}
