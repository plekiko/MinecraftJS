class Cow extends Mob {
    constructor({
        health = 10,
        noAi = false,
        position = new Vector2(),
        invulnerable = false,
        body = new Body({
            parts: cowBody.parts,
            flipCorrection: cowBody.flipCorrection,
        }),
    } = {}) {
        super({
            health: health,
            position: position,
            hitbox: new Vector2(0.9 * BLOCK_SIZE, 1 * BLOCK_SIZE),
            invulnerable: invulnerable,
            footstepSounds: Sounds.Cow_Step,
            body: body,
            noAi: noAi,
            ai: AI.Cow,
            speed: 1.8,
            stepSize: 0.4,
            ambientSounds: Sounds.Cow_Say,
            lootTable: new LootTable([
                new LootItem({
                    itemId: Items.RawBeef,
                    maxCount: 2,
                    subtract: 1,
                }),
                new LootItem({
                    itemId: Items.Leather,
                    maxCount: 3,
                    subtract: 6,
                }),
            ]),
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
        PlayRandomSoundFromArray({
            array: Sounds.Cow_Hurt,
            positional: true,
            origin: this.position,
        });
    }

    die() {
        this.dropLoot();
        PlayRandomSoundFromArray({
            array: Sounds.Cow_Say,
            positional: true,
            origin: this.position,
        });
        removeEntity(this);
    }
}

const cowBody = new Body({
    flipCorrection: 0,
    parts: {
        head: new BodyPart({
            sprite: "entities/cow/head",
            offset: { x: 46, y: -18 },
            flipOrigin: { x: -62, y: 0 },
            zIndex: 0,
            flip: true,
        }),
        torso: new BodyPart({
            sprite: "entities/cow/torso",
            offset: { x: -13, y: -3 },
            flipOrigin: { x: 55, y: 0 },
            zIndex: 2,
            flip: true,
        }),
        back_back_leg: new BodyPart({
            sprite: "entities/cow/far_leg",
            offset: { x: -18, y: 22 },
            rotationOrigin: { x: 4, y: 0 },
            sways: true,
            swayIntensity: 3,
            zIndex: -1,
        }),
        back_leg: new BodyPart({
            sprite: "entities/cow/leg",
            offset: { x: -18, y: 22 },
            rotationOrigin: { x: 4, y: 0 },
            sways: true,
            swayIntensity: 3,
            zIndex: 1,
        }),
        front_back_leg: new BodyPart({
            sprite: "entities/cow/far_leg",
            offset: { x: 35, y: 22 },
            rotationOrigin: { x: 4, y: 0 },
            sways: true,
            swayIntensity: 3,
            zIndex: -1,
        }),
        front_leg: new BodyPart({
            sprite: "entities/cow/leg",
            offset: { x: 35, y: 22 },
            rotationOrigin: { x: 4, y: 0 },
            sways: true,
            swayIntensity: 3,
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
