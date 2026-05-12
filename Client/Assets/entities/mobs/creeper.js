class Creeper extends Mob {
    constructor(
        world,
        {
            health = 20,
            noAi = false,
            position = new Vector2(),
            invulnerable = false,
            myChunkX = 0,
            body = createCreeperBody(),
        } = {}
    ) {
        super(world, {
            name: "Creeper",
            health: health,
            position: position,
            burnInSunlight: false,
            hitbox: new Vector2(0.6 * BLOCK_SIZE, 1.5 * BLOCK_SIZE),
            invulnerable: invulnerable,
            body: body,
            noAi: noAi,
            ai: AI.Zombie,
            speed: 1,
            stepSize: 0.4,
            myChunkX: myChunkX,
            ambientSounds: null,
            footstepSounds: null,
            lootTable: new LootTable([
                new LootItem({
                    itemId: Items.Gunpowder,
                    maxCount: 2,
                    subtract: 1,
                }),
            ]),
        });

        this.fuse = -1;
        this.fuseMax = 30;
        this.primed = false;
        this.primedPulsePeriod = 600; // ms per full pulse cycle
    }

    update() {
        this.updateEntity();
        if (!this.primed) {
            this.aiUpdate();
            this.checkPrime();
        }
    }

    checkPrime() {
        if (!this.world.player || !this.world.player.abilities.hasHealth)
            return;

        const distance = Vector2.Distance(
            this.position,
            this.world.player.position
        );
        if (distance <= 2.5 * BLOCK_SIZE) {
            this.primed = true;
            this.fuse = this.fuseMax;
            playRandomSoundFromArray({
                array: Sounds.TNT_Fuse,
                positional: true,
                origin: this.position,
            });
        }
    }

    tickUpdate() {
        this.entityTickUpdate();

        if (this.primed) {
            this.fuse--;
            if (this.fuse <= 0) {
                this.explode();
                removeEntity(this);
            } else if (this.body) {
                // Pulse white: 50% of each cycle show flash
                const phase =
                    (Date.now() % this.primedPulsePeriod) /
                    this.primedPulsePeriod;
                this.body.flashingColor = phase < 0.5 ? "white" : null;
            }
        }
    }

    explode() {
        this.world.createExplosion(this.position, {
            radius: 3 * BLOCK_SIZE,
            damage: 12,
            power: 12,
            excludeEntity: this,
            destroyTerrain: GAMERULES.doMobGriefing,
        });
    }

    hit(damage, hitfromX = 0, kb = 0) {
        if (!this.health) return;
        if (!this.damage(damage)) return;

        this.knockBack(hitfromX, kb);
        playRandomSoundFromArray({
            array: Sounds.Creeper_Hurt,
            positional: true,
            origin: this.position,
        });

        // reset fuse when punched
        if (this.primed) {
            this.primed = false;
            this.fuse = -1;
        }
    }

    dieEvent() {
        this.dropLoot();
        playPositionalSound(this.position, "mobs/creeper/death.ogg");
        removeEntity(this);
    }

    interact(player, item) {}
}

function createCreeperBody() {
    return new Body({
        flipCorrection: 0,
        sprite: "creeper/creeper",
        parts: {
            head: new BodyPart({
                spriteCrop: { x: 16, y: 0, width: 8, height: 8 },
                offset: { x: -6, y: 5 },
                rotationOrigin: { x: 12, y: 32 },
                zIndex: 1,
                eyes: true,
            }),
            torso: new BodyPart({
                spriteCrop: { x: 20, y: 8, width: 4, height: 10 },
                offset: { x: 0, y: 37 },
            }),
            back_back_leg: new BodyPart({
                spriteCrop: { x: 4, y: 20, width: 4, height: 6 },
                offset: { x: -8, y: 75 },
                rotationOrigin: { x: 4, y: 0 },
                zIndex: -1,
                sways: true,
                swayIntensity: 4,
                swayPhase: Math.PI,
            }),
            back_leg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 6 },
                offset: { x: -8, y: 75 },
                rotationOrigin: { x: 4, y: 0 },
                zIndex: 1,
                sways: true,
                swayIntensity: -4,
            }),
            front_back_leg: new BodyPart({
                spriteCrop: { x: 4, y: 20, width: 4, height: 6 },
                offset: { x: 4, y: 75 },
                rotationOrigin: { x: 4, y: 0 },
                zIndex: -1,
                sways: true,
                swayIntensity: -4,
                swayPhase: Math.PI,
            }),
            front_leg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 6 },
                offset: { x: 8, y: 75 },
                rotationOrigin: { x: 4, y: 0 },
                zIndex: 1,
                sways: true,
                swayIntensity: 4,
            }),
        },
    });
}
