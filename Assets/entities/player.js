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
            hasHealth: true,
        },
        gamemode = 0,
        foodExhaustionLevel = 0,
        foodLevel = 20,
        foodSaturationLevel = 0,
        foodTickTimer = 0,
        score = 0,
        xpLevel = 0,
        inventory = new Inventory(),
        entities,
    }) {
        super({
            position: position,
            hitbox: new Vector2(0.4 * BLOCK_SIZE, 1.8 * BLOCK_SIZE),
            type: EntityTypes.Player,
            body: new Body({ parts: playerBody }),
            fallDamage: true,
            despawn: false,
        });

        this.health = health;
        this.maxHealth = health;
        this.abilities = abilities;
        this.foodExhaustionLevel = foodExhaustionLevel;
        this.foodLevel = foodLevel;
        this.foodSaturationLevel = foodSaturationLevel;
        this.foodTickTimer = foodTickTimer;
        this.score = score;
        this.xpLevel = xpLevel;

        this.gamemode = gamemode;

        this.inventory = inventory;

        this.windowOpen = false;

        this.wasSwimming = false;

        this.canMove = true;

        this.breakingStage = 0;
        this.breakingTime = 0;
        this.lastBreakSoundTime = 0;

        this.hoverBlock = null;
        this.oldHoverBlock = null;

        this.hoverWall = null;

        this.entities = entities;

        // this.setGamemode(1);
    }

    update() {
        this.interactLogic();
        this.movementLogic();
        this.breakingAndPlacingLogic();
        this.updateEntity();
        this.flyingToggleLogic();
        this.collisionLogic();
        this.toggleLogic();
        this.dropLogic();
        this.hoverBlockLogic();
        this.setHoldItem();
        this.hurtCooldownLogic();

        if (this.windowOpen) this.inventory.update();
    }

    setGamemode(mode = this.gamemode) {
        this.gamemode = mode;

        switch (mode) {
            case 0:
                this.abilities.mayFly = false;
                this.abilities.flying = false;
                this.abilities.instaBuild = false;
                this.abilities.mayBuild = true;
                this.noCollision = false;
                this.opacity = 1;

                this.abilities.hasHealth = true;
                this.health = 20;
                return;

            // Creative
            case 1:
                this.abilities.mayFly = true;
                this.abilities.instaBuild = true;
                this.abilities.mayBuild = true;
                this.noCollision = false;
                this.opacity = 1;

                this.abilities.hasHealth = false;
                this.health = 20;
                return;

            // Adventure
            case 2:
                this.abilities.mayFly = false;
                this.abilities.flying = false;
                this.abilities.instaBuild = false;
                this.abilities.mayBuild = false;
                this.noCollision = false;
                this.opacity = 1;

                this.abilities.hasHealth = true;
                this.health = 20;
                return;

            case 3:
                this.abilities.mayFly = false;
                this.abilities.flying = true;
                this.abilities.mayBuild = false;
                this.noCollision = true;
                this.opacity = 0.5;

                this.abilities.hasHealth = false;
                this.health = 20;
                return;
        }
    }

    hit(damage, hitfromX = 0, kb = 0) {
        if (!damage) return;
        if (!this.health) return;
        if (!this.abilities.hasHealth) return;
        if (!this.damage(damage)) return;
        this.knockBack(hitfromX, kb);

        PlayRandomSoundFromArray({
            array: Sounds.Player_Hurt,
            positional: true,
            origin: this.position,
        });
    }

    respawn() {
        this.velocity = new Vector2();
        this.shouldAddForce = new Vector2();
        this.teleport(new Vector2(0, 0));
        this.setOnGround();
        this.setGamemode();
    }

    useItemInHand() {
        if (!this.holdItem.itemId) return;

        const item = GetItem(this.holdItem.itemId);

        if (!item) return;

        if (item.foodValue > 0) {
            this.eatFoodInHand();
        }

        if (
            item.itemId === Items.Bucket ||
            item.itemId === Items.WaterBucket ||
            item.itemId === Items.LavaBucket
        )
            this.useBucket();
    }

    useBucket() {
        const block = GetBlock(this.hoverBlock.blockType);

        // Placing
        if (block.air || block.fluid) {
            if (this.holdItem.itemId === Items.WaterBucket) {
                this.removeFromCurrentSlot();
                this.inventory.addItem(
                    new InventoryItem({ itemId: Items.Bucket, count: 1 })
                );
                this.hoverBlock.setBlockType(Blocks.Water, true);
                return;
            }
            if (this.holdItem.itemId === Items.LavaBucket) {
                this.removeFromCurrentSlot();
                this.inventory.addItem(
                    new InventoryItem({ itemId: Items.Bucket, count: 1 })
                );
                this.hoverBlock.setBlockType(Blocks.Lava, true);
                return;
            }
        }

        // Picking up
        if (block.fluid) {
            // Water
            if (
                this.hoverBlock.blockType === Blocks.Lava &&
                this.hoverBlock.isSource
            ) {
                this.removeFromCurrentSlot();
                this.inventory.addItem(
                    new InventoryItem({ itemId: Items.LavaBucket, count: 1 })
                );

                this.hoverBlock.setBlockType(Blocks.Air);
            }

            // Lava
            if (
                this.hoverBlock.blockType === Blocks.Water &&
                this.hoverBlock.isSource
            ) {
                this.removeFromCurrentSlot();
                this.inventory.addItem(
                    new InventoryItem({ itemId: Items.WaterBucket, count: 1 })
                );

                this.hoverBlock.setBlockType(Blocks.Air);
            }
            // playPositionalSound(this.position, "items/bucket_fill.ogg");
        }
    }

    eatFoodInHand() {
        if (this.health >= this.maxHealth) return;

        const item = GetItem(this.holdItem.itemId);

        if (!item) return;

        this.addHealth(item.foodValue);

        PlayRandomSoundFromArray({
            array: Sounds.Player_Eat,
            positional: true,
            origin: this.position,
            volume: 0.5,
        });

        this.removeFromCurrentSlot();
    }

    dropAllItems() {
        this.closeInventory();

        this.inventory.dropAll(this.position);
    }

    dieEvent() {
        chat.message("Player has dies");

        PlayRandomSoundFromArray({
            array: Sounds.Player_Hurt,
            positional: true,
            origin: this.position,
        });

        this.abilities.mayFly = false;
        this.abilities.flying = false;
        this.abilities.instaBuild = false;
        this.abilities.mayBuild = false;
        this.canMove = false;

        this.dropAllItems();

        this.respawn();
    }

    setHoldItem() {
        this.holdItem =
            this.inventory.items[3][this.inventory.currentSlot].item;
    }

    teleport(position) {
        this.position = position;
    }

    interactLogic() {
        if (this.windowOpen) return;

        if (!this.hoverBlock) return;

        if (!input.isRightMouseButtonPressed() && !input.mouse.wheelDown)
            return;

        const block = GetBlock(this.hoverBlock.blockType);

        if (input.mouse.wheelDown) {
            this.handleQuickBlockSelect(block);
        }

        if (!block.specialType) {
            this.useItemInHand();
            return;
        }

        this.hoverBlock.interact(this);

        this.swing();

        switch (block.specialType) {
            case SpecialType.CraftingTable:
                this.openCraftingTable();
                break;
            case SpecialType.Furnace:
                this.openFurnace();
                break;
            case SpecialType.SingleChest:
                this.openSingleChest();
                break;
        }
    }

    handleQuickBlockSelect(block) {
        if (!block) return;

        const inventoryItems = this.inventory.getAllItems();

        const blockIndex = inventoryItems.findIndex(
            (item) => item.blockId === block.blockId
        );

        if (blockIndex === -1) {
            if (this.gamemode === 1) {
                this.inventory.addItem(
                    new InventoryItem({
                        blockId: block.blockId,
                        count: 1,
                        props: { wall: true },
                    })
                );
            }
            return;
        }

        // WIP

        // If the block is already in the inventory, select it
        // const item = this.inventory.getSlotFromInventory(block);

        // console.log(item);
    }

    openSingleChest() {
        const chestStorage = this.hoverBlock.metaData.storage;

        playPositionalSound(this.position, "blocks/chestopen.ogg");

        this.inventory.openSingleChest(chestStorage);
        this.inventory.interactedBlock = this.hoverBlock;
        this.openInventory();
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

        if (
            this.inventory.interactedBlock &&
            this.inventory.interactedBlock.metaData
        ) {
            switch (
                GetBlock(this.inventory.interactedBlock.blockType).specialType
            ) {
                case SpecialType.SingleChest:
                    playPositionalSound(
                        this.position,
                        "blocks/chestclosed.ogg"
                    );
                    break;
            }
        }

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
        const drop = this.entityCollision(EntityTypes.Drop);
        if (drop) this.pickupDrop(drop);
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
                props: drop.props,
            })
        );

        if (left != drop.count) playSound("misc/pop.ogg");

        if (left > 0) {
            drop.count = left;
            return;
        }

        removeEntity(drop);
    }

    drop(item, count = item.count) {
        summonEntity(
            Drop,
            new Vector2(
                this.position.x + RandomRange(0, BLOCK_SIZE / 3),
                this.position.y
            ),
            {
                blockId: item.blockId,
                itemId: item.itemId,
                count: count,
                props: item.props,
            }
        );
    }

    dropCurrentInventoryHolding() {
        const item = this.inventory.holdingItem;
        this.drop(item);

        this.inventory.holdingItem = null;
    }

    flyingToggleLogic() {
        if (!this.abilities.mayFly) return;
        if (!input.isKeyPressed("Backquote")) return;

        this.abilities.flying = !this.abilities.flying;
    }

    breakingAndPlacingLogic() {
        if (this.windowOpen) return;

        if (input.isLeftMouseButtonPressed()) {
            this.swing();
            this.tryHit();
        }

        if (!this.hoverBlock) return;

        if (input.isLeftMouseDown())
            this.breakingLogic(
                this.inventory.selectedItem?.toolType === ToolType.Hammer
                    ? this.hoverWall
                    : this.hoverBlock
            );
        else {
            this.resetBreaking();
        }
        if (input.isRightMouseDown()) this.placingLogic();
    }

    checkForEntityOnMouse() {
        const entity = this.entities.find((entity) => {
            return mouseOverPosition(
                entity.position.x - camera.x,
                entity.position.y - camera.y,
                entity.hitbox.x,
                entity.hitbox.y,
                true
            );
        });

        return entity;
    }

    tryHit() {
        const cursorDistance =
            Vector2.Distance(
                this.position,
                new Vector2(
                    input.getMouseWorldPosition().x,
                    input.getMouseWorldPosition().y
                )
            ) / BLOCK_SIZE;

        cursorInRange = !this.abilities.instaBuild
            ? cursorDistance <= INTERACT_DISTANCE
            : true;

        if (!cursorInRange) return;

        const entity = this.checkForEntityOnMouse();

        this.hitEntity(entity);
    }

    hitEntity(entity) {
        if (!entity) return;

        // console.log(entity);
        if (entity === this) return;

        entity.hit(this.calculateDamage(), this.position.x, 2);
    }

    calculateDamage() {
        let damage = 1;

        if (this.holdItem.itemId) {
            damage += GetItem(this.holdItem.itemId).baseDamage;
        }

        return damage;
    }

    checkWallForPlacing() {
        const chunk = chunks.get(this.hoverBlock.chunkX);

        if (!chunk) return;

        if (!GetBlock(this.hoverWall.blockType).air) return false;

        const mousePos = new Vector2(
            input.getMousePositionOnBlockGrid().x,
            input.getMousePositionOnBlockGrid().y
        );

        let isAdjacentToBlock =
            checkAdjacentBlocks(mousePos, true) ||
            checkAdjacentBlocks(mousePos);

        return isAdjacentToBlock;
    }

    placingLogic() {
        if (!this.abilities.mayBuild) return;
        if (!this.inventory.selectedBlock) return;

        const isWall = this.getSelectedSlotItem().props?.wall;

        if (!isWall) {
            if (
                !this.checkBlockForPlacing(
                    this.inventory.selectedBlock.collision
                )
            )
                return;
        } else {
            if (!this.checkWallForPlacing()) return;
        }

        // this.hoverBlock.setBlockType(this.inventory.selectedBlock.blockId);

        const chunk = chunks.get(this.hoverBlock.chunkX);

        chunk.setBlockType(
            this.hoverBlock.x,
            this.hoverBlock.y,
            this.inventory.selectedBlock.blockId,
            isWall,
            null,
            false
        );

        if (!isWall) this.hoverBlock.playBreakSound();
        else this.hoverWall.playBreakSound();

        this.swing();

        if (isWall) {
            if (this.abilities.instaBuild) return;
            this.removeFromCurrentSlot();
            return;
        }

        const blockBeneath = chunks
            .get(this.hoverBlock.chunkX)
            .getBlockTypeData(this.hoverBlock.x, this.hoverBlock.y + 1, false);

        if (!blockBeneath) return;
        if (!blockBeneath.collision) {
            if (this.inventory.selectedBlock.breakWithoutBlockUnderneath)
                this.hoverBlock.breakBlock(
                    this.inventory.selectedBlock.dropWithoutTool
                );
            if (this.inventory.selectedBlock.fall)
                this.hoverBlock.gravityBlock();
        }

        if (this.abilities.instaBuild) return;

        this.removeFromCurrentSlot();
    }

    removeFromCurrentSlot(count = 1) {
        this.inventory.removeItem(3, this.inventory.currentSlot, count);

        this.setHoldItem();
    }

    getSelectedSlotItem() {
        return this.inventory.items[3][this.inventory.currentSlot].item;
    }

    checkBlockForPlacing(collision) {
        const isAir = GetBlock(this.hoverBlock.blockType).air;
        const isFluid = GetBlock(this.hoverBlock.blockType).fluid;

        const mousePos = new Vector2(
            input.getMousePositionOnBlockGrid().x,
            input.getMousePositionOnBlockGrid().y
        );

        if (mousePos.y <= -1) {
            chat.message("Can't place here! World height: " + CHUNK_HEIGHT);
            return;
        }

        let collidingWithEntity = false;

        if (collision) {
            for (let i = 0; i < this.entities.length; i++) {
                const entity = this.entities[i];
                if (entity.type === 0) continue;
                if (
                    isColliding(
                        new Vector2(entity.position.x, entity.position.y),
                        new Vector2(entity.hitbox.x, entity.hitbox.y),
                        new Vector2(mousePos.x, mousePos.y),
                        new Vector2(BLOCK_SIZE, BLOCK_SIZE)
                    )
                ) {
                    collidingWithEntity = true;
                    break;
                }
            }
        }

        const isAdjacentToBlock = checkAdjacentBlocks(mousePos);

        return (isAir || isFluid) && !collidingWithEntity && isAdjacentToBlock;
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

    breakingLogic(hover) {
        let block = GetBlock(hover.blockType);

        if (block.air) return;

        if (!this.abilities.mayBuild || GetBlock(hover).hardness < 0) {
            this.resetBreaking();
            return;
        }

        if (this.abilities.instaBuild) {
            hover.breakBlock(false);
            this.swing();
            return;
        }

        let currentBlockHardness = block.hardness;

        const selectedTool = this.inventory.selectedItem?.toolType;

        let isWall = false;

        if (selectedTool === ToolType.Hammer) {
            isWall = true;
        }

        // set hardness to tooltype
        if (
            !isWall &&
            selectedTool &&
            block.toolType === this.inventory.selectedItem.toolType
        ) {
            // is correct tool
            currentBlockHardness -= this.inventory.selectedItem.toolLevel / 2;
            if (currentBlockHardness < 0) currentBlockHardness = 0;
        }

        if (isWall)
            currentBlockHardness = 2 - this.inventory.selectedItem.toolLevel;

        const soundInterval = 0.2;
        this.breakingTime += this.grounded ? deltaTime : deltaTime / 3;

        if (this.breakingTime >= this.lastBreakSoundTime + soundInterval) {
            this.lastBreakSoundTime = this.breakingTime;
            PlayRandomSoundFromArray({
                array: block.breakingSound,
                volume: 0.2,
                positional: true,
                origin: getBlockWorldPosition(this.hoverBlock),
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
            if (isWall) shouldDrop = true;
            if (
                this.inventory.selectedItem &&
                (this.inventory.selectedItem.toolLevel <
                    block.requiredToolLevel ||
                    !isWall)
            )
                shouldDrop = false;
            hover.breakBlock(shouldDrop);
            this.resetBreaking();
            this.swing();
        }
    }

    movementLogic() {
        // this.velocity.x = 0;

        if (this.windowOpen) return;

        this.handleSwimming();
        if (!this.canMove) return;
        this.handleHorizontalMovement();
        this.handleJump();
        this.handleFlying();
        this.lookAtCursor();

        // this.applyDeltaTime();
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
        this.targetVelocity.x = input.isKeyDown("KeyD") ? speed : -speed;
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
            if (this.velocity.y < 0) this.addForce(0, -1.5);
            this.wasSwimming = false;
        }

        if (!this.wasSwimming && this.swimming) {
            // Entered Water
            this.velocity.x = 0;
        }

        if (!this.swimming) return;

        this.wasSwimming = true;

        // Swim upwards or sink slowly

        const isPressingUp =
            input.isKeyDown("Space") || input.isKeyDown("KeyW");

        if (!this.grounded)
            this.velocity.y =
                isPressingUp && this.canMove
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
            ? this.abilities.walkSpeed * 1.3 * BLOCK_SIZE
            : this.abilities.walkSpeed * BLOCK_SIZE;

        this.velocity.y = 0;

        this.noGravity = true;

        if (input.isKeyDown("KeyW")) this.velocity.y = -4.7 * BLOCK_SIZE;
        else if (input.isKeyDown("KeyS")) this.velocity.y = 4.7 * BLOCK_SIZE;

        if (!input.isKeyDown("KeyD") && !input.isKeyDown("KeyA")) return;

        this.targetVelocity.x = input.isKeyDown("KeyD")
            ? speed * 2.52
            : -speed * 2.52;
    }

    applyDeltaTime() {
        this.velocity.x *= deltaTime;
        this.velocity.y *= deltaTime;
    }
}
