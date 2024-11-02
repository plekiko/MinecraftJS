class Player extends Entity {
    constructor({
        position = new Vector2(),
        health = 20,
        abilities = {
            flying: false,
            instaBuild: false,
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

        this.breakingStage = 0;
        this.breakingTime = 0;
        this.lastBreakSoundTime = 0;

        this.hoverBlock = null;
        this.oldHoverBlock = null;
    }

    update(deltaTime) {
        this.movementLogic(deltaTime);
        this.breakingAndPlacingLogic(deltaTime);
        this.updateEntity(deltaTime);
        this.flyingToggleLogic(deltaTime);
        this.collisionLogic();
        this.toggleLogic();
        this.dropLogic();
        this.hoverBlockLogic();

        if (this.windowOpen) this.inventory.update(deltaTime);
    }

    hoverBlockLogic() {
        if (this.oldHoverBlock != this.hoverBlock) {
            this.oldHoverBlock = this.hoverBlock;
            this.resetBreaking();
        }
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

        if (this.inventory.holdingItem) this.dropCurrentInventoryHolding();

        const leftOver = this.inventory.closeInventory();

        if (leftOver) {
            leftOver.forEach((item) => {
                this.drop(item);
            });
        }

        this.inventory.clearSlot(this.inventory.craftingOutputSlot);
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
        if (!drop.isReady) return;

        let left = 0;

        // Add Block to Inventory
        left += this.inventory.addItem(
            new InventoryItem({
                blockId: drop.blockId,
                itemId: drop.itemId,
                count: drop.count,
            })
        );

        if (left != drop.count) playSound("pop.ogg");

        if (left > 0) {
            drop.count = left;
            return;
        }

        removeEntity(drop);
    }

    drop(item, count = item.count) {
        entities.push(
            new Drop({
                x: this.position.x + RandomRange(0, BLOCK_SIZE / 3),
                y: this.position.y,
                blockId: item.blockId,
                itemId: item.itemId,
                count: count,
            })
        );
    }

    dropCurrentInventoryHolding() {
        const item = this.inventory.holdingItem;
        this.drop(item);

        this.inventory.holdingItem = null;
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
        else {
            this.resetBreaking();
        }
        if (input.isRightMouseDown()) this.placingLogic(deltaTime);
    }

    placingLogic(deltaTime) {
        if (!this.abilities.mayBuild) return;
        if (!this.checkBlockForPlacing()) return;
        if (!this.inventory.selectedBlock) return;

        this.hoverBlock.setBlockType(this.inventory.selectedBlock);

        this.hoverBlock.playBreakSound();

        if (this.abilities.instaBuild) return;

        this.inventory.removeItem(3, this.inventory.currentSlot);
    }

    checkBlockForPlacing() {
        return (
            this.hoverBlock.blockType === Blocks.Air ||
            GetBlock(this.hoverBlock.blockType).fluid
        );
    }

    dropLogic() {
        if (!input.isKeyPressed("KeyQ")) return;

        if (this.windowOpen) {
            if (this.inventory.holdingItem) {
                this.drop(this.inventory.holdingItem);
                this.inventory.holdingItem = null;
            } else {
                if (this.inventory.hoverItem) {
                    this.drop(this.inventory.hoverItem, 1);
                    this.inventory.removeItem(
                        this.inventory.hoverSlot.y,
                        this.inventory.hoverSlot.x,
                        1,
                        this.inventory.hoverSlot.array
                    );
                }
            }
            return;
        }

        if (
            !this.inventory.selectedBlock &&
            this.inventory.selectedItem == null
        )
            return;

        this.drop(this.inventory.items[3][this.inventory.currentSlot].item, 1);

        this.inventory.removeItem(
            3,
            this.inventory.currentSlot,
            1,
            this.inventory.items
        );
    }

    resetBreaking() {
        this.breakingTime = 0;
        this.breakingStage = 0;
        this.lastBreakSoundTime = 0;
    }

    breakingLogic(deltaTime) {
        if (
            !this.abilities.mayBuild ||
            this.hoverBlock.blockType === Blocks.Air
        ) {
            this.resetBreaking();
            return;
        }

        if (this.abilities.instaBuild) {
            this.hoverBlock.breakBlock(true);
            return;
        }

        const currentBlockHardness = GetBlock(
            this.hoverBlock.blockType
        ).hardness;

        const soundInterval = 0.2;
        this.breakingTime += deltaTime;

        if (this.breakingTime >= this.lastBreakSoundTime + soundInterval) {
            this.lastBreakSoundTime = this.breakingTime;
            PlayRandomSoundFromArray({
                array: GetBlock(this.hoverBlock.blockType).breakingSound,
                volume: 0.2,
            });
        }

        this.breakingStage = Math.floor(
            Math.min(10, (this.breakingTime / currentBlockHardness) * 10)
        );

        // Check if block should be broken
        if (this.breakingTime >= currentBlockHardness) {
            this.hoverBlock.breakBlock(true);
            this.resetBreaking();
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
