class Mob extends Entity {
    constructor({
        name = "Mob",
        health = 10,
        noAi = false,
        position = new Vector2(),
        hitbox = new Vector2(1, 1),
        invulnerable = false,
        type = EntityTypes.Mob,
        float = true,
        ai,
        speed = 2,
        body = null,
        stepSize = 1,
        footstepSounds = null,
        ambientSounds = null,
        ambientSoundRange = { min: 5, max: 20 },
        lootTable = null,
        myChunkX = 0,
        burnInSunlight = false,
    } = {}) {
        super({
            name: name,
            position: position,
            hitbox: hitbox,
            float: float,
            invulnerable: invulnerable,
            type: type,
            body: body,
            direction: -1,
            forceDirection: true,
            stepSize: stepSize,
            footstepSounds: footstepSounds,
            direction: RandomRange(0, 2) ? 1 : -1,
            maxVelocity: new Vector2(speed * BLOCK_SIZE * 1.5, 1000),
            myChunkX: myChunkX,
        });

        this.health = health;
        this.maxHealth = health;
        this.noAi = noAi;
        this.speed = speed;
        this.ai = ai;
        this.timeLastMoved = 0;
        this.ambientSounds = ambientSounds;
        this.ambientSoundCounter = 0;
        this.ambientSoundRange = ambientSoundRange;
        this.ambientSoundTarget = RandomRange(
            this.ambientSoundRange.min,
            this.ambientSoundRange.max
        );
        this.randomMoveTime = RandomRange(0, ai.moveTimeRange.max / 2);
        this.moving = false;

        this.lootTable = lootTable;

        this.state = aiState.Wander;

        this.attackCooldown = 1;

        this.attackCooldownMax = 1;

        this.burnInSunlight = burnInSunlight;
    }

    aiUpdate() {
        switch (this.state) {
            case aiState.Wander:
                this.passiveWander();
                break;
            case aiState.Agression:
                this.agressionWalk();
        }

        if (this.burnInSunlight) {
            if (this.getSunLight() && this.getLightLevel() >= 14) {
                this.fire = 100;
            }
        }

        if (this.ai.agressionLevel === Agression.Agressive)
            this.agressionBehaviour();

        this.ambientLogic();

        this.attackCooldownLogic();

        this.getOutOfBlocks();
    }

    getOutOfBlocks() {
        const collidingWith = this.isCollidingWithBlockType();
        if (
            this.filterBlocksByProperty(collidingWith, "collision").length >
                0 &&
            this.filterBlocksByProperty(collidingWith, "fluid").length === 0
        ) {
            this.position.y -= BLOCK_SIZE;
        }
    }

    attackCooldownLogic() {
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;

        if (this.attackCooldown < 0) this.attackCooldown = 0;
    }

    agressionBehaviour() {
        if (!player) return;
        if (!player.abilities.hasHealth) {
            this.state = aiState.Wander;
            return;
        }

        if (
            Math.abs(Vector2.Distance(this.position, player.position)) <=
            this.ai.agressionArea
        ) {
            this.state = aiState.Agression;
            return;
        }

        this.state = aiState.Wander;
    }

    agressionWalk() {
        if (!player) return;

        this.direction = caculateDirection(this.position, player.position);

        if (this.velocity.x === 0) {
            this.jump();
        }

        if (
            Math.abs(Vector2.XDistance(this.position, player.position)) <
            BLOCK_SIZE / 4
        ) {
            this.targetVelocity.x = 0;
            return;
        }

        this.targetVelocity.x =
            (this.direction < 0 ? -this.speed : this.speed) * BLOCK_SIZE;
    }

    ambientLogic() {
        if (!this.ambientSounds) return;

        if (this.ambientSoundCounter >= this.ambientSoundTarget) {
            this.ambientSoundCounter = 0;
            this.ambientSoundTarget = RandomRange(
                this.ambientSoundRange.min,
                this.ambientSoundRange.max
            );

            PlayRandomSoundFromArray({
                array: this.ambientSounds,
                positional: true,
                origin: this.position,
                range: 7,
            });
        }

        this.ambientSoundCounter += deltaTime;
    }

    passiveWander() {
        this.timeLastMoved += deltaTime;

        if (this.timeLastMoved >= this.randomMoveTime) {
            if (!this.moving) this.moveToRandomX();
            else {
                this.moving = false;
                this.resetMoveTime();
            }
        }

        // chat.message(`${this.timeLastMoved} - ${this.randomMoveTime}`);

        if (this.moving) {
            if (
                this.velocity.x === 0 &&
                this.moving &&
                this.timeLastMoved > 0.2
            ) {
                this.jump();
            }

            this.targetVelocity.x =
                (this.direction < 0 ? -this.speed : this.speed) * BLOCK_SIZE;
        }
    }

    dropLoot() {
        if (!this.lootTable) return;
        if (!GAMERULES.doMobLoot) return;

        const loot = this.lootTable.getRandomLoot();

        loot.forEach((item) => {
            summonEntity(
                Drop,
                new Vector2(
                    this.position.x +
                        RandomRange(-this.hitbox.x, this.hitbox.x),
                    this.position.y
                ),
                {
                    blockId: item.blockId,
                    itemId: item.itemId,
                    count: item.count,
                }
            );
        });
    }

    jump() {
        if (!this.grounded) return;

        this.velocity.y = -9 * BLOCK_SIZE;
    }

    resetMoveTime() {
        this.timeLastMoved = 0;
        this.randomMoveTime = RandomRange(
            this.ai.moveTimeRange.min,
            this.ai.moveTimeRange.max
        );
    }

    moveToRandomX() {
        this.moving = true;
        this.direction = RandomRange(0, 2) == 1 ? 1 : -1;
        this.resetMoveTime();
    }
}

class aiType {
    constructor({
        moveTimeRange = { min: 1, max: 10 },
        agressionLevel = Agression.Passive,
        agressionArea = 0,
    } = {}) {
        this.moveTimeRange = moveTimeRange;
        this.agressionLevel = agressionLevel;
        this.agressionArea = agressionArea * BLOCK_SIZE;
    }
}

const Agression = Object.freeze({
    Passive: 0,
    Agressive: 1,
    Neutral: 2,
});

const aiState = Object.freeze({
    Wander: 0,
    Agression: 1,
});

const AI = Object.freeze({
    PassiveSimple: new aiType({
        moveTimeRange: { min: 3, max: 7 },
    }),
    Zombie: new aiType({
        moveTimeRange: { min: 3, max: 7 },
        agressionLevel: Agression.Agressive,
        agressionArea: 11,
    }),
});
