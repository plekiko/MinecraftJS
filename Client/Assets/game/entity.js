const EntityTypes = Object.freeze({
  Drop: 0,
  Player: 1,
  Entity: 2,
  Mob: 3,
  Projectile: 4,
});

class Entity {
  constructor({
    UUID = uuidv4(),
    name = "Entity",
    position = new Vector2(),
    rotation = new Vector2(),
    hitbox = new Vector2(1, 1),
    velocity = new Vector2(),
    targetVelocity = new Vector2(),
    maxStepHeight = BLOCK_SIZE / 2,
    acceleration = 90,
    maxVelocity = new Vector2(1000, 1000),
    noGravity = false,
    invulnerable = false,
    sprite = null,
    cutoff = 0,
    spriteScale = 2,
    dark = false,
    outline = 0,
    color = "black",
    opacity = 1,
    drag = 40,
    bouncing = false,
    type = EntityTypes.Entity,
    stepSize = 1,
    footstepSounds = null,
    noCollision = false,
    myChunkX = null,
    canSwim = true,
    offset = new Vector2(),
    float = false,
    playWaterEnterSound = true,
    forceDirection = false,
    fallDamage = false,
    body = null,
    despawn = true,
    direction = 1,
    holdItem = new InventoryItem(),

    maxPortalCooldown = 40,

    dimension = Dimensions.Overworld,

    fire = -20,
  } = {}) {
    this.UUID = UUID;
    this.name = name;
    this.position = position;
    this.rotation = rotation;
    this.hitbox = hitbox;
    this.velocity = velocity;
    this.targetVelocity = targetVelocity;
    this.acceleration = acceleration;
    this.maxVelocity = maxVelocity;
    this.grounded = false;
    this.standingOnBlockType = null;
    this.noGravity = noGravity;
    this.maxStepHeight = maxStepHeight;
    this.myChunkX = myChunkX;
    this.noCollision = noCollision;
    this.wasColliding = false;
    this.fallDistance = 0;
    this.fallDamage = fallDamage;
    this.invulnerable = invulnerable;
    this.type = type;
    this.canSwim = canSwim;
    this.isGettingKnockback = false;
    this.knockBackBuffer = false;
    this.forceDirection = forceDirection;
    this.float = float;
    this.playWaterEnterSound = playWaterEnterSound;
    this.collidingWithBlocks = [];
    this.direction = direction;
    this.sprite = sprite;
    this.cutoff = cutoff;
    this.body = body;
    this.dark = dark;

    this.img = new Image();
    this.img.src = sprite ? sprite : "";

    this.despawn = despawn;

    this.spriteScale = spriteScale;
    this.outline = outline;
    this.color = color;
    this.opacity = opacity;
    this.originalColor = color;
    this.drag = drag;
    this.bouncing = bouncing;
    this.offset = offset;
    this.lookDirection = 0;
    this.swimming = false;
    this.originDate = Date.now();
    this.stepCounter = 0;
    this.stepSize = stepSize;
    this.footstepSounds = footstepSounds;
    this.wasCollidingWithBlocks = [];
    this.holdItem = holdItem;
    this.shouldAddForce = { x: 0, y: 0 };
    this.hurtCooldown = 0.3;

    this.portalCooldown = maxPortalCooldown;
    this.maxPortalCooldown = maxPortalCooldown;

    this.hasVisualFire = false;
    this.fire = fire;
    this.fireMin = fire;
    this.fireDamageTimer = 0;

    this.flashingColor = false;

    this.dimension = dimension;

    this.fireSprite = new SimpleSprite({
      sprite: "blocks/fire_layer_0",
      transform: new Transform(),
      frameRate: 1,
    });
  }

  rotateToPoint(targetPosition, objectPosition) {
    const centerX = objectPosition.x;
    const centerY = objectPosition.y;
    const dx = targetPosition.x - centerX;
    const dy = targetPosition.y - centerY;
    const angle = Math.atan2(dy, dx);
    const rotationInDegrees = (angle * 180) / Math.PI;
    return rotationInDegrees;
  }

  addForce(x = 0, y = 0) {
    if (
      this.filterBlocksByProperty(this.collidingWithBlocks, "collision")
        .length > 0
    ) {
      this.shouldAddForce = { x: 0, y: 0 };
      this.isGettingKnockback = false;
      return;
    }
    this.shouldAddForce.x += x * BLOCK_SIZE;
    this.shouldAddForce.y += y * BLOCK_SIZE;
  }

  getBlockAtPosition(worldX, worldY) {
    worldX = Math.floor(worldX / BLOCK_SIZE) * BLOCK_SIZE;
    worldY = Math.floor(worldY / BLOCK_SIZE) * BLOCK_SIZE;
    return GetBlockAtWorldPosition(worldX, worldY);
  }

  isFluid(blockType) {
    return GetBlock(blockType).fluid;
  }

  checkDownCollision(futureY) {
    const blockBelowRight = this.getBlockAtPosition(
      this.position.x + this.hitbox.x,
      futureY + this.hitbox.y
    );
    const blockBelowLeft = this.getBlockAtPosition(
      this.position.x,
      futureY + this.hitbox.y
    );

    const checkBlockWithCutoff = (block, x, y) => {
      if (!block || !this.isSolid(block.blockType)) return null;
      const def = GetBlock(block.blockType);
      if (!def.collision) return null;
      const effectiveHeight = BLOCK_SIZE * (1 - block.cutoff);
      const blockTopY =
        block.transform.position.y + (BLOCK_SIZE - effectiveHeight);
      if (y >= blockTopY && y <= block.transform.position.y + BLOCK_SIZE) {
        return block;
      }
      return null;
    };

    if (blockBelowLeft) {
      const collision = checkBlockWithCutoff(
        blockBelowLeft,
        this.position.x,
        futureY + this.hitbox.y
      );
      if (collision) return collision;
    }
    if (blockBelowRight) {
      const collision = checkBlockWithCutoff(
        blockBelowRight,
        this.position.x + this.hitbox.x,
        futureY + this.hitbox.y
      );
      if (collision) return collision;
    }
    return null;
  }

  checkLeftCollision(futureX) {
    const blockLeft = this.getBlockAtPosition(
      futureX,
      this.position.y + this.hitbox.y / 2
    );
    const blockLeftBottom = this.getBlockAtPosition(
      futureX,
      this.position.y + this.hitbox.y
    );
    const blockLeftTop = this.getBlockAtPosition(futureX, this.position.y);

    const checkBlockWithCutoff = (block, x, y) => {
      if (!block || !this.isSolid(block.blockType)) return null;
      const def = GetBlock(block.blockType);
      if (!def.collision) return null;
      const effectiveHeight = BLOCK_SIZE * (1 - block.cutoff);
      const blockTopY =
        block.transform.position.y + (BLOCK_SIZE - effectiveHeight);
      if (
        this.position.y + this.hitbox.y > blockTopY &&
        this.position.y < block.transform.position.y + BLOCK_SIZE &&
        x < block.transform.position.x + BLOCK_SIZE
      ) {
        return block;
      }
      return null;
    };

    if (blockLeft && checkBlockWithCutoff(blockLeft, futureX, this.position.y))
      return blockLeft;
    if (
      blockLeftBottom &&
      checkBlockWithCutoff(blockLeftBottom, futureX, this.position.y)
    )
      return blockLeftBottom;
    if (
      blockLeftTop &&
      checkBlockWithCutoff(blockLeftTop, futureX, this.position.y)
    )
      return blockLeftTop;
    return null;
  }

  checkRightCollision(futureX) {
    const blockRight = this.getBlockAtPosition(
      futureX + this.hitbox.x,
      this.position.y + this.hitbox.y / 2
    );
    const blockRightBottom = this.getBlockAtPosition(
      futureX + this.hitbox.x,
      this.position.y + this.hitbox.y
    );
    const blockRightTop = this.getBlockAtPosition(
      futureX + this.hitbox.x,
      this.position.y
    );

    const checkBlockWithCutoff = (block, x, y) => {
      if (!block || !this.isSolid(block.blockType)) return null;
      const def = GetBlock(block.blockType);
      if (!def.collision) return null;
      const effectiveHeight = BLOCK_SIZE * (1 - block.cutoff);
      const blockTopY =
        block.transform.position.y + (BLOCK_SIZE - effectiveHeight);
      if (
        this.position.y + this.hitbox.y > blockTopY &&
        this.position.y < block.transform.position.y + BLOCK_SIZE &&
        x > block.transform.position.x
      ) {
        return block;
      }
      return null;
    };

    if (
      blockRight &&
      checkBlockWithCutoff(blockRight, futureX + this.hitbox.x, this.position.y)
    )
      return blockRight;
    if (
      blockRightBottom &&
      checkBlockWithCutoff(
        blockRightBottom,
        futureX + this.hitbox.x,
        this.position.y
      )
    )
      return blockRightBottom;
    if (
      blockRightTop &&
      checkBlockWithCutoff(
        blockRightTop,
        futureX + this.hitbox.x,
        this.position.y
      )
    )
      return blockRightTop;
    return null;
  }

  checkUpCollision(futureY) {
    const blockUpRight = this.getBlockAtPosition(
      this.position.x + this.hitbox.x,
      futureY
    );
    const blockUpLeft = this.getBlockAtPosition(this.position.x, futureY);

    if (blockUpLeft && this.isSolid(blockUpLeft.blockType)) {
      return blockUpLeft;
    }
    if (blockUpRight && this.isSolid(blockUpRight.blockType)) {
      return blockUpRight;
    }
    return null;
  }

  knockBack(fromX, kb) {
    this.isGettingKnockback = true;
    this.addForce(fromX < this.position.x ? kb : -kb, this.grounded ? -kb : 0);
  }

  hurtCooldownLogic() {
    if (!this.hurtCooldown) return;
    this.hurtCooldown -= deltaTime;
    if (this.hurtCooldown <= 0) this.hurtCooldown = 0;
  }

  damage(damage) {
    if (this.hurtCooldown) return false;
    this.hurtCooldown = 0.3;
    this.flashColor();
    this.decreaseHealth(damage);
    return true;
  }

  forceDamage(damage) {
    this.flashColor();
    this.decreaseHealth(damage);
  }

  decreaseHealth(amount) {
    if (this.health === undefined) return;
    this.health -= amount;
    if (this.health <= 0) this.die();
    return this.health;
  }

  addHealth(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
    return this.health;
  }

  die() {
    this.health = 0;
    this.fire = this.fireMin;
    this.dieEvent();
  }

  setOnGround() {
    const currentChunk = this.getCurrentChunk();
    if (!currentChunk) return;
    const groundLevel = currentChunk.findGroundLevel(this.getXInChunk());
    if (groundLevel === 0) return false;
    const y = (CHUNK_HEIGHT - groundLevel) * BLOCK_SIZE - (this.hitbox.y - 1);
    this.position.y = y;
  }

  getXInChunk() {
    const chunkOriginX = this.getCurrentChunk().x;
    const relativeX = this.position.x - chunkOriginX;
    const xInChunk = Math.floor(relativeX / BLOCK_SIZE);
    return xInChunk;
  }

  flashColor(color = "red", duration = 0.05) {
    if (!this.body) {
      this.flashingColor = true;
      this.color = color;
      setTimeout(() => {
        this.color = this.originalColor;
        this.flashingColor = false;
      }, duration * 1000);
      return;
    }
    this.body.flashColor(color, duration);
  }

  getCurrentChunk() {
    const chunkPosition =
      Math.floor(this.position.x / (CHUNK_WIDTH * BLOCK_SIZE)) *
      CHUNK_WIDTH *
      BLOCK_SIZE;
    if (!getDimensionChunks(this.dimension).has(chunkPosition)) return null;
    return getDimensionChunks(this.dimension).get(chunkPosition);
  }

  isSolid(blockType) {
    if (GetBlock(blockType).fluid) return false;
    return GetBlock(blockType).collision;
  }

  updateEntity() {
    this.calculateGravity();
    this.updatePositionWithVelocity();
    this.bounceSprite();
    this.playFootstepSounds();
    this.hurtCooldownLogic();
    this.body?.updateBody(this.velocity.x, this.grounded, this.lookDirection);
  }

  footstepEmitterLogic() {
    if (!this.footstepEmitter) return;
    if (!this.grounded) return;
    if (this.velocity.x === 0) return;

    const averageColor = getSpriteAverageColor(
      "blocks/" + GetBlock(this.standingOnBlockType).iconSprite
    );

    if (!averageColor || averageColor === "#000000") return;

    this.footstepEmitter.color = averageColor;

    this.footstepEmitter.x = this.position.x + this.hitbox.x / 2;
    this.footstepEmitter.y = this.position.y + this.hitbox.y - 10;

    this.footstepEmitter.emitSingle();
  }

  entityTickUpdate() {
    this.fireLogic();
    this.voidLogic();
    this.portalLogic();
    this.footstepEmitterLogic();
  }

  portalLogic() {
    if (this.type !== EntityTypes.Player) return;

    let collidingWithPortal = false;

    if (
      this.filterBlocksByProperty(this.collidingWithBlocks, "specialType")
        .length > 0
    ) {
      for (let block of this.collidingWithBlocks) {
        const blockData = GetBlock(block.blockType);

        if (blockData.specialType !== SpecialType.NetherPortal) {
          collidingWithPortal = false;
          break;
        }

        collidingWithPortal = true;

        if (this.portalCooldown > 0) {
          this.portalCooldown--;
          break;
        }

        if (activeDimension !== Dimensions.Nether) {
          const gotoPosition = placePortalInDimension(
            Dimensions.Nether,
            new Vector2(
              block.transform.position.x / 8,
              block.transform.position.y
            )
          );

          gotoDimension(Dimensions.Nether);

          this.position.x = gotoPosition.x;
          this.position.y = gotoPosition.y;

          this.portalCooldown = this.maxPortalCooldown;

          break;
        } else {
          const gotoPosition = placePortalInDimension(
            Dimensions.Overworld,
            new Vector2(
              block.transform.position.x * 8,
              block.transform.position.y
            )
          );

          gotoDimension(Dimensions.Overworld);

          this.position.x = gotoPosition.x;
          this.position.y = gotoPosition.y;

          this.portalCooldown = this.maxPortalCooldown;

          break;
        }
      }

      if (!collidingWithPortal) this.portalCooldown = this.maxPortalCooldown;
    } else {
      this.portalCooldown = this.maxPortalCooldown;
    }
  }

  fireLogic() {
    // When standing on Fire or Lava
    if (this.noCollision) {
      this.fire = this.fireMin;
      this.hasVisualFire = false;
      return;
    }

    if (this.type === EntityTypes.Drop) {
      if (this.fireDamageTimer >= 9) {
        if (GAMERULES.doFireTick) removeEntity(this);
        return;
      }
    }

    if (
      this.filterBlocksByProperty(this.collidingWithBlocks, "fire").length > 0
    ) {
      // Check for lava
      if (this.filterBlocksByProperty(this.collidingWithBlocks, "fluid")) {
        this.fire = 100;
      }

      if (this.fire >= 100) {
        this.fire = 100;
      } else {
        this.fire += 4;
      }
    }

    // When touching Water
    if (
      this.filterBlocksByProperty(this.collidingWithBlocks, "extinguishEntity")
        .length > 0
    ) {
      if (this.fire > this.fireMin) {
        playPositionalSound(this.position, "blocks/fizz.ogg");
        this.fire = this.fireMin;
      }
    }

    if (this.fire > this.fireMin) {
      this.fire--;
    }

    if (this.fire <= 0) {
      this.hasVisualFire = false;
      this.fireDamageTimer = 0;
      return;
    } else {
      this.hasVisualFire = true;
    }

    this.fireDamageTimer++;
    if (this.fireDamageTimer >= 10) {
      if (GAMERULES.doFireTick) this.hit(1);
      this.fireDamageTimer = 0;
    }
  }

  voidLogic() {
    if (this.position.y > CHUNK_HEIGHT * BLOCK_SIZE) {
      this.hit(2);
    }
  }

  swing() {
    if (!this.body) return;
    this.body.swing();
  }

  bounceSprite() {
    this.offset.y = 0;
    if (!this.bouncing) return;
    if (!this.grounded) return;
    this.offset.y = Math.sin((Date.now() - this.originDate) / 120) * 1.5;
  }

  calculateGravity() {
    if (this.noGravity) return;
    this.velocity.y += GRAVITY * Math.min(deltaTime, 1 / 30);
  }

  calculateForce() {
    this.velocity.x += this.shouldAddForce.x;
    this.velocity.y += this.shouldAddForce.y;
    this.shouldAddForce = { x: 0, y: 0 };
  }

  handleTargetVelocity() {
    if (this.isGettingKnockback) return;
    if (this.targetVelocity.x === 0) return;
    if (this.velocity.x < this.targetVelocity.x) {
      this.velocity.x += this.acceleration * BLOCK_SIZE * deltaTime;
      if (this.velocity.x > this.targetVelocity.x) {
        this.velocity.x = this.targetVelocity.x;
      }
    }
    if (this.velocity.x > this.targetVelocity.x) {
      this.velocity.x -= this.acceleration * BLOCK_SIZE * deltaTime;
      if (this.velocity.x < this.targetVelocity.x) {
        this.velocity.x = this.targetVelocity.x;
      }
    }
    this.targetVelocity = new Vector2();
  }

  updatePositionWithVelocity() {
    this.wasColliding = false;

    this.handleTargetVelocity();

    // Cap deltaTime to avoid huge jumps
    const cappedDeltaTime = Math.min(deltaTime, 1 / 30);
    const nextPositionX = this.position.x + this.velocity.x * cappedDeltaTime;
    const nextPositionY = this.position.y + this.velocity.y * cappedDeltaTime;

    this.applyDrag();
    this.clampHorizontalVelocity();

    if (this.noCollision) {
      this.calculateForce();
      this.position.x += this.velocity.x * cappedDeltaTime;
      this.position.y += this.velocity.y * cappedDeltaTime;
      return;
    }

    const leftCollision = this.checkLeftCollision(nextPositionX);
    const rightCollision = this.checkRightCollision(nextPositionX);

    if (!this.forceDirection) this.direction = this.velocity.x < 0 ? -1 : 1;

    let steppedUp = false;

    if (nextPositionX > this.position.x) {
      if (rightCollision && this.grounded) {
        const effectiveHeight = BLOCK_SIZE * (1 - rightCollision.cutoff);
        const blockTopY =
          rightCollision.transform.position.y + (BLOCK_SIZE - effectiveHeight);
        const entityBottomY = this.position.y + this.hitbox.y;
        const heightDifference = entityBottomY - blockTopY;

        if (heightDifference > 0 && heightDifference <= this.maxStepHeight) {
          const newY = blockTopY - this.hitbox.y;
          const checkAbove = this.checkUpCollision(newY);
          const blockAboveSlab = GetBlockAtWorldPosition(
            rightCollision.transform.position.x,
            blockTopY - BLOCK_SIZE
          );

          if (
            !checkAbove &&
            (!blockAboveSlab || !GetBlock(blockAboveSlab.blockType).collision)
          ) {
            this.position.y = newY;
            this.velocity.y = 0;
            this.position.x += 3;
            steppedUp = true;
          }
        }
        if (!steppedUp) {
          this.wasColliding = true;
          this.velocity.x = 0;
        }
      }
    }
    if (nextPositionX < this.position.x) {
      if (leftCollision && this.grounded) {
        const effectiveHeight = BLOCK_SIZE * (1 - leftCollision.cutoff);
        const blockTopY =
          leftCollision.transform.position.y + (BLOCK_SIZE - effectiveHeight);
        const entityBottomY = this.position.y + this.hitbox.y;
        const heightDifference = entityBottomY - blockTopY;

        if (heightDifference > 0 && heightDifference <= this.maxStepHeight) {
          const newY = blockTopY - this.hitbox.y;
          const checkAbove = this.checkUpCollision(newY);
          const blockAboveSlab = GetBlockAtWorldPosition(
            leftCollision.transform.position.x,
            blockTopY - BLOCK_SIZE
          );

          if (
            !checkAbove &&
            (!blockAboveSlab || !GetBlock(blockAboveSlab.blockType).collision)
          ) {
            this.position.y = newY;
            this.velocity.y = 0;
            this.position.x -= 3;
            steppedUp = true;
          }
        }
        if (!steppedUp) {
          this.wasColliding = true;
          this.velocity.x = 0;
        }
      }
    }

    this.clampVerticalVelocity();

    const upCollision = this.checkUpCollision(nextPositionY);
    const downCollision = this.checkDownCollision(nextPositionY);

    this.collidingWithBlocks = this.isCollidingWithBlockType();

    const collidingBlocks = this.collidingWithBlocks;

    this.wasCollidingWithBlocks.forEach((block) => {
      if (!collidingBlocks.includes(block)) {
        block.endEntityCollision(this);
        this.wasCollidingWithBlocks = this.wasCollidingWithBlocks.filter(
          (b) => b !== block
        );
      }
    });

    collidingBlocks.forEach((block) => {
      block.entityCollision(this);
      if (!this.wasCollidingWithBlocks.includes(block)) {
        block.startEntityCollision(this);
        this.wasCollidingWithBlocks.push(block);
      }
    });

    if (!upCollision) {
      if (downCollision && !steppedUp) {
        this.standingOnBlockType = downCollision.blockType;
        this.wasColliding = true;
        const effectiveHeight = BLOCK_SIZE * (1 - downCollision.cutoff);
        const blockTopY =
          downCollision.transform.position.y + (BLOCK_SIZE - effectiveHeight);
        this.position.y = blockTopY - this.hitbox.y;
        this.ground();
      } else if (!steppedUp) {
        this.grounded = false;
      }
    } else {
      this.wasColliding = true;
      this.velocity.y = 0;
    }

    this.fluidLogic(collidingBlocks, cappedDeltaTime);
    this.calculateForce();

    if (!this.grounded && !this.swimming)
      this.fallDistance += (this.velocity.y / BLOCK_SIZE) * cappedDeltaTime;
    else this.fallDistance = 0;

    if (!leftCollision && !rightCollision) {
      this.position.x += this.velocity.x * cappedDeltaTime;
    }
    if (!downCollision && !upCollision && !steppedUp) {
      this.position.y += this.velocity.y * cappedDeltaTime;
    }
  }

  ground() {
    this.velocity.y = 0;
    this.grounded = true;
    this.takeFallDamage();
    this.drag = GetBlock(this.standingOnBlockType).drag;
    if (this.knockBackBuffer) {
      this.isGettingKnockback = false;
      this.knockBackBuffer = false;
    }
    if (this.isGettingKnockback) this.knockBackBuffer = true;
  }

  takeFallDamage() {
    if (!this.fallDamage) return;
    if (this.fallDistance < 2) return;
    const damage = Math.round(this.fallDistance - 2);
    if (this.fallDistance < 4)
      playPositionalSound(this.position, "misc/fallsmall.ogg");
    else playPositionalSound(this.position, "misc/fallbig.ogg");
    this.hit(damage);
  }

  fluidLogic(collidingBlocks, deltaTime) {
    this.swimming = false;
    const isCollidingWithFluid =
      this.filterBlocksByProperty(collidingBlocks, "fluid").length > 0;
    if (isCollidingWithFluid && this.canSwim) {
      this.grounded = false;
      if (!this.swimming) {
        this.enterFluid();
      }
      if (this.float) this.floatLogic();
    }
  }

  floatLogic() {
    this.velocity.y += -GRAVITY * 2 * deltaTime;
  }

  playFootstepSounds() {
    if (!this.grounded || Math.abs(this.velocity.x) === 0) return;
    if (!this.standingOnBlockType) return;
    this.stepCounter += Math.abs(this.velocity.x / 100) * deltaTime;
    if (this.stepCounter >= this.stepSize) {
      if (!this.footstepSounds) {
        const block = GetBlock(this.standingOnBlockType);
        if (!block) return;
        this.playFootstepFromBlock(block);
        this.stepCounter -= this.stepSize;
        return;
      }
      PlayRandomSoundFromArray({
        array: this.footstepSounds,
        volume: 0.2,
        positional: true,
        range: 6,
        origin: this.position,
      });
      this.stepCounter -= this.stepSize;
    }
  }

  playFootstepFromBlock(block) {
    const sounds = block.breakingSound;
    if (!sounds) return;
    PlayRandomSoundFromArray({
      array: sounds,
      volume: 0.2,
      positional: true,
      range: 6,
      origin: this.position,
    });
  }

  isCollidingWithBlockType(blockType = null) {
    const collidingBlocks = [];
    const startX = Math.floor(this.position.x / BLOCK_SIZE);
    const endX = Math.floor((this.position.x + this.hitbox.x) / BLOCK_SIZE);
    const startY = Math.floor(this.position.y / BLOCK_SIZE);
    const endY = Math.floor((this.position.y + this.hitbox.y) / BLOCK_SIZE);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const blockX = x * BLOCK_SIZE;
        const blockY = y * BLOCK_SIZE;
        const block = GetBlockAtWorldPosition(blockX, blockY);
        if (block && block.blockType) {
          // If blockType is specified, skip blocks that don't match
          if (blockType !== null && block.blockType !== blockType) {
            continue;
          }

          const effectiveHeight = BLOCK_SIZE * (1 - block.cutoff);
          const blockTopY =
            block.transform.position.y + (BLOCK_SIZE - effectiveHeight);
          const entityBottomY = this.position.y + this.hitbox.y;
          const entityTopY = this.position.y;

          const xOverlap =
            this.position.x < blockX + BLOCK_SIZE &&
            this.position.x + this.hitbox.x > blockX;

          const yOverlap =
            entityBottomY > blockTopY && entityTopY < blockY + BLOCK_SIZE;

          if (xOverlap && yOverlap) {
            collidingBlocks.push(block);
          }
        }
      }
    }
    return collidingBlocks;
  }

  filterBlocksByProperty(blocks, property) {
    return blocks.filter((block) => {
      const blockData = GetBlock(block.blockType);
      return blockData && blockData[property];
    });
  }

  entityCollision(type = 0) {
    for (let other of entities) {
      if (other !== this) {
        if (
          this.position.x < other.position.x + other.hitbox.x &&
          this.position.x + this.hitbox.x > other.position.x &&
          this.position.y < other.position.y + other.hitbox.y &&
          this.position.y + this.hitbox.y > other.position.y
        ) {
          if (other.type === type) return other;
        }
      }
    }
    return false;
  }

  enterFluid() {
    this.swimming = true;
    if (this.velocity.y > BLOCK_SIZE * 5) this.playWaterEnterSFX();
    if (this.float && this.velocity.y > BLOCK_SIZE * 3) {
      this.velocity.y /= 1.1;
    }
  }

  playWaterEnterSFX() {
    if (!this.playWaterEnterSound) return;
    PlayRandomSoundFromArray({
      array: Sounds.Water_Enter,
      positional: true,
      origin: this.position,
      volume: 0.2,
    });
  }

  applyDrag() {
    if (this.targetVelocity.x !== 0) return;
    if (this.isGettingKnockback) return;
    if (this.velocity.x > 0) {
      this.velocity.x -=
        this.drag *
        100 *
        (this.type === EntityTypes.Player ? 1 : 0.2) *
        deltaTime;
      if (this.velocity.x < 0) this.velocity.x = 0;
    } else if (this.velocity.x < 0) {
      this.velocity.x +=
        this.drag *
        100 *
        (this.type === EntityTypes.Player ? 1 : 0.2) *
        deltaTime;
      if (this.velocity.x > 0) this.velocity.x = 0;
    }
  }

  clampHorizontalVelocity() {
    if (Math.abs(this.velocity.x) > this.maxVelocity.x) {
      this.velocity.x = Math.sign(this.velocity.x) * this.maxVelocity.x;
    }
  }

  clampVerticalVelocity() {
    if (Math.abs(this.velocity.y) > this.maxVelocity.y) {
      this.velocity.y = Math.sign(this.velocity.y) * this.maxVelocity.y;
    }
  }

  drawFire() {
    if (!this.hasVisualFire) return;

    const fireX = this.position.x;
    const fireY = this.position.y;
    const fireSize = new Vector2(this.hitbox.x, this.hitbox.y);

    this.fireSprite.transform.position = new Vector2(fireX, fireY);
    this.fireSprite.transform.size = fireSize;

    this.fireSprite.draw(camera);
  }

  draw(ctx) {
    this.drawEntity(ctx);

    this.drawFire();

    if (this.drawOverride) this.drawOverride();
  }

  getLightLevel() {
    return this.getBlockAtPosition(this.position.x, this.position.y)
      ?.lightLevel;
  }

  getSunLight() {
    return this.getBlockAtPosition(this.position.x, this.position.y)?.sunLight;
  }

  drawEntity(ctx) {
    ctx.save();
    const centerX = this.position.x - camera.x + this.offset.x;
    const centerY = this.position.y - camera.y + this.offset.y;

    const blockLightLevel = this.getLightLevel();

    if (blockLightLevel !== null) {
      if (this.body) this.body.brightness = blockLightLevel / 15;
    }

    if (this.body) {
      this.body.updatePosition({
        x: centerX + this.hitbox.x / 4,
        y: centerY,
      });
      this.body.opacity = this.opacity;
      this.body.draw(ctx, this.direction, this.lookDirection, this.holdItem);

      // this.drawFire(ctx);

      ctx.restore();
      return;
    }

    ctx.translate(centerX, centerY);

    if (this.rotation) {
      ctx.rotate((this.rotation * Math.PI) / 180);
    }

    if (this.outline > 0) {
      ctx.fillStyle = "white";
      ctx.fillRect(
        -this.outline,
        -this.outline,
        this.hitbox.x + this.outline * 2,
        this.hitbox.y + this.outline * 2
      );
    }

    if (this.flashingColor) {
      if (this.color) {
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.hitbox.x, this.hitbox.y);

        ctx.restore();
        return;
      }
    }

    ctx.fillStyle = this.color;
    if (!this.sprite || this.sprite == "") {
      ctx.fillRect(0, 0, this.hitbox.x, this.hitbox.y);
    } else if (this.img) {
      const spriteWidth = this.img.width * this.spriteScale;
      const spriteHeight = this.img.height * this.spriteScale;
      const spriteOffsetX = (this.hitbox.x - spriteWidth) / 2;
      const spriteOffsetY = (this.hitbox.y - spriteHeight) / 2;

      if (blockLightLevel !== null) {
        ctx.filter = `brightness(${blockLightLevel / 15})`;
      }

      if (this.cutoff > 0 && this.cutoff <= 1) {
        // Calculate the visible height (bottom portion)
        const visibleFraction = 1 - this.cutoff; // e.g., cutoff 0.5 => 0.5 visible
        const visibleHeight = spriteHeight * visibleFraction;

        ctx.save();
        ctx.beginPath();
        // Clip to show only the bottom portion
        ctx.rect(
          spriteOffsetX,
          spriteOffsetY + (spriteHeight - visibleHeight), // Start at bottom minus visible height
          spriteWidth,
          visibleHeight
        );
        ctx.clip();

        // Draw the full sprite, but only the bottom portion will show
        ctx.drawImage(
          this.img,
          spriteOffsetX,
          spriteOffsetY,
          spriteWidth,
          spriteHeight
        );

        if (this.dark) {
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = "black";
          ctx.fillRect(
            spriteOffsetX,
            spriteOffsetY + (spriteHeight - visibleHeight),
            spriteWidth,
            visibleHeight
          );
        }
        ctx.restore();
      } else {
        // No cutoff: draw full sprite
        ctx.drawImage(
          this.img,
          spriteOffsetX,
          spriteOffsetY,
          spriteWidth,
          spriteHeight
        );

        if (this.dark) {
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = "black";
          ctx.fillRect(spriteOffsetX, spriteOffsetY, spriteWidth, spriteHeight);
        }

        // this.drawFire(ctx);

        ctx.restore();
      }
      ctx.globalAlpha = 1; // Reset alpha
    }

    ctx.restore();
  }

  drawHitbox(ctx) {
    ctx.save();
    const centerX = this.position.x - camera.x + this.offset.x;
    const centerY = this.position.y - camera.y + this.offset.y;
    ctx.translate(centerX, centerY);
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.hitbox.x, this.hitbox.y);
    ctx.restore();
  }
}
