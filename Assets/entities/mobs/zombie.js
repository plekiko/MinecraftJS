class Zombie extends Mob {
    constructor({
        health = 20,
        noAi = false,
        position = new Vector2(),
        invulnerable = false,
        myChunkX = 0,
        body = new Body({
            parts: zombieBody,
        }),
    } = {}) {
        super({
            health: health,
            position: position,
            hitbox: new Vector2(0.4 * BLOCK_SIZE, 1.8 * BLOCK_SIZE),
            invulnerable: invulnerable,
            body: body,
            noAi: noAi,
            ai: AI.Zombie,
            speed: 1.4,
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

        if (this.getSunLight() && day) {
            this.fire = 100;
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

const zombieBody = {
    head: new BodyPart({
        sprite: "entities/zombie/head",
        offset: { x: -6, y: 0 },
        rotationOrigin: { x: 12, y: 32 },
        flipOrigin: { x: 12, y: 32 },
        zIndex: 1,
        flip: true,
    }),
    torso: new BodyPart({
        sprite: "entities/zombie/torso",
        offset: { x: 0, y: 34 },
    }),
    leftArm: new BodyPart({
        sprite: "entities/zombie/right_arm",
        offset: { x: 4, y: 30 },
        zIndex: 2,
        rotationOrigin: { x: 4, y: 4 },

        flip: true,
        flipOrigin: { x: 1, y: 4 },

        mainArm: true,
        holdOrigin: { x: 6, y: 35 },
    }),
    rightArm: new BodyPart({
        sprite: "entities/zombie/left_arm",
        offset: { x: 4, y: 30 },
        rotationOrigin: { x: 4, y: 4 },

        flip: true,
        flipOrigin: { x: 1, y: 4 },

        zIndex: -2,
    }),
    leftLeg: new BodyPart({
        sprite: "entities/zombie/right_leg",
        offset: { x: 0, y: 74 },
        rotationOrigin: { x: 4, y: 0 },
        zIndex: 1,
        sways: true,
        swayIntensity: 4,
    }),
    rightLeg: new BodyPart({
        sprite: "entities/zombie/left_leg",
        offset: { x: 0, y: 74 },
        rotationOrigin: { x: 4, y: 0 },
        zIndex: -1,
        sways: true,
        swayIntensity: 4,
    }),
};
