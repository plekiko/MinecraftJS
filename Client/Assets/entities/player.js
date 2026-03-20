class Player extends Entity {
    constructor(
        world,
        {
            name = "Player",
            UUID = uuidv4(),
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
            foodSaturationLevel = 5,
            foodTickTimer = 0,
            score = 0,
            xpLevel = 0,

            eating = false,
            eatTimer = 0,
            eatTime = 1,

            inventory = new Inventory(),
            entities,
        },
    ) {
        super(world, {
            UUID: UUID,
            name: name,
            position: position,
            hitbox: new Vector2(0.4 * BLOCK_SIZE, 1.8 * BLOCK_SIZE),
            type: EntityTypes.Player,
            body: createPlayerBody(),
            fallDamage: true,
            despawn: false,
        });

        this.footstepEmitter = createParticleEmitter({
            x: this.position.x,
            y: this.position.y + this.hitbox.y,
            radius: 0.5,
            maxParticles: 100,
            speed: 1,
            direction: 180,
            gravity: 200,
            initialVelocity: new Vector2(0, -40),
            fadeOutTime: 500,
            color: Colors.Green,
            randomScale: true,
            scale: 10,
            lighting: true,
        });

        this.health = health;
        this.maxHealth = health;
        this.abilities = abilities;

        this.foodExhaustionLevel = foodExhaustionLevel;
        this.foodLevel = foodLevel;
        this.maxFoodLevel = foodLevel;
        this.foodSaturationLevel = foodSaturationLevel;
        this.foodTickTimer = foodTickTimer;

        this.score = score;
        this.xpLevel = xpLevel;

        this.gamemode = gamemode;

        this.eating = eating;
        this.eatTimer = eatTimer;
        this.eatTime = eatTime;

        this.inventory = inventory;

        this.windowOpen = false;

        this.wasSwimming = false;

        this.canMove = true;

        this.breakingStage = 0;
        this.breakingTime = 0;
        this.lastBreakSoundTime = 0;

        this.hoverBlock = null;
        this.oldHoverBlock = null;

        this.climbing = false;

        this.hoverWall = null;

        this.entities = entities;

        this.portalSound = playSound("portal/travel.ogg", 0, 1, true);

        this.pressedSpace = false;

        this.clampFoodStats();

        // this.setGamemode(1);
    }

    clampFoodStats() {
        this.foodLevel = Math.max(
            0,
            Math.min(this.foodLevel, this.maxFoodLevel),
        );
        this.foodSaturationLevel = Math.max(
            0,
            Math.min(this.foodSaturationLevel, this.foodLevel),
        );
        this.foodExhaustionLevel = Math.max(0, this.foodExhaustionLevel);
        this.foodTickTimer = Math.max(0, this.foodTickTimer);
    }

    resetFoodStats() {
        this.foodLevel = this.maxFoodLevel;
        this.foodSaturationLevel = 5;
        this.foodExhaustionLevel = 0;
        this.foodTickTimer = 0;
        this.clampFoodStats();
    }

    addFoodExhaustion(amount = 0) {
        if (!this.abilities.hasHealth) return;
        if (amount <= 0) return;

        this.foodExhaustionLevel += amount;
    }

    processFoodExhaustion() {
        while (this.foodExhaustionLevel >= 4) {
            this.foodExhaustionLevel -= 4;

            if (this.foodSaturationLevel > 0) {
                this.foodSaturationLevel = Math.max(
                    0,
                    this.foodSaturationLevel - 1,
                );
                continue;
            }

            if (this.foodLevel > 0) {
                this.foodLevel -= 1;
            }
        }

        this.clampFoodStats();
    }

    addFood(foodValue, saturationValue = 0) {
        this.foodLevel = Math.min(
            this.maxFoodLevel,
            this.foodLevel + foodValue,
        );
        this.foodSaturationLevel = Math.min(
            this.foodLevel,
            this.foodSaturationLevel + saturationValue,
        );
        this.foodTickTimer = 0;
        this.clampFoodStats();
    }

    canEatFood(item = getItem(this.holdItem?.itemId)) {
        if (!this.abilities.hasHealth) return false;
        if (!item) return false;

        return item.foodValue > 0 && this.foodLevel < this.maxFoodLevel;
    }

    trackMovementExhaustion() {
        if (!this.abilities.hasHealth) return;
        if (this.abilities.flying) return;

        const isMovingHorizontally =
            (input.isActionDown("moveLeft") ||
                input.isActionDown("moveRight")) &&
            this.velocity.x !== 0;
        const isPressingUp =
            (input.isActionDown("jump") || input.isActionDown("moveUp")) &&
            this.velocity.y !== 0;

        if (this.swimming && (isMovingHorizontally || isPressingUp)) {
            this.addFoodExhaustion(0.03);
            return;
        }

        if (this.grounded && isMovingHorizontally) {
            this.addFoodExhaustion(input.isActionDown("sprint") ? 0.03 : 0.01);
        }
    }

    updateFoodTick() {
        if (!this.abilities.hasHealth) return;

        this.trackMovementExhaustion();
        this.processFoodExhaustion();

        const canQuickRegen =
            this.foodLevel === this.maxFoodLevel &&
            this.foodSaturationLevel > 0 &&
            this.health < this.maxHealth;
        const canRegen = this.foodLevel > 17 && this.health < this.maxHealth;
        const starving = this.foodLevel === 0;

        if (canQuickRegen) {
            this.foodTickTimer += 1;

            if (this.foodTickTimer >= 10) {
                const healAmount = Math.min(2, this.foodSaturationLevel / 3);
                this.addHealth(healAmount);
                this.addFoodExhaustion(6 * (healAmount / 2));
                this.foodTickTimer = 0;
            }

            return;
        }

        if (canRegen || starving) {
            this.foodTickTimer += 1;

            if (this.foodTickTimer >= 80) {
                this.foodTickTimer = 0;

                if (canRegen) {
                    this.addHealth(1);
                    this.addFoodExhaustion(6);
                } else {
                    this.forceDamage(1);
                    playRandomSoundFromArray({
                        array: Sounds.Player_Hurt,
                        positional: true,
                        origin: this.position,
                    });
                }
            }

            return;
        }

        this.foodTickTimer = 0;
    }

    update() {
        if (!this.isLocal()) return;

        this.interactLogic();
        this.climbingCollisingLogic();
        this.movementLogic();
        this.hoverBlockLogic();
        this.breakingAndPlacingLogic();
        this.updateEntity();
        this.flyingToggleLogic();
        this.collisionLogic();
        this.toggleLogic();
        this.dropLogic();
        this.setHoldItem();
        this.hurtCooldownLogic();
        this.processEating();

        this.portalSoundLogic();

        this.mutliplayerSyncPlayerState();

        if (this.windowOpen) this.inventory.update();
    }

    drawOverride() {
        this.drawNameTag();
    }

    drawNameTag() {
        if (!multiplayer) return;

        const nameTagOffset = 0.3 * BLOCK_SIZE;
        const nameTagPosition = new Vector2(
            this.position.x + this.hitbox.x / 2 - camera.x,
            this.position.y - nameTagOffset - camera.y,
        );

        drawText({
            text: this.name,
            x: nameTagPosition.x,
            y: nameTagPosition.y,
            color: "white",
            size: 18,
            textAlign: "center",
            background: true,
            shadow: false,
        });
    }

    portalSoundLogic() {
        if (this.portalCooldown >= this.maxPortalCooldown) {
            this.portalSound.currentTime = 0;
            this.portalSound.volume = 0;
            return;
        }

        this.portalSound.volume = lerp(
            this.portalSound.volume,
            0.5,
            deltaTime / 3,
        );
    }

    setSkin(skin) {
        this.body.setSprite(skin);
    }

    multiplayerReceivePlayerState(data) {
        this.position = data.position;

        this.holdItem = new InventoryItem(data.holdItem);

        if (this.body && data.bodyParts) {
            Object.values(this.body.parts).forEach((part) => {
                const syncPart = data.bodyParts.find((p) => p.id === part.id);

                if (!syncPart) return;

                part.rotation = syncPart.rotation;
                part.direction = syncPart.direction;
            });

            this.lookDirection = data.lookDirection;
        }
    }

    mutliplayerSyncPlayerState() {
        if (!multiplayer) return;
        if (!this.isLocal()) return;

        let data = {
            position: this.position,
            holdItem: this.holdItem,

            bodyParts: [],

            health: this.health,
            food: this.foodLevel,
            gamemode: this.gamemode,
        };

        if (this.body) {
            Object.values(this.body.parts).forEach((part) => {
                data.bodyParts.push({
                    id: part.id,
                    rotation: part.rotation,
                    direction: part.direction,
                });
            });
            data.lookDirection = this.lookDirection;
        }

        server.send({
            type: "playerUpdate",
            sender: this.UUID,
            message: data,
        });
    }

    isLocal() {
        return this.world?.player === this;
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
        if (this.invulnerable) return;
        this.knockBack(hitfromX, kb);

        playRandomSoundFromArray({
            array: Sounds.Player_Hurt,
            positional: true,
            origin: this.position,
        });
    }

    respawn() {
        this.velocity = new Vector2();
        this.shouldAddForce = new Vector2();
        this.resetFoodStats();
        if (this.isLocal()) gotoDimension(0);
        this.teleport(new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE));
        this.setOnGround();
        this.setGamemode();
    }

    useItemInHand() {
        if (!this.holdItem.itemId) return;

        const item = getItem(this.holdItem.itemId);

        if (!item) return;

        if (item.projectile) {
            this.throwProjectile(item);
            return;
        }

        if (item.toolType === ToolType.Hoe) {
            this.useHoe();
            return;
        }

        if (item.toolType === ToolType.Flame) {
            this.useFlame();
            return;
        }

        if (item.foodValue > 0) {
            this.eatFoodInHand();
            return;
        }

        if (
            item.itemId === Items.Bucket ||
            item.itemId === Items.WaterBucket ||
            item.itemId === Items.LavaBucket
        ) {
            this.useBucket();
            return;
        }
    }

    useFlame() {
        if (!this.hoverBlock) return;

        const block = getBlock(this.hoverBlock.blockType);

        if (this.hoverBlock.blockType === Blocks.TNT) {
            this.hoverBlock.explode();
            playPositionalSound(this.position, "items/ignite.ogg", 10);
            return;
        }

        // Check if block is placeable
        if (!this.checkBlockForPlacing(getBlock(Blocks.Fire))) return;

        // Check if block is air
        if (!block.air) return;

        // Check if block is fluid
        if (block.fluid) return;

        playPositionalSound(this.position, "items/ignite.ogg", 10);

        world.serverPlaceBlock(
            world.getChunkXForWorldX(this.hoverBlock.transform.position.x),
            this.hoverBlock.x,
            this.hoverBlock.y,
            Blocks.Fire,
            false,
            activeDimension,
        );

        this.world.setBlockType(this.hoverBlock, Blocks.Fire);
    }

    playerSwing() {
        this.swing();

        if (this.isLocal() && multiplayer)
            server.entityRPC(this.UUID, "playerSwing");
    }

    useHoe() {
        if (!this.hoverBlock) return;

        const block = getBlock(this.hoverBlock.blockType);

        if (!block.hoeAble) return;

        const blockAbove = world.getBlockAtWorldPosition(
            this.hoverBlock.transform.position.x,
            this.hoverBlock.transform.position.y - BLOCK_SIZE,
        );

        if (blockAbove && !getBlock(blockAbove.blockType).air) return;

        this.playerSwing();

        playRandomSoundFromArray({
            array: Sounds.Break_Gravel,
            positional: true,
            origin: this.position,
        });

        world.serverPlaceBlock(
            world.getChunkXForWorldX(this.hoverBlock.transform.position.x),
            this.hoverBlock.x,
            this.hoverBlock.y,
            Blocks.Farmland,
            false,
            activeDimension,
        );

        this.reduceDurability();

        this.world.setBlockType(this.hoverBlock, Blocks.Farmland);
    }

    throwProjectile(item) {
        const projectile = Entities[item.projectile];

        if (!projectile) return;

        this.playerSwing();

        const mousePos = input.getMouseWorldPosition();

        const direction = calculateDirection(this.position, mousePos);

        summonEntity(projectile, structuredClone(this.position), {
            velocity: new Vector2(
                direction.x * item.throwPower * BLOCK_SIZE,
                direction.y * item.throwPower * BLOCK_SIZE,
            ),
        });

        if (this.abilities.instaBuild) return;

        this.removeFromCurrentSlot();
    }

    useBucket() {
        if (!this.hoverBlock) return;
        const block = getBlock(this.hoverBlock.blockType);

        // Placing
        if (block.air || block.fluid) {
            if (this.holdItem.itemId === Items.WaterBucket) {
                if (!this.checkBlockForPlacing(getBlock(Blocks.Water))) return;

                this.removeFromCurrentSlot();
                this.inventory.addItem(
                    new InventoryItem({ itemId: Items.Bucket, count: 1 }),
                );
                this.hoverBlock.setBlockType(Blocks.Water, true);
                //this.world.setBlockType(this.hoverBlock, Blocks.Water);

                world.serverPlaceBlock(
                    world.getChunkXForWorldX(
                        this.hoverBlock.transform.position.x,
                    ),
                    this.hoverBlock.x,
                    this.hoverBlock.y,
                    Blocks.Water,
                    false,
                    activeDimension,
                );

                this.hoverBlock.updateSprite();
                return;
            }
            if (this.holdItem.itemId === Items.LavaBucket) {
                if (!this.checkBlockForPlacing(Blocks.Lava)) return;

                this.removeFromCurrentSlot();
                this.inventory.addItem(
                    new InventoryItem({ itemId: Items.Bucket, count: 1 }),
                );
                this.hoverBlock.setBlockType(Blocks.Lava, true);

                world.serverPlaceBlock(
                    world.getChunkXForWorldX(
                        this.hoverBlock.transform.position.x,
                    ),
                    this.hoverBlock.x,
                    this.hoverBlock.y,
                    Blocks.Lava,
                    false,
                    activeDimension,
                );

                //this.world.setBlockType(this.hoverBlock, Blocks.Lava);

                this.hoverBlock.updateSprite();
                return;
            }
        }

        // Picking up
        if (block.fluid) {
            // Water
            if (
                this.hoverBlock.blockType === Blocks.Lava &&
                this.hoverBlock.metaData.props.isSource
            ) {
                this.removeFromCurrentSlot();
                this.inventory.addItem(
                    new InventoryItem({ itemId: Items.LavaBucket, count: 1 }),
                );

                const chunk = getDimensionChunks(activeDimension).get(
                    this.hoverBlock.chunkX,
                );

                if (!chunk) return;

                world.serverPlaceBlock(
                    chunk.x,
                    this.hoverBlock.x,
                    this.hoverBlock.y,
                    Blocks.Air,
                    false,
                    activeDimension,
                );

                chunk.setBlockTypeLocal(
                    this.hoverBlock.x,
                    this.hoverBlock.y,
                    Blocks.Air,
                    false,
                    null,
                );
            }

            // Lava
            if (
                this.hoverBlock.blockType === Blocks.Water &&
                this.hoverBlock.metaData.props.isSource
            ) {
                this.removeFromCurrentSlot();
                this.inventory.addItem(
                    new InventoryItem({ itemId: Items.WaterBucket, count: 1 }),
                );

                const chunk = getDimensionChunks(activeDimension).get(
                    this.hoverBlock.chunkX,
                );

                if (!chunk) return;

                world.serverPlaceBlock(
                    chunk.x,
                    this.hoverBlock.x,
                    this.hoverBlock.y,
                    Blocks.Air,
                    false,
                    activeDimension,
                );

                chunk.setBlockTypeLocal(
                    this.hoverBlock.x,
                    this.hoverBlock.y,
                    Blocks.Air,
                    false,
                    null,
                );
            }
            // playPositionalSound(this.position, "items/bucket_fill.ogg");
        }
    }

    processEating() {
        if (!this.eating) return;

        const item = getItem(this.holdItem.itemId);
        if (!this.canEatFood(item)) {
            this.eating = false;
            this.eatTimer = 0;
            return;
        }

        if (!input.isActionDown("place")) {
            this.eating = false;
            this.eatTimer = 0;
            return;
        }

        this.eatTimer += deltaTime;

        if (this.eatTimer % 0.2 < deltaTime) {
            playRandomSoundFromArray({
                array: Sounds.Player_Eat,
                positional: true,
                origin: this.position,
                volume: 0.5,
            });
        }

        // Check if eating is complete
        if (this.eatTimer >= this.eatTime) {
            this.finishEating(item);
        }
    }

    finishEating(item) {
        this.addFood(item.foodValue, item.foodSaturation);
        this.eating = false;
        this.eatTimer = 0;

        // Play eating sound
        playPositionalSound(this.position, "player/burp.ogg");

        if (!this.abilities.instaBuild) {
            this.removeFromCurrentSlot();
        }
    }

    eatFoodInHand() {
        // This method is no longer needed directly but keeping it for compatibility
        const item = getItem(this.holdItem.itemId);
        if (!this.canEatFood(item)) return;
        this.eating = true;
        this.eatTimer = 0;
    }

    dropAllItems() {
        this.closeInventory();

        this.inventory.dropAll(this.position);
    }

    footstepEmitterLogic() {
        if (this.isLocal() && !input.isActionDown("sprint")) return;
        super.footstepEmitterLogic();
    }

    tickUpdate() {
        this.entityTickUpdate();

        if (this.isLocal()) this.updateFoodTick();
    }

    dieEvent() {
        chat.message("Player has died.");

        playRandomSoundFromArray({
            array: Sounds.Player_Hurt,
            positional: true,
            origin: this.position,
        });

        this.abilities.mayFly = false;
        this.abilities.flying = false;
        this.abilities.instaBuild = false;
        this.abilities.mayBuild = false;
        this.canMove = false;

        if (!GAMERULES.keepInventory) this.dropAllItems();

        this.respawn();
    }

    setHoldItem() {
        this.holdItem =
            this.inventory.items[3][this.inventory.currentSlot].item;
    }

    teleport(position) {
        this.position = new Vector2(position.x, position.y);
    }

    interactLogic() {
        if (this.windowOpen) return;
        if (pauseMenu?.getActive()) return;

        const usePressed = input.isActionPressed("place");

        if (usePressed) this.useItemInHand();

        if (usePressed) this.tryEntityInteract();

        if (!this.hoverBlock) return;

        const block = getBlock(this.hoverBlock.blockType);

        if (input.isActionPressed("pickBlock")) {
            this.handleQuickBlockSelect(block);
        }

        if (!usePressed) return;

        this.hoverBlock.interact(this);

        if (block.specialType !== null) this.playerSwing();

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
            case SpecialType.Converter:
                this.openConverter();
                break;
            case SpecialType.Hopper:
                this.openHopper();
                break;
        }
    }

    tryEntityInteract() {
        const entity = this.checkForEntityOnMouse();

        if (!entity) return;

        if (typeof entity.interact !== "function") return;

        entity.interact(this, this.holdItem);
    }

    interact(player, item) {
        if (player === this) return;
    }

    openConverter() {
        const storage = this.hoverBlock.metaData.props.storage;

        this.inventory.openConverter(storage);
        this.inventory.interactedBlock = this.hoverBlock;
        this.openInventory();
    }

    openHopper() {
        const storage = this.hoverBlock.metaData.props.storage;

        this.inventory.openHopper(storage);
        this.inventory.interactedBlock = this.hoverBlock;
        this.openInventory();
    }

    handleQuickBlockSelect(block) {
        if (!block) return;

        const inventoryItems = this.inventory.getAllItems();

        const blockIndex = inventoryItems.findIndex(
            (item) => item.blockId === block.blockId,
        );

        if (blockIndex === -1) {
            if (this.gamemode === 1) {
                this.inventory.addItem(
                    new InventoryItem({
                        blockId: block.blockId,
                        count: 1,
                    }),
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
        const chestStorage = this.hoverBlock.metaData.props.storage;

        playPositionalSound(this.position, "blocks/chestopen.ogg");

        this.inventory.openSingleChest(chestStorage);
        this.inventory.interactedBlock = this.hoverBlock;
        this.openInventory();
    }

    openFurnace() {
        const furnaceData = this.hoverBlock.metaData.props.storage;

        this.inventory.openFurnace(furnaceData);
        this.inventory.interactedBlock = this.hoverBlock;
        this.openInventory();
    }

    openCraftingTable() {
        this.inventory.craftingTable = true;
        this.inventory.interactedBlock = null;
        this.openInventory();
    }

    hoverBlockLogic() {
        if (this.oldHoverBlock !== this.hoverBlock) {
            this.oldHoverBlock = this.hoverBlock;
            this.resetBreaking();
        }
    }

    toggleLogic() {
        if (chat.inChat) return;
        if (this.windowOpen && input.isActionPressed("pause")) {
            this.closeInventory();
            input._pauseConsumedByUI = true;
            return;
        }
        if (input.isActionPressed("use")) {
            if (this.windowOpen) this.closeInventory();
            else {
                if (this.gamemode === 1) {
                    this.inventory.openCreativeInventory();
                }

                this.inventory.interactedBlock = null;
                this.openInventory();
            }
        }
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
                getBlock(this.inventory.interactedBlock.blockType).specialType
            ) {
                case SpecialType.SingleChest:
                    playPositionalSound(
                        this.position,
                        "blocks/chestclosed.ogg",
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
            }),
        );

        if (left != drop.count) playSound("misc/pop.ogg");

        if (left > 0) {
            drop.count = left;
            return;
        }

        world.removeEntity(drop, multiplayer);
    }

    climbingCollisingLogic() {
        // Get the blocks using types
        const blockTypes = this.collidingWithBlocks;

        const climableBlocks = this.filterBlocksByProperty(
            blockTypes,
            "climable",
        );

        // Add Sounds

        if (climableBlocks.length === 0) {
            this.climbing = false;
            return;
        }

        this.climbing = true;

        this.fallDistance = 0;
    }

    drop(item, count = item.count) {
        spawnDrop(
            new Vector2(
                this.position.x + randomRange(0, BLOCK_SIZE / 3),
                this.position.y,
            ),
            {
                blockId: item.blockId,
                itemId: item.itemId,
                count: count,
                props: item.props,
            },
        );
    }

    dropCurrentInventoryHolding() {
        const item = this.inventory.holdingItem;
        this.drop(item);

        this.inventory.holdingItem = null;
    }

    flyingToggleLogic() {
        if (!this.abilities.mayFly) return;

        if (input.isActionPressed("jump")) {
            if (!this.pressedSpace) {
                this.pressedSpace = true;

                setTimeout(() => {
                    this.pressedSpace = false;
                }, 200);

                return;
            }
        } else {
            return;
        }

        this.abilities.flying = !this.abilities.flying;
    }

    breakingAndPlacingLogic() {
        if (this.windowOpen) return;
        if (pauseMenu?.getActive()) return;

        if (input.isActionPressed("attack")) {
            this.playerSwing();
            this.tryHit();
        }

        if (!this.hoverBlock) return;

        if (input.isActionDown("attack")) {
            if (
                this.inventory.selectedItem &&
                this.inventory.selectedItem.toolType === ToolType.Hammer
            ) {
                this.breakingLogic(this.hoverWall, true);
            } else {
                this.breakingLogic(this.hoverBlock);
            }
        } else {
            this.resetBreaking();
        }
        if (input.isActionDown("place")) this.placingLogic();
    }

    checkForEntityOnMouse() {
        return (
            this.entities.find((entity) => {
                if (entity.dimension !== activeDimension) return false;
                const worldX = entity.position.x + (entity.offset?.x ?? 0);
                const worldY = entity.position.y + (entity.offset?.y ?? 0);
                return mouseOverPosition(
                    worldX,
                    worldY,
                    entity.hitbox.x,
                    entity.hitbox.y,
                    true,
                );
            }) ?? null
        );
    }

    tryHit() {
        const mouseWorld = input.getMousePositionOnBlockGrid();
        const cursorDistance =
            Vector2.Distance(this.position, mouseWorld) / BLOCK_SIZE;

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

        if (entity.health) {
            let reduceDurabilityBy = 1;

            switch (getItem(this.holdItem.itemId)?.toolType) {
                case ToolType.Axe:
                    reduceDurabilityBy = 2;
                    break;
                case ToolType.Pickaxe:
                    reduceDurabilityBy = 2;
                    break;
                case ToolType.Shovel:
                    reduceDurabilityBy = 2;
                    break;
                case ToolType.Hoe:
                    reduceDurabilityBy = 2;
                    break;
                case ToolType.Hammer:
                    reduceDurabilityBy = 2;
                    break;
                case ToolType.Shears:
                    reduceDurabilityBy = 0;
                    break;
            }

            this.reduceDurability();
        }
    }

    calculateDamage() {
        let damage = 1;

        if (this.holdItem.itemId) {
            damage += getItem(this.holdItem.itemId).baseDamage;
        }

        return damage;
    }

    checkWallForPlacing() {
        const chunk = getDimensionChunks(activeDimension).get(
            this.hoverBlock.chunkX,
        );

        if (!chunk) return;

        if (!getBlock(this.hoverWall.blockType).air) return false;

        const mousePos = new Vector2(
            input.getMousePositionOnBlockGrid().x,
            input.getMousePositionOnBlockGrid().y,
        );

        let isAdjacentToBlock =
            world.checkAdjacentBlocks(mousePos, true) ||
            world.checkAdjacentBlocks(mousePos);

        return isAdjacentToBlock;
    }

    placingLogic() {
        if (!this.abilities.mayBuild) return;

        // Check if holding either a block or an item with placeBlock property
        if (
            !this.inventory.selectedBlock &&
            (!this.inventory.selectedItem ||
                !this.inventory.selectedItem.placeBlock)
        ) {
            return;
        }

        // Get the selected item or block
        const selectedItem =
            this.inventory.selectedItem || this.inventory.selectedBlock;

        // Determine what block to place based on what's held
        const blockToPlace = selectedItem.placeBlock
            ? getBlock(selectedItem.placeBlock)
            : selectedItem;

        // Check if it's a wall item/block
        const isWall = this.getSelectedSlotItem().props?.wall;

        // Validate placement based on wall or regular block
        if (!isWall) {
            if (!this.checkBlockForPlacing(blockToPlace)) {
                return;
            }
        } else {
            if (!this.checkWallForPlacing()) {
                return;
            }
        }

        // Get the target chunk
        const chunk = getDimensionChunks(activeDimension).get(
            this.hoverBlock.chunkX,
        );

        // Place the block
        const succeeded = chunk.setBlockTypeLocal(
            this.hoverBlock.x,
            this.hoverBlock.y,
            blockToPlace.blockId,
            isWall,
            null,
            true,
        );

        if (!succeeded) return;

        world.serverPlaceBlock(
            chunk.x,
            this.hoverBlock.x,
            this.hoverBlock.y,
            blockToPlace.blockId,
            isWall,
            activeDimension,
        );

        // Play appropriate break sound
        if (!isWall) {
            this.hoverBlock.playBreakSound();
        } else {
            this.hoverWall.playBreakSound();
        }

        this.playerSwing();

        // Early return for walls
        if (isWall) {
            if (!this.abilities.instaBuild) {
                this.removeFromCurrentSlot();
            }
            return;
        }

        // Check block beneath for non-wall blocks
        const blockBeneath = getDimensionChunks(activeDimension)
            .get(this.hoverBlock.chunkX)
            .getBlockTypeDataLocal(this.hoverBlock.x, this.hoverBlock.y + 1);

        if (!blockBeneath || blockBeneath.air) {
            if (
                blockToPlace.breakWithoutBlockUnderneath &&
                (!blockToPlace.onlyPlacableOn ||
                    blockToPlace.onlyPlacableOn.length === 0)
            ) {
                this.hoverBlock.breakBlock(blockToPlace.dropWithoutTool);
            }
            if (blockToPlace.fall) {
                this.hoverBlock.gravityBlock();
            }
        }

        // Remove from inventory if not in insta-build mode
        if (!this.abilities.instaBuild) {
            this.removeFromCurrentSlot();
        }
    }

    removeFromCurrentSlot(count = 1) {
        this.inventory.removeItem(3, this.inventory.currentSlot, count);
    }

    getSelectedSlotItem() {
        return this.inventory.items[3][this.inventory.currentSlot].item;
    }

    checkBlockForPlacing(block) {
        const isAir = getBlock(this.hoverBlock.blockType).air;
        const isFluid = getBlock(this.hoverBlock.blockType).fluid;

        const mousePos = new Vector2(
            input.getMousePositionOnBlockGrid().x,
            input.getMousePositionOnBlockGrid().y,
        );

        if (mousePos.y <= -1) {
            chat.message("Can't place here! World height: " + CHUNK_HEIGHT);
            return;
        }

        let collidingWithEntity = false;

        if (block.collision) {
            for (let i = 0; i < this.entities.length; i++) {
                const entity = this.entities[i];
                if (entity.type === 0) continue;
                if (
                    isColliding(
                        new Vector2(entity.position.x, entity.position.y),
                        new Vector2(entity.hitbox.x, entity.hitbox.y),
                        new Vector2(mousePos.x, mousePos.y),
                        new Vector2(BLOCK_SIZE, BLOCK_SIZE),
                    )
                ) {
                    collidingWithEntity = true;
                    break;
                }
            }
        }

        const isAdjacentToBlock = world.checkAdjacentBlocks(mousePos);

        const blockBeneath = world.getBlockAtWorldPosition(
            this.hoverBlock.transform.position.x,
            this.hoverBlock.transform.position.y + BLOCK_SIZE,
        );

        if (block.breakWithoutBlockUnderneath) {
            if (!blockBeneath) return false;

            const blockBeneathDef = getBlock(blockBeneath.blockType);

            if (
                (!blockBeneathDef.collision &&
                    block.onlyPlacableOn === null &&
                    blockBeneathDef.transparent) ||
                blockBeneathDef.fluid
            )
                return false;

            if (
                blockBeneathDef.defaultCutoff > 0 &&
                block.onlyPlacableOn === null
            )
                return false;
        }

        if (block.onlyPlacableOn?.length > 0) {
            if (!blockBeneath) return false;

            if (!block.onlyPlacableOn.includes(blockBeneath.blockType))
                return false;
        }

        return (isAir || isFluid) && !collidingWithEntity && isAdjacentToBlock;
    }

    dropLogic() {
        if (!this.canMove) return;
        if (!input.isActionPressed("drop")) return;

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
                        this.inventory.hoverSlot.array,
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

        if (input.isActionDown("sprint")) {
            this.drop(
                this.getSelectedSlotItem(),
                this.getSelectedSlotItem().count,
            );
            this.inventory.removeItem(
                3,
                this.inventory.currentSlot,
                this.getSelectedSlotItem().count,
                this.inventory.items,
            );
            return;
        }

        this.drop(this.getSelectedSlotItem(), 1);

        this.inventory.removeItem(
            3,
            this.inventory.currentSlot,
            1,
            this.inventory.items,
        );
    }

    resetBreaking() {
        this.breakingTime = 0;
        this.breakingStage = 0;
        this.lastBreakSoundTime = 0;
    }

    breakingLogic(hover, wall = false) {
        let block = getBlock(hover.blockType);

        if (block.air || block.fluid) return;

        if (
            !this.abilities.mayBuild ||
            (getBlock(hover.blockType).hardness < 0 && this.gamemode != 1)
        ) {
            this.resetBreaking();
            return;
        }

        if (this.abilities.instaBuild) {
            hover.breakBlock(false, wall);
            this.playerSwing();

            world.serverBreakBlock(
                hover.chunkX,
                hover.x,
                hover.y,
                Blocks.Air,
                wall,
                false,
                activeDimension,
            );
            return;
        }

        let currentBlockHardness = block.hardness;
        const originalBlockHardness = block.hardness;

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

        if (this.breakingTime === 0) {
            this.hoverBlock.clicked(this);
        }

        const soundInterval = 0.2;
        this.breakingTime += this.grounded ? deltaTime : deltaTime / 3;

        if (this.breakingTime >= this.lastBreakSoundTime + soundInterval) {
            this.lastBreakSoundTime = this.breakingTime;
            playRandomSoundFromArray({
                array: block.breakingSound,
                volume: 0.2,
                positional: true,
                origin: world.getBlockWorldPosition(this.hoverBlock),
            });

            this.playerSwing();
        }

        this.breakingStage = Math.floor(
            Math.min(10, (this.breakingTime / currentBlockHardness) * 10),
        );

        // Check if block should be broken
        if (this.breakingTime >= currentBlockHardness) {
            let shouldDrop = block.dropWithoutTool
                ? true
                : selectedTool
                  ? selectedTool === block.toolType
                  : false;
            if (
                this.inventory.selectedItem &&
                this.inventory.selectedItem.toolLevel < block.requiredToolLevel
            )
                shouldDrop = false;
            if (isWall) shouldDrop = true;
            hover.breakBlock(shouldDrop, isWall);

            if (multiplayer) {
                world.serverBreakBlock(
                    hover.chunkX,
                    hover.x,
                    hover.y,
                    Blocks.Air,
                    isWall,
                    shouldDrop,
                    activeDimension,
                );
            }

            let reduceDurabilityBy = 1;

            if (getItem(this.holdItem.itemId)?.toolType === ToolType.Sword)
                reduceDurabilityBy = 2;

            if (originalBlockHardness <= 0) reduceDurabilityBy = 0;

            this.reduceDurability();

            this.resetBreaking();
            this.playerSwing();
        }
    }

    reduceDurability(amount = 1) {
        if (this.gamemode === 1) return;

        if (this.holdItem.hasProp("durability")) {
            this.holdItem.setProp(
                "durability",
                this.holdItem.getProp("durability") - amount,
            );

            if (this.holdItem.getProp("durability") <= 0) {
                this.inventory.removeItem(3, this.inventory.currentSlot, 1);

                playPositionalSound(
                    this.position,
                    "items/break.ogg",
                    10,
                    1,
                    randomRange(0.8, 1.2),
                );
            }
        }
    }

    movementLogic() {
        if (this.windowOpen) return;

        this.handleSwimming();
        if (!this.canMove) return;
        this.handleHorizontalMovement();
        this.handleJump();
        this.handleClimbing();
        this.handleFlying();
        this.lookAtCursor();

        // this.applyDeltaTime();
    }

    voidLogic() {
        if (this.position.y > CHUNK_HEIGHT * BLOCK_SIZE) {
            if (this.gamemode === 1) {
                this.die();
            } else {
                this.hit(2);
            }
        }
    }

    handleClimbing() {
        // Climbing logic
        if (!this.climbing) return;

        if (input.isActionDown("moveUp"))
            this.velocity.y = (-this.abilities.walkSpeed / 2) * BLOCK_SIZE;
        else this.velocity.y = (this.abilities.walkSpeed / 4) * BLOCK_SIZE;
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
        const isSprinting = input.isActionDown("sprint");
        let speed = isSprinting
            ? this.abilities.walkSpeed * BLOCK_SIZE * 1.3
            : this.abilities.walkSpeed * BLOCK_SIZE;

        // Reduce speed if swimming
        if (this.swimming) {
            speed /= 2;
        }

        // Return if no movement keys are pressed
        if (!input.isActionDown("moveRight") && !input.isActionDown("moveLeft"))
            return;

        // Move right or left based on key pressed
        this.targetVelocity.x = input.isActionDown("moveRight")
            ? speed
            : -speed;
    }

    handleJump() {
        if (this.swimming || !this.grounded) return; // Only jump if grounded and not swimming
        if (!(input.isActionDown("jump") || input.isActionDown("moveUp")))
            return;

        // Apply jump force
        this.velocity.y = -this.abilities.jumpForce * BLOCK_SIZE;
        this.grounded = false;

        this.addFoodExhaustion(input.isActionDown("sprint") ? 0.6 : 0.4);
    }

    handleSwimming() {
        if (this.wasSwimming && !this.swimming) {
            // Exited Fluid
            if (this.velocity.y < 0) this.addForce(0, -5);
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
            input.isActionDown("jump") || input.isActionDown("moveUp");

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

        this.isGettingKnockback = false;

        const isSprinting = input.isActionDown("sprint");
        let speed = isSprinting
            ? this.abilities.walkSpeed * 1.3 * BLOCK_SIZE
            : this.abilities.walkSpeed * BLOCK_SIZE;

        this.noGravity = true;

        this.velocity.y = 0;

        if (input.isActionDown("moveUp") || input.isActionDown("jump"))
            this.velocity.y = -4.7 * BLOCK_SIZE;
        else if (input.isActionDown("moveDown"))
            this.velocity.y = 4.7 * BLOCK_SIZE;

        if (!input.isActionDown("moveRight") && !input.isActionDown("moveLeft"))
            return;

        this.targetVelocity.x = input.isActionDown("moveRight")
            ? speed * 2.52
            : -speed * 2.52;
    }

    applyDeltaTime() {
        this.velocity.x *= deltaTime;
        this.velocity.y *= deltaTime;
    }
}

const skinData = localStorage.getItem("playerSkin");
function createPlayerBody() {
    return new Body({
        sprite: skinData || "steve",
        parts: {
            head: new BodyPart({
                spriteCrop: { x: 0, y: 8, width: 8, height: 8 },
                offset: { x: -6, y: 0 },
                rotationOrigin: { x: 12, y: 32 },
                zIndex: 1,
                eyes: true,
            }),
            torso: new BodyPart({
                spriteCrop: { x: 16, y: 20, width: 4, height: 12 },
                offset: { x: 0, y: 34 },
            }),
            leftArm: new BodyPart({
                offset: { x: 0, y: 34 },
                spriteCrop: { x: 44, y: 20, width: 4, height: 12 },
                zIndex: 2,
                rotationOrigin: { x: 5, y: 4 },
                sways: true,
                mainArm: true,
                holdOrigin: { x: 6, y: 35 },
            }),
            rightArm: new BodyPart({
                spriteCrop: { x: 48, y: 20, width: 4, height: 12 },
                offset: { x: 0, y: 34 },
                rotationOrigin: { x: 5, y: 4 },
                zIndex: -2,
                sways: true,
            }),
            leftLeg: new BodyPart({
                spriteCrop: { x: 4, y: 20, width: 4, height: 12 },
                offset: { x: 0, y: 74 },
                rotationOrigin: { x: 5, y: 0 },
                zIndex: 1,
                sways: true,
            }),
            rightLeg: new BodyPart({
                spriteCrop: { x: 8, y: 20, width: 4, height: 12 },
                offset: { x: 0, y: 74 },
                rotationOrigin: { x: 5, y: 0 },
                zIndex: -1,
                sways: true,
            }),
        },
    });
}
