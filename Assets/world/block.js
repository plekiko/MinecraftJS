class BlockType {
    constructor({
        blockId,
        sprite = null,
        states = [],
        name = "New block",
        hardness = -2,
        grassOffset = false,
        animationSpeed = null,
        fluid = false,
        drag = 40,
        collision = true,

        air = false,

        dropSelf = true,

        chunkProtection = false,

        updateSpeed = 0,
        chunkUpdate = false,
        removeFromUpdatingWhenInactive = true,

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

        dropTable = null,

        fuelTime = null,
        smeltOutput = null,

        specialType = null,
    } = {}) {
        this.blockId = blockId;
        this.sprite = sprite;
        this.states = states;
        this.name = name;
        this.hardness = hardness;
        this.grassOffset = grassOffset;
        this.animationSpeed = animationSpeed;
        this.fluid = fluid;
        this.drag = drag;
        this.collision = collision;
        this.breakSound = breakSound;
        this.breakingSound = breakingSound;

        this.air = air;

        this.chunkProtection = chunkProtection;

        this.updateSpeed = updateSpeed;
        this.chunkUpdate = chunkUpdate;
        this.removeFromUpdatingWhenInactive = removeFromUpdatingWhenInactive;

        this.fall = fall;

        this.ambientSound = ambientSound;

        this.breakWithoutBlockUnderneath = breakWithoutBlockUnderneath;

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
    }
}

const SpecialType = Object.freeze({
    CraftingTable: 1,
    Furnace: 2,
    SingleChest: 3,
    Jukebox: 4,
});

const BlockCategory = Object.freeze({
    Logs: 1,
    Planks: 2,
});

class Metadata {
    constructor({ storage = null, props = null } = {}) {
        this.storage = storage;
        this.myAudio = props?.myAudio;
        this.progression = 0;
        this.fuelProgression = 0;
        this.isActive = false;
        this.burningFuelTime = 0;
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
            neighbor.waterLevel < block.waterLevel
        ) {
            neighborHasHigher = true;
        }
    });
    if (!neighborHasHigher) {
        block.waterLevel += 0.25;
        block.cutoff = block.waterLevel;
        if (block.waterLevel >= 0.85) {
            block.setBlockType(Blocks.Air);
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
        below.isSource = false;
        below.waterLevel = 0;
        below.cutoff = below.waterLevel;
    }
    return below;
}

function verticalCheckAbove(block, worldPos) {
    let above = GetBlockAtWorldPosition(worldPos.x, worldPos.y - BLOCK_SIZE);
    if (above) {
        if (above.blockType === block.blockType) {
            block.waterLevel = 0;
            block.cutoff = block.waterLevel;
        } else if (GetBlock(above.blockType).air && block.isSource) {
            block.waterLevel = 0; // As per original code.
            block.cutoff = block.waterLevel + 0.1;
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
            if (target.isSource) target.setBlockType(Blocks.Obsidian);
            else target.setBlockType(Blocks.Cobblestone);
        }
        target.setBlockType(block.blockType);
        target.isSource = false;
        // sideLevel is determined below.
        return target;
    } else if (
        target &&
        target.blockType === block.blockType &&
        target.waterLevel > (block.isSource ? 0.2 : block.waterLevel + 0.1) &&
        !target.isSource
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
        this.x = x;
        this.y = y;
        this.chunkX = chunkX;
        this.blockType = blockType;

        if (GetBlock(blockType).fluid) {
            this.isSource = true;
            this.waterLevel = 0;
            this.cutoff = this.waterLevel;
        }

        this.updateSprite();
    }

    setMetaData() {
        const specialType = GetBlock(this.blockType).specialType;
        if (specialType == SpecialType.CraftingTable) return;

        let storage = [];
        let props = {};

        switch (specialType) {
            case SpecialType.Furnace:
                storage = [
                    [
                        // input
                        new InventoryItem(),
                        // fuel
                        new InventoryItem(),
                    ],
                    // output
                    [new InventoryItem()],
                ];
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
        }

        this.metaData = new Metadata({ storage: storage, props: props });
    }

    setBlockType(blockType, override = false) {
        if (this.blockType === blockType && !override) return;

        const myChunk = chunks.has(this.chunkX)
            ? chunks.get(this.chunkX)
            : null;

        const existingIndex = updatingBlocks.indexOf(this);
        if (existingIndex !== -1) updatingBlocks.splice(existingIndex, 1);

        this.blockType = blockType;
        const block = GetBlock(blockType);

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
        if (block.specialType) this.setMetaData();
        if (block.updateSpeed > 0 && !block.chunkUpdate)
            updatingBlocks.push(this);

        this.drawOffset = block.grassOffset ? RandomRange(-2, 2) : 0;

        this.cutoff = 0;

        this.waterLevel = undefined;
        this.isSource = undefined;

        this.frameCount = 0;

        if (block.fluid) {
            this.isSource = true;
            this.waterLevel = 0;
            this.cutoff = this.waterLevel;
        }

        this.updateSprite();
    }

    update() {
        if (GetBlock(this.blockType).specialType === SpecialType.Furnace)
            this.furnaceLogic();

        if (GetBlock(this.blockType).fluid) {
            this.updateSprite();
            this.simulateWaterFlow();
        }

        if (!this.metaData) return;

        if (!this.metaData.isActive) {
            this.resetProgression();
            return;
        }

        this.metaData.progression += 1 / TICK_SPEED;
    }

    setState(index) {
        const sprite = GetBlock(this.blockType).states[index];
        this.setSprite("blocks/" + sprite + ".png");
    }

    furnaceLogic() {
        if (!this.metaData.storage) return;

        const storage = this.metaData.storage;
        const input = this.getSlotItem(storage[0][0]);
        const fuel = this.getSlotItem(storage[0][1]);
        const output = this.getSlotItem(storage[1][0]);
        const outputItem =
            input && input.smeltOutput
                ? this.getSlotItem(input.smeltOutput)
                : null;

        // Determine if furnace should be visually "on" based on fuel availability
        if (this.metaData.burningFuelTime > 0) {
            this.setState(1);
            this.metaData.isActive = true;
            if (!input) this.resetProgression();
        } else {
            this.setState(0);
            this.metaData.isActive = false;
            this.resetProgression();
        }

        // Only start burning fuel if there's an input item with a smeltable output
        if (!this.metaData.burningFuelTime && input && input.smeltOutput) {
            if (fuel) {
                this.metaData.burningFuelTime = fuel.fuelTime;
                this.removeOneFromStack(storage[0][1]);
            } else {
                this.metaData.isActive = false;
                return;
            }
        }

        // If burning fuel time is active, increment fuel progression
        if (this.metaData.burningFuelTime > 0) {
            this.metaData.fuelProgression += deltaTime;
        }

        // Reset burning fuel time if it has been used up
        if (this.metaData.fuelProgression >= this.metaData.burningFuelTime) {
            this.metaData.fuelProgression = 0;
            this.metaData.burningFuelTime = 0;

            if (fuel && input) {
                this.metaData.burningFuelTime = fuel.fuelTime;
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
        if (this.metaData.progression >= 10) {
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

    interact(player) {
        const itemInHand = player.getSelectedSlotItem();

        const block = GetBlock(this.blockType);

        switch (block.specialType) {
            case SpecialType.Jukebox:
                this.jukeBoxInteraction(GetItem(itemInHand.itemId), player);
                break;
        }
    }

    jukeBoxInteraction(item, player) {
        if (!item || this.metaData.storage[0][0].itemId !== null) {
            // Remove disc from jukebox'
            if (this.metaData.storage[0][0].itemId !== null) {
                summonEntity(Drop, getBlockWorldPosition(this), {
                    itemId: this.metaData.storage[0][0].itemId,
                    blockId: null,
                    count: 1,
                });

                removeAudio(this.metaData.myAudio);

                this.metaData.storage[0][0] = new InventoryItem();
            }

            return;
        }

        if (item.playMusicInJukebox) {
            this.metaData.storage[0][0].itemId = item.itemId;
            this.metaData.storage[0][0].blockId = null;
            this.metaData.storage[0][0].count = 1;

            this.metaData.myAudio = playPositionalSound(
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
            if (lavaBlock.isSource) {
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
        if (this.waterLevel === undefined || this.isSource === undefined) {
            this.waterLevel = 0;
            this.isSource = true;
            this.cutoff = this.waterLevel;
        } else {
            this.cutoff = this.waterLevel;
        }

        const worldPos = getBlockWorldPosition(this);

        if (this.blockType === Blocks.Water)
            this.checkLavaWaterInteraction(worldPos);

        // Dissipation (only for non-source blocks).
        if (!this.isSource) {
            if (checkDissipation(this, worldPos)) return;
        }

        // Downward Flow.
        const below = flowDownward(this, worldPos);

        // Vertical Check Above.
        verticalCheckAbove(this, worldPos);

        // Sideways Flow.
        if (this.waterLevel > 0.85) return;
        const sideLevel = this.isSource ? 0.2 : this.waterLevel + 0.1;
        // Left Flow.
        if (this.isSource || (below && below.blockType !== this.blockType)) {
            let left = flowSideways(this, worldPos, { dx: -BLOCK_SIZE, dy: 0 });
            if (left) {
                if (
                    left.blockType === this.blockType &&
                    left.waterLevel > sideLevel &&
                    !left.isSource
                ) {
                    left.waterLevel = sideLevel;
                    left.cutoff = sideLevel;
                } else {
                    left.isSource = false;
                    left.waterLevel = sideLevel;
                    left.cutoff = sideLevel;
                }
            }
        }
        // Right Flow.
        if (this.isSource || (below && below.blockType !== this.blockType)) {
            let right = flowSideways(this, worldPos, { dx: BLOCK_SIZE, dy: 0 });
            if (right) {
                if (
                    right.blockType === this.blockType &&
                    right.waterLevel > sideLevel &&
                    !right.isSource
                ) {
                    right.waterLevel = sideLevel;
                    right.cutoff = sideLevel;
                } else {
                    right.isSource = false;
                    right.waterLevel = sideLevel;
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
        this.metaData.progression = 0;
    }

    breakBlock(drop = false) {
        if (GetBlock(this.blockType).air) return;

        if (chunks.has(this.chunkX)) {
            chunks.get(this.chunkX).checkForBlockWithAirBeneath(this.x, this.y);
        }

        if (drop) this.dropBlock();

        if (GetBlock(this.blockType).dropTable) this.dropTable();

        this.playBreakSound();

        if (this.metaData) {
            if (this.metaData.storage) {
                this.dropStorage();
            }

            if (this.metaData.myAudio) {
                removeAudio(this.metaData.myAudio);
            }
        }

        this.setBlockType(Blocks.Air);
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

        summonEntity(
            Drop,
            new Vector2(
                this.transform.position.x + RandomRange(0, BLOCK_SIZE / 3),
                this.transform.position.y + BLOCK_SIZE / 4
            ),
            {
                blockId: block.dropItem == null ? block.dropBlock : null,
                itemId: block.dropItem != null ? block.dropItem : null,
            }
        );
    }

    dropStorage() {
        const storage = this.metaData.storage;

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
        if (GetBlock(this.blockType).air) {
            this.alpha = 0;
            return;
        }

        this.alpha = 1;

        this.frameRate = GetBlock(this.blockType).animationSpeed;

        this.setSprite("blocks/" + GetBlock(this.blockType).sprite + ".png");
    }
}

function GetBlock(blockId) {
    return blockMap.has(blockId) ? blockMap.get(blockId) : 0;
}
