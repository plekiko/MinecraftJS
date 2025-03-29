class Cow extends Mob {
    constructor({
        health = 10,
        noAi = false,
        position = new Vector2(),
        invulnerable = false,
        myChunkX = 0,
        body = createCowBody(),
    } = {}) {
        super({
            health: health,
            position: position,
            hitbox: new Vector2(0.9 * BLOCK_SIZE, 1 * BLOCK_SIZE),
            invulnerable: invulnerable,
            footstepSounds: Sounds.Cow_Step,
            body: body,
            noAi: noAi,
            myChunkX: myChunkX,
            ai: AI.PassiveSimple,
            speed: 1.2,
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

    update() {
        this.updateEntity();
        this.aiUpdate();
    }

    hit(damage, hitfromX = 0, kb = 0) {
        if (!this.health) return;
        if (!this.damage(damage)) return;

        this.knockBack(hitfromX, kb);
        PlayRandomSoundFromArray({
            array: Sounds.Cow_Hurt,
            positional: true,
            origin: this.position,
        });
    }

    dieEvent() {
        this.dropLoot();
        PlayRandomSoundFromArray({
            array: Sounds.Cow_Say,
            positional: true,
            origin: this.position,
        });
        removeEntity(this);
    }

    tickUpdate() {
        this.entityTickUpdate();
    }

    interact(player, item) {}
}

function createCowBody() {
    return new Body({
        sprite: "cow/cow",
        parts: {
            head: new BodyPart({
                spriteCrop: { x: 0, y: 6, width: 6, height: 8 },
                offset: { x: 52, y: -18 },
                flipOrigin: { x: -76, y: 0 },
                zIndex: 0,
                flip: true,
            }),
            torso: new BodyPart({
                spriteCrop: { x: 40, y: 14, width: 9, height: 18 },
                spriteRotation: -90,
                offset: { x: -13, y: 18 },
                flipOrigin: { x: 55, y: 0 },
                zIndex: 2,
                flip: true,
            }),
            back_back_leg: new BodyPart({
                spriteCrop: { x: 4, y: 20, width: 4, height: 12 },
                offset: { x: -18, y: 22 },
                rotationOrigin: { x: 4, y: 0 },
                sways: true,
                swayIntensity: 3,
                zIndex: -1,
            }),
            back_leg: new BodyPart({
                spriteCrop: { x: 0, y: 20, width: 4, height: 12 },
                offset: { x: -18, y: 22 },
                rotationOrigin: { x: 4, y: 0 },
                sways: true,
                swayIntensity: 3,
                zIndex: 1,
            }),
            front_back_leg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 12 },
                offset: { x: 35, y: 22 },
                rotationOrigin: { x: 4, y: 0 },
                sways: true,
                swayIntensity: 3,
                zIndex: -1,
            }),
            front_leg: new BodyPart({
                spriteCrop: { x: 4, y: 20, width: 4, height: 12 },
                offset: { x: 35, y: 22 },
                rotationOrigin: { x: 4, y: 0 },
                sways: true,
                swayIntensity: 3,
                zIndex: 1,
            }),
        },
    });
}
