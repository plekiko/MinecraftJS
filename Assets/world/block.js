class BlockType {
    constructor({
        blockId,
        sprite = null,
        states = [],
        name = "New block",
        hardness = -2,
        grassOffset = false,
        blockOffset = { x: 0, y: 0 },
        animationSpeed = null,
        fluid = false,
        drag = 40,
        collision = true,

        stackSize = 64,

        hoeAble = false,

        climable = false,

        defaultCutoff = 0,

        noPriority = false,

        transparent = false,

        changeToBlockWithBlockAbove = null,

        changeToBlockWhenBroken = null,

        fire = false,

        cannotBeConverted = false,

        saplingOutcome = null,

        extinguishEntity = false,

        air = false,

        chunkProtection = false,

        spawnerType = null,

        updateSpeed = 0,
        chunkUpdate = false,

        breakSound = Sounds.Break_Wood,
        breakingSound = Sounds.Breaking_Wood,

        toolType = ToolType.Nothing,
        requiredToolLevel = 0,
        dropWithoutTool = true,
        breakByFluid = false,
        category = null,

        fall = false,

        ambientSound = null,

        dropBlock = blockId,
        dropItem = null,

        breakWithoutBlockUnderneath = false,
        onlyPlacableOn = null,

        lightLevel = 0,
        sunLight = false,

        dropTable = null,

        noteBlockSound = "harp",

        fuelTime = null,
        smeltOutput = null,

        baseRedstoneOutput = 0,

        specialType = null,

        cropOutcome = null,
        cropSpeed = 20, // 20 ticks per second
    } = {}) {
        this.blockId = blockId;
        this.sprite = sprite;
        this.states = states;
        this.name = name;
        this.hardness = hardness;
        this.grassOffset = grassOffset;
        this.blockOffset = blockOffset;
        this.animationSpeed = animationSpeed;
        this.fluid = fluid;
        this.drag = drag;
        this.collision = collision;
        this.breakSound = breakSound;
        this.breakingSound = breakingSound;

        this.stackSize = stackSize;

        this.changeToBlockWithBlockAbove = changeToBlockWithBlockAbove;

        this.spawnerType = spawnerType;

        this.hoeAble = hoeAble;

        this.changeToBlockWhenBroken = changeToBlockWhenBroken;

        this.noPriority = noPriority;

        this.climable = climable;

        this.fire = fire;
        this.extinguishEntity = extinguishEntity;

        this.defaultCutoff = defaultCutoff;

        this.cannotBeConverted = cannotBeConverted;

        this.noteBlockSound = noteBlockSound;

        this.air = air;

        this.lightLevel = lightLevel;
        this.sunLight = sunLight;

        this.baseRedstoneOutput = baseRedstoneOutput;

        this.transparent = transparent;

        this.chunkProtection = chunkProtection;

        this.updateSpeed = updateSpeed;
        this.chunkUpdate = chunkUpdate;

        this.fall = fall;

        this.ambientSound = ambientSound;

        this.breakWithoutBlockUnderneath = breakWithoutBlockUnderneath;
        this.onlyPlacableOn = onlyPlacableOn;

        this.toolType = toolType;
        this.dropWithoutTool = dropWithoutTool;
        this.requiredToolLevel = requiredToolLevel;
        this.breakByFluid = breakByFluid;
        this.category = category;

        this.dropBlock = dropBlock;
        this.dropItem = dropItem;
        this.dropTable = dropTable;

        this.fuelTime = fuelTime;
        this.smeltOutput = smeltOutput;

        this.specialType = specialType;

        this.saplingOutcome = saplingOutcome;

        this.cropOutcome = cropOutcome;
        this.cropSpeed = cropSpeed;
    }
}

const SpecialType = Object.freeze({
    CraftingTable: 1,
    Furnace: 2,
    SingleChest: 3,
    Jukebox: 4,
    Converter: 5,
    NoteBlock: 6,
    RedstoneDust: 7,
    RedstoneLamp: 8,
    PressurePlate: 9,
    Hopper: 10,
    Lever: 11,
    TNT: 12,
});

const BlockCategory = Object.freeze({
    Logs: 1,
    Planks: 2,
    Wool: 3,
});

class Metadata {
    constructor({ props = null } = {}) {
        this.props = props;
    }
}

function checkDissipation(block, worldPos) {
    // For non‑source water blocks, check neighbors (above, left, right)
    // to see if any have a higher water level.
    let neighborHasHigher = false;
    const neighborOffsets = [
        { dx: 0, dy: -BLOCK_SIZE },
        { dx: -BLOCK_SIZE, dy: 0 },
        { dx: BLOCK_SIZE, dy: 0 },
    ];
    neighborOffsets.forEach((offset) => {
        const neighbor = GetBlockAtWorldPosition(
            worldPos.x + offset.dx,
            worldPos.y + offset.dy
        );
        // Note: In your original code you check if neighbor.waterLevel < block.waterLevel.
        // (This may be counterintuitive, but we keep it exactly as provided.)
        if (
            neighbor &&
            neighbor.blockType === block.blockType &&
            neighbor.metaData.props.waterLevel < block.metaData.props.waterLevel
        ) {
            neighborHasHigher = true;
        }
    });
    if (!neighborHasHigher) {
        block.metaData.props.waterLevel += 0.25;
        block.cutoff = block.metaData.props.waterLevel;
        if (block.metaData.props.waterLevel >= 0.85) {
            setBlockType(block, Blocks.Air);
            return true;
        }
    }
    return false;
}

function flowDownward(block, worldPos) {
    let below = GetBlockAtWorldPosition(worldPos.x, worldPos.y + BLOCK_SIZE);
    if (
        (below && GetBlock(below.blockType).air) ||
        (below && GetBlock(below.blockType).breakByFluid)
    ) {
        if (GetBlock(below.blockType).breakByFluid) {
            below.breakBlock(GetBlock(below.blockType).dropWithoutTool);
        }
        below.setBlockType(block.blockType);

        below.metaData.props.isSource = false;
        below.metaData.props.waterLevel = 0;
        below.cutoff = below.metaData.props.waterLevel;
    }
    return below;
}

function setBlockType(block, type) {
    const chunk = chunks.get(block.chunkX);
    if (!chunk) return;
    chunk.setBlockType(block.x, block.y, type, block.wall, null, false, true);
}

function verticalCheckAbove(block, worldPos) {
    let above = GetBlockAtWorldPosition(worldPos.x, worldPos.y - BLOCK_SIZE);
    if (above) {
        if (above.blockType === block.blockType) {
            block.metaData.props.waterLevel = 0;
            block.cutoff = block.metaData.props.waterLevel;
        } else if (
            GetBlock(above.blockType).air &&
            block.metaData.props.isSource
        ) {
            block.metaData.props.waterLevel = 0; // As per original code.
            block.cutoff = block.metaData.props.waterLevel + 0.1;
        }
    }
}

function flowSideways(block, worldPos, direction) {
    let target = GetBlockAtWorldPosition(
        worldPos.x + direction.dx,
        worldPos.y + direction.dy
    );
    // Check if the target is air or can be broken by fluid.
    if (
        target &&
        (GetBlock(target.blockType).air ||
            GetBlock(target.blockType).breakByFluid)
    ) {
        if (GetBlock(target.blockType).breakByFluid) {
            target.breakBlock(GetBlock(target.blockType).dropWithoutTool);
        }
        if (
            target.blockType === Blocks.Lava &&
            block.blockType === Blocks.Water
        ) {
            if (target.metaData.props.isSource)
                target.setBlockType(Blocks.Obsidian);
            else target.setBlockType(Blocks.Cobblestone);
        }
        target.setBlockType(block.blockType);
        target.metaData.props.isSource = false;
        // sideLevel is determined below.
        return target;
    } else if (
        target &&
        target.blockType === block.blockType &&
        target.metaData.props.waterLevel >
            (block.metaData.props.isSource
                ? 0.2
                : block.metaData.props.waterLevel + 0.1) &&
        !target.metaData.props.isSource
    ) {
        return target;
    }
    return null;
}

class Block extends Square {
    constructor(
        x = 0,
        y = 0,
        blockType = Blocks.Air,
        chunkX = 0,
        wall = false
    ) {
        super(
            new Transform(new Vector2(), new Vector2()),
            1,
            GetBlock(blockType).sprite
                ? "blocks/" + GetBlock(blockType).sprite + ".png"
                : null,
            BLOCK_SIZE / 16,
            wall
        );
        this.wall = wall;
        this.x = x;
        this.y = y;
        this.chunkX = chunkX;
        this.blockType = blockType;
        this.lightSourceLevel = 0;
        this.redstoneOutput = 0;
        this.powered = false;

        this.updateSprite();
    }

    power() {
        if (!this.powered) {
            this.powered = true;
        } else {
            return;
        }

        switch (GetBlock(this.blockType).specialType) {
            case SpecialType.RedstoneLamp:
                this.lightSourceLevel = 8;
                this.setState(1);
                break;
            case SpecialType.NoteBlock:
                this.playNote();
                break;
            case SpecialType.TNT:
                this.explode();
                break;
        }
    }

    explode(shortFuse = false) {
        const tntEntity = summonEntity(TNT, getBlockWorldPosition(this));
        if (shortFuse) {
            tntEntity.fuse = 10;
        }
        this.breakBlock(false);
    }

    unpower() {
        if (this.powered) {
            this.powered = false;
        } else {
            return;
        }

        switch (GetBlock(this.blockType).specialType) {
            case SpecialType.RedstoneLamp:
                this.lightSourceLevel = 0;
                this.setState(0);
                break;
        }
    }

    setMetaData() {
        const block = GetBlock(this.blockType);

        let props = {};
        let storage = [];

        if (block.fluid) {
            props.isSource = true;
            props.waterLevel = 0;
            this.metaData = new Metadata({ props: props });
            return;
        }

        if (block.baseRedstoneOutput > 0) {
            props.power = block.baseRedstoneOutput;
            this.metaData = new Metadata({ props: props });
        }

        if (block.spawnerType !== null) {
            props.spawnDelay = RandomRange(100, 300);
            props.spawnTimer = 0;
            props.spawnLimit = 3;
            props.spawnedMobs = [];
            this.metaData = new Metadata({ props: props });

            return;
        }

        // Initialize crop metadata
        if (block.cropOutcome) {
            props.growth = 0;
            props.stage = 0; // Current growth stage
            this.metaData = new Metadata({ props: props });
            return;
        }

        if (block.saplingOutcome) {
            props.growth = 0;
            this.metaData = new Metadata({ props: props });
        }

        if (!block.specialType) return;

        const specialType = block.specialType;

        if (specialType === SpecialType.CraftingTable) return;
        if (specialType === SpecialType.RedstoneLamp) return;

        switch (specialType) {
            case SpecialType.Furnace:
                storage = [
                    [
                        new InventoryItem(), // input
                        new InventoryItem(), // fuel
                    ],
                    [new InventoryItem()], // output
                ];
                props.burningFuelTime = 0;
                props.fuelProgression = 0;
                props.progression = 0;
                break;
            case SpecialType.SingleChest:
                for (let y = 0; y < 3; y++) {
                    storage[y] = [];
                    for (let x = 0; x < 9; x++) {
                        storage[y][x] = new InventoryItem();
                    }
                }
                break;
            case SpecialType.Jukebox:
                storage = [[new InventoryItem()]];
                props.myAudio = null;
                break;
            case SpecialType.Converter:
                storage = [[new InventoryItem(), new InventoryItem()]];
                break;
            case SpecialType.NoteBlock:
                props.note = 0;
                break;
            case SpecialType.RedstoneDust:
                return;
            case SpecialType.PressurePlate:
                return;
            case SpecialType.Hopper:
                storage = [
                    [
                        new InventoryItem(),
                        new InventoryItem(),
                        new InventoryItem(),
                        new InventoryItem(),
                        new InventoryItem(),
                    ],
                ];
                break;
        }

        if (storage.length > 0) {
            props.storage = storage;
        }
        this.metaData = new Metadata({ props: props });
    }

    setBlockType(blockType, override = false) {
        if (this.blockType === blockType && !override) return;

        const myChunk = chunks.has(this.chunkX)
            ? chunks.get(this.chunkX)
            : null;

        this.dark = false;

        const existingIndex = updatingBlocks.indexOf(this);
        if (existingIndex !== -1) updatingBlocks.splice(existingIndex, 1);

        this.blockType = blockType;
        const block = GetBlock(blockType);

        this.lightSourceLevel = block.lightLevel;

        this.powered = false;

        if (myChunk) {
            if (block.chunkUpdate) {
                if (!myChunk.update.includes(this)) {
                    myChunk.update.push(this);
                }
            } else {
                const index = myChunk.update.indexOf(this);
                if (index !== -1) {
                    myChunk.update.splice(index, 1);
                }
            }
        }

        this.metaData = undefined;
        this.setMetaData();
        if (block.updateSpeed > 0 && !block.chunkUpdate)
            updatingBlocks.push(this);

        this.drawOffset = block.grassOffset ? RandomRange(-2, 2) : 0;

        this.cutoff = 0;

        this.frameCount = 0;
        this.filterBrightness = 100;

        if (block.defaultCutoff > 0) {
            this.cutoff = block.defaultCutoff;
        }

        if (block.fluid) {
            this.cutoff = this.metaData.props.waterLevel;
        }

        this.redstoneOutput = block.baseRedstoneOutput;

        this.updateSprite();
    }

    update() {
        const blockDef = GetBlock(this.blockType);

        if (blockDef.fluid) {
            this.updateSprite();
            this.simulateWaterFlow();
        }

        if (blockDef.spawnerType) this.handleSpawner();

        switch (blockDef.specialType) {
            case SpecialType.Hopper:
                this.hopperLogic();
                break;
            case SpecialType.Furnace:
                this.furnaceLogic();
                break;
        }

        if (!this.metaData || !this.metaData.props) return;

        // Handle crop growth
        if (blockDef.cropOutcome) {
            this.handleCropGrowth(blockDef);
            return; // Exit early to avoid other updates interfering
        }

        // Existing sapling logic
        if (
            this.metaData.props.growth !== undefined &&
            blockDef.saplingOutcome
        ) {
            this.metaData.props.growth++;

            if (this.metaData.props.growth >= 2400) {
                this.saplingGrow();
                return;
            }
        }

        if (
            this.metaData.props.isActive === undefined ||
            this.metaData.props.progression === undefined
        )
            return;

        if (!this.metaData.props.isActive) {
            this.resetProgression();
            return;
        }

        this.metaData.props.progression += 1 / TICK_SPEED;
    }

    hopperLogic() {
        const props = this.metaData.props;
        if (!props.storage) return;
        if (this.powered) return;

        const storage = props.storage;

        // Check for item drops above the hopper
        let transferredFromDrop = false;
        const dropEntities = this.getItemDropsAbove(); // Placeholder function

        if (dropEntities && dropEntities.length > 0) {
            for (const drop of dropEntities) {
                const dropItem = drop;
                if (
                    !dropItem ||
                    dropItem.count <= 0 ||
                    (dropItem.itemId === null && !dropItem.blockId)
                ) {
                    continue;
                }

                // Try to add to hopper's storage
                for (let y = 0; y < storage.length; y++) {
                    for (let x = 0; x < storage[y].length; x++) {
                        const hopperItem = storage[y][x];

                        // Empty slot in hopper
                        if (hopperItem.itemId === null && !hopperItem.blockId) {
                            hopperItem.itemId = dropItem.itemId;
                            hopperItem.blockId = dropItem.blockId;
                            hopperItem.props = structuredClone(
                                dropItem.props || {}
                            );
                            hopperItem.count = 1;

                            dropItem.count--;
                            if (dropItem.count <= 0) {
                                removeEntity(drop);
                            }

                            transferredFromDrop = true;
                            break;
                        }

                        // Stackable slot in hopper
                        if (
                            hopperItem.itemId === dropItem.itemId &&
                            hopperItem.blockId === dropItem.blockId &&
                            arePropsEqual(hopperItem.props, dropItem.props)
                        ) {
                            const stackSize =
                                this.getSlotItem(hopperItem)?.stackSize || 64;
                            if (hopperItem.count < stackSize) {
                                hopperItem.count++;
                                dropItem.count--;

                                if (dropItem.count <= 0) {
                                    removeEntity(drop);
                                }

                                transferredFromDrop = true;
                                break;
                            }
                        }
                    }
                    if (transferredFromDrop) break;
                }
                if (transferredFromDrop) {
                    // Sync with player's inventory if this hopper's UI is open
                    if (
                        player.windowOpen &&
                        player.inventory.interactedBlock === this
                    ) {
                        player.inventory.syncStorageSlots();
                    }
                    break; // Only process one drop per tick to avoid overloading
                }
            }
        }

        // Check block above for storage (pulling items)
        const above = GetBlockAtWorldPosition(
            this.transform.position.x,
            this.transform.position.y - BLOCK_SIZE
        );
        let transferredFromAbove = false;

        if (
            above &&
            above.metaData &&
            above.metaData.props &&
            above.metaData.props.storage &&
            GetBlock(above.blockType).specialType !== SpecialType.Hopper // Skip if above is a hopper
        ) {
            const aboveStorage = above.metaData.props.storage;

            for (let ay = 0; ay < aboveStorage.length; ay++) {
                for (let ax = 0; ax < aboveStorage[ay].length; ax++) {
                    const aboveItem = aboveStorage[ay][ax];
                    if (
                        !aboveItem ||
                        aboveItem.count <= 0 ||
                        (aboveItem.itemId === null && !aboveItem.blockId)
                    ) {
                        continue;
                    }

                    for (let y = 0; y < storage.length; y++) {
                        for (let x = 0; x < storage[y].length; x++) {
                            const hopperItem = storage[y][x];

                            if (
                                hopperItem.itemId === null &&
                                !hopperItem.blockId
                            ) {
                                hopperItem.itemId = aboveItem.itemId;
                                hopperItem.blockId = aboveItem.blockId;
                                hopperItem.props = structuredClone(
                                    aboveItem.props || {}
                                );
                                hopperItem.count = 1;

                                aboveItem.count--;
                                if (aboveItem.count <= 0) {
                                    aboveItem.itemId = null;
                                    aboveItem.blockId = null;
                                    aboveItem.props = null;
                                }

                                transferredFromAbove = true;
                                break;
                            }

                            if (
                                hopperItem.itemId === aboveItem.itemId &&
                                hopperItem.blockId === aboveItem.blockId &&
                                arePropsEqual(hopperItem.props, aboveItem.props)
                            ) {
                                const stackSize =
                                    this.getSlotItem(hopperItem)?.stackSize ||
                                    64;
                                if (hopperItem.count < stackSize) {
                                    hopperItem.count++;
                                    aboveItem.count--;

                                    if (aboveItem.count <= 0) {
                                        aboveItem.itemId = null;
                                        aboveItem.blockId = null;
                                        aboveItem.props = null;
                                    }

                                    transferredFromAbove = true;
                                    break;
                                }
                            }
                        }
                        if (transferredFromAbove) break;
                    }
                    if (transferredFromAbove) {
                        if (
                            player.windowOpen &&
                            player.inventory.interactedBlock === this
                        ) {
                            player.inventory.syncStorageSlots();
                        }
                        break;
                    }
                }
                if (transferredFromAbove) break;
            }
        }

        // Check block below for storage (pushing items)
        const below = GetBlockAtWorldPosition(
            this.transform.position.x,
            this.transform.position.y + BLOCK_SIZE
        );

        if (
            !below ||
            !below.metaData ||
            !below.metaData.props ||
            !below.metaData.props.storage
        ) {
            return; // No valid container below
        }

        const belowStorage = below.metaData.props.storage;

        if (
            !props.lastScannedSlot ||
            props.lastScannedSlot.y >= storage.length ||
            props.lastScannedSlot.x >= storage[props.lastScannedSlot.y]?.length
        ) {
            props.lastScannedSlot = { y: 0, x: 0 };
        }

        let transferredBelow = false;
        let scannedAll = true;

        for (let y = 0; y < storage.length; y++) {
            const startX =
                y === props.lastScannedSlot.y ? props.lastScannedSlot.x : 0;
            for (let x = startX; x < storage[y].length; x++) {
                const item = storage[y][x];
                if (
                    !item ||
                    item.count <= 0 ||
                    (item.itemId === null && !item.blockId)
                ) {
                    continue;
                }

                scannedAll = false;

                for (let by = 0; by < belowStorage.length; by++) {
                    for (let bx = 0; bx < belowStorage[by].length; bx++) {
                        const belowItem = belowStorage[by][bx];

                        if (belowItem.itemId === null && !belowItem.blockId) {
                            belowItem.itemId = item.itemId;
                            belowItem.blockId = item.blockId;
                            belowItem.props = structuredClone(item.props || {});
                            belowItem.count = 1;

                            item.count--;
                            if (item.count <= 0) {
                                item.itemId = null;
                                item.blockId = null;
                                item.props = null;
                            }

                            props.lastScannedSlot = {
                                y,
                                x: (x + 1) % storage[y].length,
                            };
                            transferredBelow = true;
                            break;
                        }

                        if (
                            belowItem.itemId === item.itemId &&
                            belowItem.blockId === item.blockId &&
                            arePropsEqual(belowItem.props, item.props)
                        ) {
                            const stackSize =
                                this.getSlotItem(belowItem)?.stackSize || 64;
                            if (belowItem.count < stackSize) {
                                belowItem.count++;
                                item.count--;

                                if (item.count <= 0) {
                                    item.itemId = null;
                                    item.blockId = null;
                                    item.props = null;
                                }

                                props.lastScannedSlot = {
                                    y,
                                    x: (x + 1) % storage[y].length,
                                };
                                transferredBelow = true;
                                break;
                            }
                        }
                    }
                    if (transferredBelow) break;
                }
                if (transferredBelow) {
                    if (
                        player.windowOpen &&
                        player.inventory.interactedBlock === this
                    ) {
                        player.inventory.syncStorageSlots();
                    }
                    break;
                }
            }
            if (transferredBelow) break;
        }

        if (!transferredBelow && scannedAll) {
            props.lastScannedSlot = { y: 0, x: 0 };
        }
    }

    getItemDropsAbove() {
        const entitiesOnBlock = this.checkCollisionWithEntity({
            x: 0,
            y: -BLOCK_SIZE / 2,
        });
        return entitiesOnBlock.filter(
            (entity) => entity.type === EntityTypes.Drop
        );
    }

    checkCollisionWithEntity(offset = { x: 0, y: 0 }) {
        const blockPos = getBlockWorldPosition(this);
        const blockRect = {
            x: blockPos.x + offset.x,
            y: blockPos.y + offset.y,
            width: BLOCK_SIZE,
            height: BLOCK_SIZE,
        };

        const collidingEntities = entities.filter((entity) => {
            const entityRect = {
                x: entity.position.x,
                y: entity.position.y,
                width: entity.hitbox.x,
                height: entity.hitbox.y,
            };

            return (
                blockRect.x < entityRect.x + entityRect.width &&
                blockRect.x + blockRect.width > entityRect.x &&
                blockRect.y < entityRect.y + entityRect.height &&
                blockRect.y + blockRect.height > entityRect.y
            );
        });

        return collidingEntities;
    }

    handleSpawner() {
        const props = this.metaData.props;
        const blockDef = GetBlock(this.blockType);

        // Clean up despawned or dead mobs from the tracking array
        props.spawnedMobs = props.spawnedMobs.filter(
            (mob) => mob && mob.health > 0
        );

        // Check if we can spawn more entities
        if (props.spawnedMobs.length >= props.spawnLimit) return;

        props.spawnTimer++;

        // Check if it's time to spawn
        if (props.spawnTimer >= props.spawnDelay) {
            let spawnCount = props.spawnLimit - props.spawnedMobs.length;

            if (spawnCount <= 0) return;

            for (let i = 0; i < spawnCount; i++)
                this.spawnEntity(blockDef.spawnerType);
            props.spawnTimer = 0;
            props.spawnDelay = RandomRange(100, 300);
        }
    }

    spawnEntity(entityTypeName) {
        const spawnPos = getBlockWorldPosition(this);

        // Add slight offset to prevent spawning directly inside the block
        const offsetX = RandomRange(-BLOCK_SIZE / 2, BLOCK_SIZE / 2);

        const entityType = Entities[entityTypeName];

        if (!entityType) return;

        const entity = summonEntity(
            entityType,
            new Vector2(spawnPos.x + offsetX, spawnPos.y)
        );

        if (!entity) return;

        this.metaData.props.spawnedMobs.push(entity);
    }

    handleCropGrowth(blockDef) {
        // Initialize crop growth properties if not set
        if (this.metaData.props.growth === undefined) {
            this.metaData.props.growth = 0;
            this.metaData.props.stage = 0;
        }

        // Increment growth every tick
        if (this.lightLevel > 5) this.metaData.props.growth++;

        // Calculate total stages from states array
        const totalStages = blockDef.states.length;
        const ticksPerStage = blockDef.cropSpeed; // Number of ticks per growth stage

        // Calculate current stage based on growth progress
        const currentStage = Math.min(
            Math.floor(this.metaData.props.growth / ticksPerStage),
            totalStages - 1
        );

        // Update sprite if stage has changed
        if (this.metaData.props.stage !== currentStage) {
            this.metaData.props.stage = currentStage;
            this.setState(currentStage);
        }

        // // Check if fully grown
        // if (currentStage === totalStages - 1) {
        //     // Fully grown, ready to harvest
        //     // We'll let breaking the block handle the loot (no auto-harvest)
        // }
    }

    saplingGrow() {
        const outcome = GetBlock(this.blockType).saplingOutcome;

        if (!outcome) return;

        // Get tree type using Trees enum
        const treeType = Trees[outcome];

        if (!treeType) return;

        const randomVariant =
            treeType.variants[RandomRange(0, treeType.variants.length)];

        GetChunkForX(this.chunkX).spawnTreeAt(
            randomVariant,
            this.x,
            this.calculateY()
        );
    }

    calculateY() {
        return CHUNK_HEIGHT - this.y - 1;
    }

    entityCollision(entity) {}

    // Callbacks for entities
    endEntityCollision(entity) {
        switch (GetBlock(this.blockType).specialType) {
            case SpecialType.PressurePlate:
                this.endPressurePlateLogic();
                break;
        }
    }

    startEntityCollision(entity) {
        switch (GetBlock(this.blockType).specialType) {
            case SpecialType.PressurePlate:
                this.pressurePlateLogic();
                break;
        }
    }

    pressurePlateLogic() {
        this.cutoff = 0.95;

        this.redstoneOutput = 16;

        playPositionalSound(
            getBlockWorldPosition(this),
            "blocks/wood_click.ogg",
            10,
            0.4
        );
    }

    endPressurePlateLogic() {
        this.cutoff = GetBlock(this.blockType).defaultCutoff;

        this.redstoneOutput = 0;
    }

    setState(index) {
        const sprite = GetBlock(this.blockType).states[index];
        this.setSprite("blocks/" + sprite + ".png");
    }

    furnaceLogic() {
        if (!this.metaData.props.storage) return;

        const storage = this.metaData.props.storage;
        const input = this.getSlotItem(storage[0][0]);
        const fuel = this.getSlotItem(storage[0][1]);
        const output = this.getSlotItem(storage[1][0]);
        const outputItem =
            input && input.smeltOutput
                ? this.getSlotItem(input.smeltOutput)
                : null;

        // Determine if furnace should be visually "on" based on fuel availability
        if (this.metaData.props.burningFuelTime > 0) {
            this.setState(1);
            this.metaData.props.isActive = true;
            if (!input) this.resetProgression();
        } else {
            this.setState(0);
            this.metaData.props.isActive = false;
            this.resetProgression();
        }

        // Only start burning fuel if there's an input item with a smeltable output
        if (
            !this.metaData.props.burningFuelTime &&
            input &&
            input.smeltOutput
        ) {
            if (fuel && fuel.fuelTime) {
                this.metaData.props.burningFuelTime = fuel.fuelTime;
                this.removeOneFromStack(storage[0][1]);
            } else {
                this.metaData.props.isActive = false;
                return;
            }
        }

        // If burning fuel time is active, increment fuel progression
        if (this.metaData.props.burningFuelTime > 0) {
            this.metaData.props.fuelProgression += deltaTime;
        }

        // Reset burning fuel time if it has been used up
        if (
            this.metaData.props.fuelProgression >=
            this.metaData.props.burningFuelTime
        ) {
            this.metaData.props.fuelProgression = 0;
            this.metaData.props.burningFuelTime = 0;

            if (fuel && input) {
                this.metaData.props.burningFuelTime = fuel.fuelTime;
                this.removeOneFromStack(storage[0][1]);
            }
        }

        // Only progress smelting if input and output conditions are met
        if (
            !(
                input &&
                input.smeltOutput &&
                (!output ||
                    (((output.blockId !== undefined &&
                        output.blockId === outputItem.blockId) ||
                        output.itemId === outputItem.itemId) &&
                        storage[1][0].count + 1 <=
                            (outputItem.stackSize || 64)))
            )
        ) {
            this.resetProgression();
        }

        // Complete smelting process if progression threshold is met
        if (this.metaData.props.progression >= 10) {
            this.removeOneFromStack(storage[0][0]);

            storage[1][0].itemId = outputItem
                ? outputItem.itemId
                    ? outputItem.itemId
                    : null
                : null;
            storage[1][0].blockId = outputItem
                ? outputItem.blockId
                    ? outputItem.blockId
                    : null
                : null;
            storage[1][0].count++;

            this.resetProgression();
        }
    }

    clicked(player) {
        switch (GetBlock(this.blockType).specialType) {
            case SpecialType.NoteBlock:
                this.playNote();
                break;
        }
    }

    playNote() {
        const sound = `notes/${this.getSoundBasedOfBlockBelow()}.ogg`;

        const pitch = Math.pow(2, this.metaData.props.note / 12);

        playPositionalSound(getBlockWorldPosition(this), sound, 13, 1, pitch);
    }

    getSoundBasedOfBlockBelow() {
        const blockBelow = GetBlockAtWorldPosition(
            this.transform.position.x,
            this.transform.position.y + BLOCK_SIZE
        );

        if (!blockBelow) return "harp";

        if (GetBlock(blockBelow.blockType).noteBlockSound) {
            return GetBlock(blockBelow.blockType).noteBlockSound;
        }

        return "harp";
    }

    interact(player) {
        const itemInHand = player.getSelectedSlotItem();

        const block = GetBlock(this.blockType);

        switch (block.specialType) {
            case SpecialType.Jukebox:
                this.jukeBoxInteraction(GetItem(itemInHand.itemId), player);
                break;
            case SpecialType.NoteBlock:
                this.noteBlockInteraction();
                break;
            case SpecialType.Lever:
                this.leverInteraction();
                break;
        }
    }

    leverInteraction() {
        if (this.redstoneOutput === 0) {
            this.redstoneOutput = 15;
            this.setState(1);
        } else {
            this.redstoneOutput = 0;
            this.setState(0);
        }

        playPositionalSound(
            getBlockWorldPosition(this),
            "blocks/wood_click.ogg",
            10,
            0.4
        );
    }

    redstoneDustUpdateState() {
        // Only run if this block is redstone dust.
        const def = GetBlock(this.blockType);
        if (def.specialType !== SpecialType.RedstoneDust) return;

        let connection = 1;

        // Use the block's global position.
        const pos = this.transform.position;
        const bx = pos.x;
        const by = pos.y;

        const north = GetBlockAtWorldPosition(bx, by - BLOCK_SIZE);

        // For diagonal connections, we want to only consider them if the adjacent cardinal blocks are not blocking.
        const northWest = GetBlockAtWorldPosition(
            bx - BLOCK_SIZE,
            by - BLOCK_SIZE
        );
        const northEast = GetBlockAtWorldPosition(
            bx + BLOCK_SIZE,
            by - BLOCK_SIZE
        );

        // Helper function that returns true if a block is redstone dust.
        const isRedstoneDust = (block) => {
            return (
                block &&
                GetBlock(block.blockType).specialType ===
                    SpecialType.RedstoneDust
            );
        };

        if (
            isRedstoneDust(northEast) &&
            (north ? GetBlock(north.blockType).air : true)
        ) {
            connection = 3;
        }
        if (
            isRedstoneDust(northWest) &&
            (north ? GetBlock(north.blockType).air : true)
        )
            connection = 2;
        if (
            isRedstoneDust(northEast) &&
            isRedstoneDust(northWest) &&
            (north ? GetBlock(north.blockType).air : true)
        )
            connection = 4;

        // 0 power = 0% brightness, 15 power = 100% brightness.
        this.filterBrightness = (this.redstoneOutput * 100) / 15;

        this.lightSourceLevel = this.redstoneOutput / 5;

        this.setState(connection);
    }

    noteBlockInteraction() {
        this.metaData.props.note++;
        if (this.metaData.props.note > 24) this.metaData.props.note = 0;

        chat.message("Playing note: " + this.metaData.props.note);

        this.playNote();
    }

    jukeBoxInteraction(item, player) {
        if (!item || this.metaData.props.storage[0][0].itemId !== null) {
            // Remove disc from jukebox'
            if (this.metaData.props.storage[0][0].itemId !== null) {
                summonEntity(Drop, getBlockWorldPosition(this), {
                    itemId: this.metaData.props.storage[0][0].itemId,
                    blockId: null,
                    count: 1,
                });

                removeAudio(this.metaData.props.myAudio);

                this.metaData.props.storage[0][0] = new InventoryItem();
            }

            return;
        }

        if (item.playMusicInJukebox) {
            this.metaData.props.storage[0][0].itemId = item.itemId;
            this.metaData.props.storage[0][0].blockId = null;
            this.metaData.props.storage[0][0].count = 1;

            this.metaData.props.myAudio = playPositionalSound(
                getBlockWorldPosition(this),
                "../music/" + item.playMusicInJukebox,
                20,
                1
            );

            player.removeFromCurrentSlot();
        }
    }

    checkLavaWaterInteraction(pos) {
        // Check for lava-water interaction.
        // Check for blocks surrounding this block
        const left = GetBlockAtWorldPosition(pos.x - BLOCK_SIZE, pos.y);
        const right = GetBlockAtWorldPosition(pos.x + BLOCK_SIZE, pos.y);
        const above = GetBlockAtWorldPosition(pos.x, pos.y - BLOCK_SIZE);
        const below = GetBlockAtWorldPosition(pos.x, pos.y + BLOCK_SIZE);

        let lavaBlocksNear = [];

        // If there isnt lava in any of these blocks, return
        for (let block of [left, right, above, below]) {
            if (block && block.blockType === Blocks.Lava) {
                lavaBlocksNear.push(block);
            }
        }

        if (lavaBlocksNear.length === 0) return;

        // Loop thru all lava blocks
        for (let lavaBlock of lavaBlocksNear) {
            if (lavaBlock.metaData.props.isSource) {
                lavaBlock.setBlockType(Blocks.Obsidian);
                return;
            }

            lavaBlock.setBlockType(Blocks.Cobblestone);
        }

        playPositionalSound(
            getBlockWorldPosition(this),
            "blocks/fizz.ogg",
            10,
            0.5
        );
    }

    simulateWaterFlow() {
        // Only process if this block is water.
        if (!GetBlock(this.blockType).fluid) return;

        // Initialize water properties if undefined.
        if (
            this.metaData.props.waterLevel === undefined ||
            this.metaData.props.isSource === undefined
        ) {
            this.metaData.props.waterLevel = 0;
            this.metaData.props.isSource = true;
            this.cutoff = this.metaData.props.waterLevel;
        } else {
            this.cutoff = this.metaData.props.waterLevel;
        }

        const worldPos = getBlockWorldPosition(this);

        if (this.blockType === Blocks.Water)
            this.checkLavaWaterInteraction(worldPos);

        // Dissipation (only for non-source blocks).
        if (!this.metaData.props.isSource) {
            if (checkDissipation(this, worldPos)) return;
        }

        // Downward Flow.
        const below = flowDownward(this, worldPos);

        // Vertical Check Above.
        verticalCheckAbove(this, worldPos);

        // Sideways Flow.
        if (this.metaData.props.waterLevel > 0.85) return;
        const sideLevel = this.metaData.props.isSource
            ? 0.2
            : this.metaData.props.waterLevel + 0.1;
        // Left Flow.
        if (
            this.metaData.props.isSource ||
            (below && below.blockType !== this.blockType)
        ) {
            let left = flowSideways(this, worldPos, { dx: -BLOCK_SIZE, dy: 0 });
            if (left) {
                if (
                    left.metaData.props.blockType === this.blockType &&
                    left.metaData.props.waterLevel > sideLevel &&
                    !left.metaData.props.isSource
                ) {
                    left.metaData.props.waterLevel = sideLevel;
                    left.cutoff = sideLevel;
                } else {
                    left.metaData.props.isSource = false;
                    left.metaData.props.waterLevel = sideLevel;
                    left.cutoff = sideLevel;
                }
            }
        }
        // Right Flow.
        if (
            this.metaData.props.isSource ||
            (below && below.blockType !== this.blockType)
        ) {
            let right = flowSideways(this, worldPos, { dx: BLOCK_SIZE, dy: 0 });
            if (right) {
                if (
                    right.blockType === this.blockType &&
                    right.metaData.props.waterLevel > sideLevel &&
                    !right.metaData.props.isSource
                ) {
                    right.metaData.props.waterLevel = sideLevel;
                    right.cutoff = sideLevel;
                } else {
                    right.metaData.props.isSource = false;
                    right.metaData.props.waterLevel = sideLevel;
                    right.cutoff = sideLevel;
                }
            }
        }
    }

    removeOneFromStack(item) {
        item.count--;

        if (item.count <= 0) {
            item.itemId = null;
            item.blockId = null;
        }
    }

    getSlotItem(item) {
        return item.blockId ? GetBlock(item.blockId) : GetItem(item.itemId);
    }

    resetProgression() {
        this.metaData.props.progression = 0;
    }

    breakBlock(drop = false, wall = false) {
        if (GetBlock(this.blockType).air) return;

        const chunk = chunks.get(this.chunkX);

        if (!chunk) return;

        chunk.checkForBlockWithAirBeneath(this.x, this.y);

        const blockDef = GetBlock(this.blockType);

        // Handle crop loot when fully grown
        if (blockDef.cropOutcome) {
            if (this.metaData?.props?.stage === blockDef.states.length - 1)
                this.dropCropLoot(blockDef);
            else this.dropBlock();
        } else if (drop) {
            this.dropBlock();
        }

        if (blockDef.dropTable) this.dropTable();

        this.playBreakSound();

        if (this.metaData) {
            if (this.metaData.props.storage) {
                this.dropStorage();
            }

            if (this.metaData.props.myAudio) {
                removeAudio(this.metaData.props.myAudio);
            }
        }

        chunk.setBlockType(this.x, this.y, Blocks.Air, wall, null, false);

        if (blockDef.changeToBlockWhenBroken) {
            setBlockType(this, blockDef.changeToBlockWhenBroken);
        }
    }

    dropCropLoot(blockDef) {
        const loot = blockDef.cropOutcome.getRandomLoot();

        loot.forEach((item) => {
            summonEntity(
                Drop,
                new Vector2(
                    this.transform.position.x + RandomRange(0, BLOCK_SIZE / 3),
                    this.transform.position.y + BLOCK_SIZE / 4
                ),
                {
                    blockId: item.blockId,
                    itemId: item.itemId,
                    count: item.count,
                }
            );
        });
    }

    gravityBlock() {
        let fallEntity = Entities.Sand;

        summonEntity(fallEntity, getBlockWorldPosition(this), {
            blockType: this.blockType,
        });

        this.breakBlock(false);
    }

    playBreakSound() {
        const soundArray = GetBlock(this.blockType).breakSound;

        if (!soundArray) return;

        PlayRandomSoundFromArray({
            array: soundArray,
            positional: true,
            origin: getBlockWorldPosition(this),
        });
    }

    dropTable() {
        const block = GetBlock(this.blockType);

        const loot = block.dropTable.getRandomLoot();

        loot.forEach((item) => {
            summonEntity(
                Drop,
                new Vector2(
                    this.transform.position.x + RandomRange(0, BLOCK_SIZE / 3),
                    this.transform.position.y + BLOCK_SIZE / 4
                ),
                {
                    blockId: item.blockId,
                    itemId: item.itemId,
                    count: item.count,
                }
            );
        });
    }

    dropBlock() {
        const block = GetBlock(this.blockType);

        let props = {};
        if (this.wall) {
            props.wall = true;
        }

        summonEntity(
            Drop,
            new Vector2(
                this.transform.position.x + RandomRange(0, BLOCK_SIZE / 3),
                this.transform.position.y + BLOCK_SIZE / 4
            ),
            {
                blockId: block.dropItem == null ? block.dropBlock : null,
                itemId: block.dropItem != null ? block.dropItem : null,
                props: props,
            }
        );
    }

    dropStorage() {
        const storage = this.metaData.props.storage;

        for (let y = 0; y < storage.length; y++) {
            for (let x = 0; x < storage[y].length; x++) {
                const item = storage[y][x];
                if (!item.blockId && item.itemId === null) continue;
                summonEntity(
                    Drop,
                    new Vector2(
                        this.transform.position.x +
                            RandomRange(0, BLOCK_SIZE / 3),
                        this.transform.position.y + BLOCK_SIZE / 4
                    ),
                    {
                        blockId: item.blockId,
                        itemId: item.itemId,
                        count: item.count,
                        props: structuredClone(item.props || {}),
                    }
                );
            }
        }
    }

    updateSprite() {
        const block = GetBlock(this.blockType);

        if (block.air) {
            this.alpha = 0;
            this.img = null;
            return;
        }

        this.alpha = 1;

        this.frameRate = block.animationSpeed;

        this.setSprite("blocks/" + block.sprite + ".png");
    }
}

function GetBlock(blockId) {
    return blockMap.has(blockId) ? blockMap.get(blockId) : 0;
}
