class Pig extends Mob {
    constructor({
        health = 10,
        noAi = false,
        position = new Vector2(),
        invulnerable = false,
        myChunkX = 0,
        body = createPigBody(),
    } = {}) {
        super({
            name: "Pig",
            health: health,
            position: position,
            hitbox: new Vector2(0.9 * BLOCK_SIZE, 0.8 * BLOCK_SIZE),
            invulnerable: invulnerable,
            footstepSounds: Sounds.Pig_Step,
            body: body,
            noAi: noAi,
            ai: AI.PassiveSimple,
            myChunkX: myChunkX,
            speed: 1.4,
            stepSize: 0.4,
            ambientSounds: Sounds.Pig_Say,
            lootTable: new LootTable([
                new LootItem({
                    itemId: Items.RawPorkchop,
                    maxCount: 2,
                    subtract: 1,
                }),
            ]),
        });
    }

    update() {
        this.updateEntity();
        this.aiUpdate();
    }

    hit(damage, hitfromX = 0, kb = 0) {
        if (!this.health) return;
        this.knockBack(hitfromX, kb);
        if (!this.damage(damage)) return;
        this.knockBack(hitfromX, kb);
        PlayRandomSoundFromArray({
            array: Sounds.Pig_Say,
            positional: true,
            origin: this.position,
        });
    }

    dieEvent() {
        this.dropLoot();
        playPositionalSound(this.position, "mobs/pig/death.ogg");
        removeEntity(this);
    }

    tickUpdate() {
        this.entityTickUpdate();
    }

    interact(player, item) {}
}

function createPigBody() {
    return new Body({
        sprite: "pig/pig",
        flipCorrection: 3,
        parts: {
            head: new BodyPart({
                spriteCrop: { x: 0, y: 8, width: 8, height: 8 },
                offset: { x: 45, y: -8 },
                flipOrigin: { x: -65, y: 0 },
                zIndex: 0,
                flip: true,
            }),
            torso: new BodyPart({
                spriteCrop: { x: 47, y: 16, width: 9, height: 16 },
                spriteRotation: -90,
                offset: { x: -9, y: 24 },
                flipOrigin: { x: 44, y: 0 },
                zIndex: 2,
                flip: true,
            }),
            back_back_leg: new BodyPart({
                spriteCrop: { x: 0, y: 20, width: 4, height: 6 },
                offset: { x: -15, y: 31 },
                rotationOrigin: { x: 4, y: 0 },
                sways: true,
                swayIntensity: 4,
                zIndex: -1,
            }),
            back_leg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 6 },
                offset: { x: -15, y: 31 },
                rotationOrigin: { x: 4, y: 0 },
                sways: true,
                swayIntensity: 4,
                zIndex: 1,
            }),
            front_back_leg: new BodyPart({
                spriteCrop: { x: 0, y: 20, width: 4, height: 6 },
                offset: { x: 30, y: 31 },
                rotationOrigin: { x: 4, y: 0 },
                sways: true,
                swayIntensity: 4,
                zIndex: -1,
            }),
            front_leg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 6 },
                offset: { x: 30, y: 31 },
                rotationOrigin: { x: 4, y: 0 },
                sways: true,
                swayIntensity: 4,
                zIndex: 1,
            }),
        },
    });
}
