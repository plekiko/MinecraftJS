class Player extends Entity {
    constructor({
        position = new Vector2(),
        health = 20,
        abilities = {
            flying: false,
            instaBuild: true,
            mayBuild: true,
            mayFly: true,
            walkSpeed: 6,
            jumpForce: 8.5,
        },
        foodExhaustionLevel = 0,
        foodLevel = 20,
        foodSaturationLevel = 0,
        foodTickTimer = 0,
        playerGameType = 0,
        score = 0,
        xpLevel = 0,
        inventory = new Inventory(),
    }) {
        super({
            position: position,
            hitbox: new Vector2(0.8 * BLOCK_SIZE, 1.8 * BLOCK_SIZE),
            type: EntityTypes.Player,
        });

        this.health = health;
        this.abilities = abilities;
        this.foodExhaustionLevel = foodExhaustionLevel;
        this.foodLevel = foodLevel;
        this.foodSaturationLevel = foodSaturationLevel;
        this.foodTickTimer = foodTickTimer;
        this.playerGameType = playerGameType;
        this.score = score;
        this.xpLevel = xpLevel;

        this.inventory = inventory;

        this.windowOpen = false;

        this.hoverBlock = null;
    }

    update(deltaTime) {
        this.movementLogic(deltaTime);
        this.breakingAndPlacingLogic(deltaTime);
        this.updateEntity(deltaTime);
        this.flyingToggleLogic(deltaTime);
        this.collisionLogic();
        this.toggleLogic();

        if (this.windowOpen) this.inventory.update(deltaTime);
    }

    toggleLogic() {
        if (input.isKeyPressed("KeyE"))
            this.windowOpen ? this.closeInventory() : this.openInventory();
    }

    openInventory() {
        this.windowOpen = true;
    }

    closeInventory() {
        this.windowOpen = false;
    }

    collisionLogic() {
        const other = this.entityCollision();

        if (!other) return;

        switch (other.type) {
            case EntityTypes.Drop:
                this.pickupDrop(other);
        }
    }

    pickupDrop(drop) {
        let left = 0;

        if (drop.blockId) {
            // Add Block to Inventory
            left += this.inventory.addItem(
                new InventoryItem({ blockId: drop.blockId, count: drop.count })
            );
        }

        if (left != drop.count) playSound("pop.ogg");

        if (left > 0) {
            drop.count = left;
            return;
        }

        removeEntity(drop);
    }

    flyingToggleLogic(deltaTime) {
        if (!this.abilities.mayFly) return;
        if (!input.isKeyPressed("Backquote")) return;

        this.abilities.flying = !this.abilities.flying;
    }

    breakingAndPlacingLogic(deltaTime) {
        if (!this.hoverBlock) return;
        if (this.windowOpen) return;

        if (input.isLeftMouseDown()) this.breakingLogic(deltaTime);
        if (input.isRightMouseDown()) this.placingLogic(deltaTime);
    }

    placingLogic(deltaTime) {
        if (!this.abilities.mayBuild) return;
        if (!this.checkBlockForPlacing()) return;
        if (!this.inventory.selectedBlock) return;

        this.hoverBlock.setBlockType(this.inventory.selectedBlock);

        if (this.abilities.instaBuild) return;

        this.inventory.removeItem(3, this.inventory.currentSlot);
    }

    checkBlockForPlacing() {
        return (
            this.hoverBlock.blockType === Blocks.Air ||
            GetBlock(this.hoverBlock.blockType).fluid
        );
    }

    breakingLogic(deltaTime) {
        if (!this.abilities.mayBuild) return;
        if (this.hoverBlock.blockType === Blocks.Air) return;

        if (this.abilities.instaBuild) {
            this.hoverBlock.breakBlock(true);
            return;
        }
    }

    movementLogic(deltaTime) {
        this.velocity.x = 0;

        if (this.windowOpen) return;

        this.handleHorizontalMovement();
        this.handleJump();
        this.handleSwimming();
        this.handleFlying();

        // this.applyDeltaTime(deltaTime);
    }

    handleHorizontalMovement() {
        const isSprinting = input.isKeyDown("ShiftLeft");
        let speed = isSprinting
            ? this.abilities.walkSpeed * BLOCK_SIZE * 1.3
            : this.abilities.walkSpeed * BLOCK_SIZE;

        // Reduce speed if swimming
        if (this.swimming) {
            speed /= 2;
        }

        // Return if no movement keys are pressed
        if (!input.isKeyDown("KeyD") && !input.isKeyDown("KeyA")) return;

        // Move right or left based on key pressed
        this.velocity.x = input.isKeyDown("KeyD") ? speed : -speed;
    }

    handleJump() {
        if (this.swimming || !this.grounded) return; // Only jump if grounded and not swimming
        if (!(input.isKeyDown("Space") || input.isKeyDown("KeyW"))) return;

        // Apply jump force
        this.velocity.y = -this.abilities.jumpForce * BLOCK_SIZE;
        this.grounded = false;
    }

    handleSwimming() {
        if (!this.swimming) return;

        // Swim upwards or sink slowly
        this.velocity.y =
            input.isKeyDown("Space") || input.isKeyDown("KeyW") ? -100 : 50;
    }

    handleFlying() {
        if (!this.abilities.flying) {
            this.noGravity = false;
            return;
        }

        const isSprinting = input.isKeyDown("ShiftLeft");
        let speed = isSprinting
            ? this.abilities.walkSpeed * BLOCK_SIZE * 1.3
            : this.abilities.walkSpeed * BLOCK_SIZE;

        this.velocity.y = 0;

        this.noGravity = true;

        if (input.isKeyDown("KeyW")) this.velocity.y = -300;
        else if (input.isKeyDown("KeyS")) this.velocity.y = 300;

        if (!input.isKeyDown("KeyD") && !input.isKeyDown("KeyA")) return;

        this.velocity.x = input.isKeyDown("KeyD")
            ? speed * 2.52
            : -speed * 2.52;
    }

    applyDeltaTime(deltaTime) {
        this.velocity.x *= deltaTime;
        this.velocity.y *= deltaTime;
    }
}
