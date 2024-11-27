class Mob extends Entity {
    constructor({
        health = 10,
        noAi = false,
        position = new Vector2(),
        hitbox = new Vector2(1, 1),
        invulnerable = false,
        type = EntityTypes.Mob,
        ai,
        speed = 2,
        body = null,
    } = {}) {
        super({
            position: position,
            hitbox: hitbox,
            invulnerable: invulnerable,
            type: type,
            body: body,
            direction: -1,
            forceDirection: true,
            direction: RandomRange(0, 2) ? 1 : -1,
            maxVelocity: new Vector2(speed * BLOCK_SIZE * 1.5, 1000),
        });

        this.health = health;
        this.maxHealth = health;
        this.noAi = noAi;
        this.speed = speed;
        this.ai = ai;
        this.timeLastMoved = 0;
        this.randomMoveTime = RandomRange(
            ai.moveTimeRange.min,
            ai.moveTimeRange.max
        );
        this.moving = false;
    }

    aiUpdate(deltaTime) {
        this.passiveMob(deltaTime);
    }

    passiveMob(deltaTime) {
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

    jump() {
        if (!this.grounded) return;

        this.velocity.y = -8 * BLOCK_SIZE;
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
        angerZone = 6,
    } = {}) {
        this.moveTimeRange = moveTimeRange;
        this.agressionLevel = agressionLevel;
        this.angerZone = angerZone * BLOCK_SIZE;
    }
}

const Agression = Object.freeze({
    Passive: 0,
    Agressive: 1,
    Neutral: 2,
});

const AI = Object.freeze({
    Pig: new aiType({
        moveTimeRange: { min: 3, max: 7 },
    }),
});
