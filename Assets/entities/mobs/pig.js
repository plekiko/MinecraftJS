class Pig extends Mob {
    constructor({
        health = 4,
        noAi = false,
        position = new Vector2(),
        invulnerable = false,
        body = new Body({
            parts: pigBody.parts,
            flipCorrection: pigBody.flipCorrection,
        }),
    } = {}) {
        super({
            health: health,
            position: position,
            hitbox: new Vector2(0.9 * BLOCK_SIZE, 0.8 * BLOCK_SIZE),
            invulnerable: invulnerable,
            footstepSounds: Sounds.Pig_Step,
            body: body,
            noAi: noAi,
            ai: AI.Pig,
            speed: 1.5,
            stepSize: 0.4,
            ambientSounds: Sounds.Pig_Say,
        });
    }

    update(deltaTime) {
        this.updateEntity(deltaTime);
        this.aiUpdate(deltaTime);
    }

    hit(damage, hitfromX = 0, kb = 5) {
        if (!this.health) return;
        this.knockBack(hitfromX, kb);
        this.damage(damage);
        PlayRandomSoundFromArray({ array: Sounds.Pig_Say });
    }

    dropLoot() {}

    die() {
        this.dropLoot();
        playPositionalSound(this.position, "mobs/pig/death.ogg");
        removeEntity(this);
    }
}

const pigBody = new Body({
    flipCorrection: 3,
    parts: {
        head: new BodyPart({
            sprite: "entities/pig/head",
            offset: { x: 40, y: -8 },
            flipOrigin: { x: -52, y: 0 },
            zIndex: 0,
            flip: true,
        }),
        torso: new BodyPart({
            sprite: "entities/pig/torso",
            offset: { x: -10, y: 4 },
            flipOrigin: { x: 48, y: 0 },
            zIndex: 2,
            flip: true,
        }),
        back_back_leg: new BodyPart({
            sprite: "entities/pig/far_leg",
            offset: { x: -15, y: 31 },
            rotationOrigin: { x: 4, y: 0 },
            sways: true,
            swayIntensity: 4,
            zIndex: -1,
        }),
        back_leg: new BodyPart({
            sprite: "entities/pig/leg",
            offset: { x: -15, y: 31 },
            rotationOrigin: { x: 4, y: 0 },
            sways: true,
            swayIntensity: 4,
            zIndex: 1,
        }),
        front_back_leg: new BodyPart({
            sprite: "entities/pig/far_leg",
            offset: { x: 30, y: 31 },
            rotationOrigin: { x: 4, y: 0 },
            sways: true,
            swayIntensity: 4,
            zIndex: -1,
        }),
        front_leg: new BodyPart({
            sprite: "entities/pig/leg",
            offset: { x: 30, y: 31 },
            rotationOrigin: { x: 4, y: 0 },
            sways: true,
            swayIntensity: 4,
            zIndex: 1,
        }),
        // snout: new BodyPart({
        //     sprite: "entities/pig/snout",
        //     offset: { x: 75, y: -4 },
        //     rotationOrigin: { x: 12, y: 32 },
        //     zIndex: 1,
        // }),
    },
});
