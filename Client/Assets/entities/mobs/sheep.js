class Sheep extends Mob {
    constructor({
        health = 10,
        noAi = false,
        position = new Vector2(),
        invulnerable = false,
        myChunkX = 0,
        body = createSheepBody(),
    } = {}) {
        super({
            name: "Sheep",
            health: health,
            position: position,
            hitbox: new Vector2(0.9 * BLOCK_SIZE, 1 * BLOCK_SIZE),
            invulnerable: invulnerable,
            footstepSounds: Sounds.Sheep_Step,
            body: body,
            noAi: noAi,
            myChunkX: myChunkX,
            ai: AI.PassiveSimple,
            speed: 1.2,
            stepSize: 0.4,
            ambientSounds: Sounds.Sheep_Say,
            lootTable: new LootTable([
                new LootItem({
                    itemId: Items.RawMutton,
                    maxCount: 2,
                    subtract: 1,
                }),
            ]),
        });

        this.hasWool = true;
        this.woolTimer = 0;
    }

    update() {
        this.updateEntity();
        this.aiUpdate();
    }

    tickUpdate() {
        this.entityTickUpdate();

        this.woolLogic();
    }

    woolLogic() {
        if (!this.hasWool) {
            // With wool
            this.body.parts.torso.ownSpriteMap = "";
            this.body.parts.torso.spriteCrop.width = 6;

            // Dont drop wool if sheared
            this.lootTable = new LootTable([
                new LootItem({
                    itemId: Items.RawMutton,
                    maxCount: 2,
                    subtract: 1,
                }),
            ]);
        } else {
            this.body.parts.torso.ownSpriteMap = "sheep/sheep_fur";
            this.body.parts.torso.spriteCrop.width = 9;

            // Drop wool if not sheared
            this.lootTable = new LootTable([
                new LootItem({
                    blockId: Blocks.WhiteWool,
                    maxCount: 3,
                    subtract: 1,
                }),
                new LootItem({
                    itemId: Items.RawMutton,
                    maxCount: 2,
                    subtract: 1,
                }),
            ]);
        }

        if (this.hasWool) return;

        this.woolTimer++;

        if (this.woolTimer >= 3000) {
            this.hasWool = true;
            this.woolTimer = 0;
        }
    }

    hit(damage, hitfromX = 0, kb = 0) {
        if (!this.health) return;
        if (!this.damage(damage)) return;

        this.knockBack(hitfromX, kb);
        PlayRandomSoundFromArray({
            array: Sounds.Sheep_Say,
            positional: true,
            origin: this.position,
        });
    }

    interact(player, item) {
        if (item.itemId !== Items.Shears) return;
        if (!this.hasWool) return;

        summonEntity(Drop, new Vector2(this.position.x, this.position.y), {
            blockId: Blocks.WhiteWool,
            count: RandomRange(1, 3),
        });

        player.reduceDurability();

        this.hasWool = false;

        playPositionalSound(this.position, "mobs/sheep/shear.ogg");
    }

    dieEvent() {
        this.dropLoot();
        PlayRandomSoundFromArray({
            array: Sounds.Sheep_Say,
            positional: true,
            origin: this.position,
        });
        removeEntity(this);
    }
}

function createSheepBody() {
    return new Body({
        flipCorrection: 0,
        sprite: "sheep/sheep",
        parts: {
            head: new BodyPart({
                spriteCrop: { x: 0, y: 8, width: 7, height: 6 },
                offset: { x: 48, y: -18 },
                flipOrigin: { x: -66, y: 0 },
                zIndex: 0,
                flip: true,
            }),
            torso: new BodyPart({
                spriteCrop: { x: 42, y: 14, width: 6, height: 16 },
                spriteRotation: -90,
                offset: { x: -7, y: 18 },
                flipOrigin: { x: 43, y: 0 },
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
