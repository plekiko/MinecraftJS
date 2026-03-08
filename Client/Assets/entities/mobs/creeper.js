class Creeper extends Mob {
    constructor({
        health = 20,
        noAi = false,
        position = new Vector2(),
        invulnerable = false,
        myChunkX = 0,
        body = createCreeperBody(),
    } = {}) {
        super({
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
        this.explosionRadius = 3 * BLOCK_SIZE;
        this.explosionDamage = 12;
        this.explosionPower = 12;
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
        if (!player || !player.abilities.hasHealth) return;

        const distance = Vector2.Distance(this.position, player.position);
        if (distance <= 2.5 * BLOCK_SIZE) {
            this.primed = true;
            this.fuse = this.fuseMax;
            PlayRandomSoundFromArray({
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
                const phase = (Date.now() % this.primedPulsePeriod) / this.primedPulsePeriod;
                this.body.flashingColor = phase < 0.5 ? "white" : null;
            }
        }
    }

    explode() {
        PlayRandomSoundFromArray({
            array: Sounds.Explosion,
            positional: true,
            origin: this.position,
        });

        const entitiesInRange = this.getEntitiesInRadius(this.explosionRadius);
        entitiesInRange.forEach((entity) => {
            if (entity !== this && !entity.invulnerable) {
                const distance = Vector2.Distance(
                    this.position,
                    entity.position
                );
                const damage = this.calculateDamage(distance);
                if (typeof entity.hit === "function") entity.hit(damage);
                if (entity.type === EntityTypes.Drop) {
                    removeEntity(entity);
                    return;
                }
                const knockbackForce = this.calculateKnockback(distance);
                const dx = entity.position.x - this.position.x;
                const dy = entity.position.y - this.position.y;
                const angle = Math.atan2(dy, dx);
                entity.knockBack(
                    this.position.x - this.hitbox.x / 2,
                    knockbackForce * Math.cos(angle)
                );
            }
        });

        this.destroyBlocksInRadius();
    }

    getEntitiesInRadius(radius) {
        const nearbyEntities = [];
        for (let entity of entities) {
            const distance = Vector2.Distance(this.position, entity.position);
            if (distance <= radius) {
                nearbyEntities.push(entity);
            }
        }
        return nearbyEntities;
    }

    calculateDamage(distance) {
        const maxDistance = this.explosionRadius;
        const damageFactor = 1 - distance / maxDistance;
        return Math.max(0, Math.round(this.explosionDamage * damageFactor));
    }

    calculateKnockback(distance) {
        const maxDistance = this.explosionRadius;
        const knockbackFactor = (1 - distance / maxDistance) / 5;
        return Math.max(0, this.explosionPower * BLOCK_SIZE * knockbackFactor);
    }

    destroyBlocksInRadius() {
        const startX = Math.floor(this.position.x / BLOCK_SIZE);
        const startY = Math.floor(this.position.y / BLOCK_SIZE);
        const maxPower = this.explosionPower;

        const visited = new Set();
        const queue = [[startX, startY, maxPower]];

        while (queue.length > 0) {
            const [x, y, power] = queue.shift();

            const worldX = x * BLOCK_SIZE;
            const worldY = y * BLOCK_SIZE;
            const distance = Math.sqrt(
                Math.pow(worldX - this.position.x, 2) +
                    Math.pow(worldY - this.position.y, 2)
            );

            if (distance > this.explosionRadius || power <= 0) continue;

            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const block = GetBlockAtWorldPosition(worldX, worldY);
            if (!block) continue;

            const blockDef = GetBlock(block.blockType);
            if (!blockDef) continue;

            const resistance = blockDef.hardness || 0;
            const powerThreshold = resistance + 1;

            if (power >= powerThreshold) {
                if (blockDef.hardness >= 0) {
                    if (blockDef.specialType === SpecialType.TNT) {
                        block.explode(true);
                    } else {
                        block.breakBlock(blockDef.dropWithoutTool);
                        setBlockType(block, Blocks.Air);
                    }
                }

                const reducedPower = power - 1 - resistance * 0.3;
                if (reducedPower > 0) {
                    queue.push([x, y - 1, reducedPower]);
                    queue.push([x, y + 1, reducedPower]);
                    queue.push([x - 1, y, reducedPower]);
                    queue.push([x + 1, y, reducedPower]);
                }
            }
        }
    }

    hit(damage, hitfromX = 0, kb = 0) {
        if (!this.health) return;
        if (!this.damage(damage)) return;

        this.knockBack(hitfromX, kb);
        PlayRandomSoundFromArray({
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
                offset: { x: -6, y: 0 },
                rotationOrigin: { x: 12, y: 32 },
                zIndex: 1,
                eyes: true,
            }),
            torso: new BodyPart({
                spriteCrop: { x: 20, y: 8, width: 4, height: 10 },
                offset: { x: 0, y: 33 },
            }),
            back_back_leg: new BodyPart({
                spriteCrop: { x: 4, y: 20, width: 4, height: 6 },
                offset: { x: -8, y: 72 },
                rotationOrigin: { x: 4, y: 0 },
                zIndex: -1,
                sways: true,
                swayIntensity: 4,
                swayPhase: Math.PI,
            }),
            back_leg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 6 },
                offset: { x: -8, y: 72 },
                rotationOrigin: { x: 4, y: 0 },
                zIndex: 1,
                sways: true,
                swayIntensity: -4,
            }),
            front_back_leg: new BodyPart({
                spriteCrop: { x: 4, y: 20, width: 4, height: 6 },
                offset: { x: 4, y: 72 },
                rotationOrigin: { x: 4, y: 0 },
                zIndex: -1,
                sways: true,
                swayIntensity: -4,
                swayPhase: Math.PI,
            }),
            front_leg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 6 },
                offset: { x: 8, y: 72 },
                rotationOrigin: { x: 4, y: 0 },
                zIndex: 1,
                sways: true,
                swayIntensity: 4,
            }),
        },
    });
}
