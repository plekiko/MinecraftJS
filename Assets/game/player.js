class Player extends Entity {
    constructor({
        position = new Vector2(),
        health = 20,
        abilities = {
            flying: false,
            instaBuild: false,
            mayBuild: true,
            mayFly: false,
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
            hitbox: new Vector2(0.4 * BLOCK_SIZE, 1.8 * BLOCK_SIZE),
            type: EntityTypes.Player,
            body: new Body({ parts: playerBody }),
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

        this.wasSwimming = false;

        this.canMove = true;

        this.breakingStage = 0;
        this.breakingTime = 0;
        this.lastBreakSoundTime = 0;

        this.hoverBlock = null;
        this.oldHoverBlock = null;
    }

    update(deltaTime) {
        this.interactLogic();
        this.movementLogic(deltaTime);
        this.breakingAndPlacingLogic(deltaTime);
        this.updateEntity(deltaTime);
        this.flyingToggleLogic(deltaTime);
        this.collisionLogic();
        this.toggleLogic();
        this.dropLogic();
        this.hoverBlockLogic();
        this.setHoldItem();

        if (this.windowOpen) this.inventory.update(deltaTime);
    }

    setHoldItem() {
        this.holdItem =
            this.inventory.items[3][this.inventory.currentSlot].item;
    }

    interactLogic() {
        if (!this.hoverBlock) return;

        if (!input.isRightMouseButtonPressed()) return;

        const block = GetBlock(this.hoverBlock.blockType);

        if (!block.specialType) return;

        this.swing();

        switch (block.specialType) {
            case SpecialType.CraftingTable:
                this.openCraftingTable();
                break;
            case SpecialType.Furnace:
                this.openFurnace();
                break;
        }
    }

    openFurnace() {
        const furnaceData = this.hoverBlock.metaData.storage;

        this.inventory.openFurnace(furnaceData);
        this.inventory.interactedBlock = this.hoverBlock;
        this.openInventory();
    }

    openCraftingTable() {
        this.inventory.craftingTable = true;
        this.openInventory();
    }

    hoverBlockLogic() {
        if (this.oldHoverBlock != this.hoverBlock) {
            this.oldHoverBlock = this.hoverBlock;
            this.resetBreaking();
        }
    }

    toggleLogic() {
        if (chat.inChat) return;
        if (input.isKeyPressed("KeyE"))
            this.windowOpen ? this.closeInventory() : this.openInventory();
    }

    openInventory() {
        this.windowOpen = true;
        this.canMove = false;

        this.inventory.refreshInventory();
    }

    closeInventory() {
        this.windowOpen = false;
        this.canMove = true;

        if (this.inventory.holdingItem) this.dropCurrentInventoryHolding();

        const leftOver = this.inventory.closeInventory();

        if (leftOver) {
            leftOver.forEach((item) => {
                this.drop(item);
            });
        }

        this.inventory.clearSlot(this.inventory.craftingOutputSlot);

        this.inventory.craftingTable = false;
        this.inventory.furnace = false;
    }

    collisionLogic() {
        const other = this.entityCollision();

        if (!other) return;

        switch (other.type) {
            case EntityTypes.Drop:
                this.pickupDrop(other);
                break;
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
        if (this.windowOpen) return;

        if (input.isLeftMouseButtonPressed()) this.swing();

        if (!this.hoverBlock) return;

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

        this.hoverBlock.setBlockType(this.inventory.selectedBlock.blockId);

        this.hoverBlock.playBreakSound();

        this.swing();

        if (this.abilities.instaBuild) return;

        this.inventory.removeItem(3, this.inventory.currentSlot);
    }

    checkBlockForPlacing() {
        const isAir = this.hoverBlock.blockType === Blocks.Air;
        const isFluid = GetBlock(this.hoverBlock.blockType).fluid;

        const mousePos = new Vector2(
            input.getMousePositionOnBlockGrid().x + Math.floor(camera.x),
            input.getMousePositionOnBlockGrid().y + Math.floor(camera.y)
        );

        const isCollidingWithPlayer = isColliding(
            new Vector2(this.position.x, this.position.y),
            new Vector2(this.hitbox.x, this.hitbox.y),
            new Vector2(mousePos.x, mousePos.y),
            new Vector2(BLOCK_SIZE, BLOCK_SIZE)
        );

        const isAdjacentToBlock = checkAdjacentBlocks(mousePos);

        return (
            (isAir || isFluid) && !isCollidingWithPlayer && isAdjacentToBlock
        );
    }

    dropLogic() {
        if (!this.canMove) return;
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
            GetBlock(this.hoverBlock.blockType).hardness < 0
        ) {
            this.resetBreaking();
            return;
        }

        if (this.abilities.instaBuild) {
            this.hoverBlock.breakBlock(false);
            return;
        }

        const block = GetBlock(this.hoverBlock.blockType);

        let currentBlockHardness = block.hardness;

        const selectedTool = this.inventory.selectedItem?.toolType;

        // set hardness to tooltype
        if (
            selectedTool &&
            block.toolType === this.inventory.selectedItem.toolType
        ) {
            // is correct tool
            currentBlockHardness -= this.inventory.selectedItem.toolLevel / 2;
            if (currentBlockHardness < 0) currentBlockHardness = 0;
        }

        const soundInterval = 0.2;
        this.breakingTime += this.grounded ? deltaTime : deltaTime / 3;

        if (this.breakingTime >= this.lastBreakSoundTime + soundInterval) {
            this.lastBreakSoundTime = this.breakingTime;
            PlayRandomSoundFromArray({
                array: block.breakingSound,
                volume: 0.2,
            });

            this.swing();
        }

        this.breakingStage = Math.floor(
            Math.min(10, (this.breakingTime / currentBlockHardness) * 10)
        );

        // Check if block should be broken
        if (this.breakingTime >= currentBlockHardness) {
            let shouldDrop = block.dropWithoutTool
                ? true
                : selectedTool
                ? selectedTool == block.toolType
                : false;
            if (
                this.inventory.selectedItem &&
                this.inventory.selectedItem.toolLevel < block.requiredToolLevel
            )
                shouldDrop = false;
            this.hoverBlock.breakBlock(shouldDrop);
            this.resetBreaking();
            this.swing();
        }
    }

    movementLogic(deltaTime) {
        this.velocity.x = 0;

        if (this.windowOpen) return;
        if (!this.canMove) return;

        this.handleHorizontalMovement();
        this.handleJump();
        this.handleSwimming();
        this.handleFlying();
        this.lookAtCursor();

        // this.applyDeltaTime(deltaTime);
    }

    lookAtCursor() {
        const mousePosition = input.getMousePosition();

        const partX = this.position.x + this.offset.x - camera.x;
        const partY = this.position.y + this.offset.y - camera.y;

        const rotation = this.rotateToPoint(mousePosition, {
            x: partX,
            y: partY,
        });

        this.lookDirection = rotation;
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
        if (this.wasSwimming && !this.swimming) {
            // Exited Water
            if (this.velocity.y < 0) this.addForce(0, -1.5 * BLOCK_SIZE);
            this.wasSwimming = false;
        }

        if (!this.swimming) return;

        this.wasSwimming = true;

        // Swim upwards or sink slowly
        if (!this.grounded)
            this.velocity.y =
                input.isKeyDown("Space") || input.isKeyDown("KeyW")
                    ? -1.5 * BLOCK_SIZE
                    : 0.8 * BLOCK_SIZE;
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

        if (input.isKeyDown("KeyW")) this.velocity.y = -4.7 * BLOCK_SIZE;
        else if (input.isKeyDown("KeyS")) this.velocity.y = 4.7 * BLOCK_SIZE;

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
