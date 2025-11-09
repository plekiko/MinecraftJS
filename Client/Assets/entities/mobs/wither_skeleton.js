class WitherSkeleton extends Mob {
    constructor({
        health = 20,
        noAi = false,
        position = new Vector2(),
        invulnerable = false,
        myChunkX = 0,
        body = createWitherSkeletonBody(),
    } = {}) {
        super({
            name: "Wither Skeleton",
            health: health,
            position: position,
            hitbox: new Vector2(0.4 * BLOCK_SIZE, 1.8 * BLOCK_SIZE),
            invulnerable: invulnerable,
            body: body,
            noAi: noAi,
            ai: AI.Zombie,
            speed: 1,
            stepSize: 0.4,
            myChunkX: myChunkX,
            ambientSounds: Sounds.Zombie_Say,
            footstepSounds: Sounds.Zombie_Step,
            lootTable: new LootTable([
                new LootItem({
                    itemId: Items.RottenFlesh,
                    maxCount: 2,
                    subtract: 3,
                }),
                new LootItem({
                    itemId: Items.IronIngot,
                    maxCount: 1,
                    subtract: 20,
                }),
                new LootItem({
                    itemId: Items.Carrot,
                    maxCount: 1,
                    subtract: 15,
                }),
            ]),
        });
    }

    update() {
        this.updateEntity();
        this.aiUpdate();

        this.hitPlayerLogic();

        if (this.direction === 1) {
            this.body.parts.leftArm.rotation = -90;
            this.body.parts.rightArm.rotation = 90;
        } else {
            this.body.parts.leftArm.rotation = 90;
            this.body.parts.rightArm.rotation = -90;
        }
    }

    hitPlayerLogic() {
        if (this.attackCooldown) return;

        const touchingPlayer = this.entityCollision(EntityTypes.Player);

        if (!touchingPlayer) return;

        touchingPlayer.hit(4, this.position.x, 3);

        this.attackCooldown = 1;
    }

    hit(damage, hitfromX = 0, kb = 0) {
        if (!this.health) return;
        if (!this.damage(damage)) return;

        this.knockBack(hitfromX, kb);
        PlayRandomSoundFromArray({
            array: Sounds.Zombie_Hurt,
            positional: true,
            origin: this.position,
        });
    }

    dieEvent() {
        this.dropLoot();
        playPositionalSound(this.position, "mobs/zombie/death.ogg");
        removeEntity(this);
    }

    tickUpdate() {
        this.entityTickUpdate();
    }

    interact(player, item) {}
}

function createWitherSkeletonBody() {
    return new Body({
        flipCorrection: 0,
        sprite: "skeleton/wither_skeleton",
        parts: {
            head: new BodyPart({
                spriteCrop: { x: 0, y: 8, width: 8, height: 8 },
                offset: { x: -6, y: 0 },
                rotationOrigin: { x: 12, y: 32 },
                zIndex: 1,
                eyes: true,
            }),
            torso: new BodyPart({
                spriteCrop: { x: 16, y: 20, width: 4, height: 12 },
                offset: { x: 0, y: 34 },
            }),
            leftArm: new BodyPart({
                offset: { x: 0, y: 30 },
                spriteCrop: { x: 16, y: 30, width: 4, height: 12 },
                zIndex: 2,
                rotationOrigin: { x: 5, y: 4 },
                flipOrigin: { x: 1, y: 4 },
                // mainArm: true,
                holdOrigin: { x: 6, y: 35 },

                rotation: 90,
            }),
            rightArm: new BodyPart({
                spriteCrop: { x: 48, y: 20, width: 4, height: 12 },
                offset: { x: 0, y: 30 },
                rotationOrigin: { x: 5, y: 4 },
                flipOrigin: { x: 1, y: 4 },
                zIndex: -2,

                rotation: 90,
            }),
            leftLeg: new BodyPart({
                spriteCrop: { x: 4, y: 20, width: 4, height: 12 },
                offset: { x: 0, y: 74 },
                rotationOrigin: { x: 5, y: 0 },
                zIndex: 1,
                sways: true,
                swayIntensity: 4,
            }),
            rightLeg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 12 },
                offset: { x: 0, y: 74 },
                rotationOrigin: { x: 5, y: 0 },
                zIndex: -1,
                sways: true,
                swayIntensity: 4,
            }),
        },
    });
}
