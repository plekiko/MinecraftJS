class BlockType {
    constructor({
        blockId,
        sprite = null,
        name = "New block",
        hardness = -2,
        grassOffset = false,
        animationSpeed = null,
        fluid = false,
        drag = 40,
        collision = true,

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
        this.name = name;
        this.hardness = hardness;
        this.grassOffset = grassOffset;
        this.animationSpeed = animationSpeed;
        this.fluid = fluid;
        this.drag = drag;
        this.collision = collision;
        this.breakSound = breakSound;
        this.breakingSound = breakingSound;

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
});

const BlockCategory = Object.freeze({
    Logs: 1,
    Planks: 2,
});

class Metadata {
    constructor({ storage = null }) {
        this.storage = storage;
        this.progression = 0;
        this.fuelProgression = 0;
        this.isActive = false;
        this.burningFuelTime = 0;
    }
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
            blockType == Blocks.Air ? 0 : 1,
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
    }

    setMetaData() {
        const specialType = GetBlock(this.blockType).specialType;
        if (specialType == SpecialType.CraftingTable) return;

        let storage = [];

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
        }

        this.metaData = new Metadata({ storage: storage });
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

        if (GetBlock(blockType).fluid) {
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
            this.simulateWaterFlow();
        }

        if (!this.metaData) return;

        if (!this.metaData.isActive) {
            this.resetProgression();
            return;
        }

        this.metaData.progression += 1 / TICK_SPEED;
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
            this.setSprite("blocks/furnace_front_on.png");
            this.metaData.isActive = true;
            if (!input) this.resetProgression();
        } else {
            this.setSprite("blocks/furnace_front_off.png");
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

            storage[1][0].itemId = outputItem ? outputItem.itemId : null;
            storage[1][0].blockId = outputItem ? outputItem.blockId : null;
            storage[1][0].count++;

            this.resetProgression();
        }
    }

    simulateWaterFlow() {
        // Only process if this block is water.
        if (!GetBlock(this.blockType).fluid) return;

        // Ensure waterLevel and isSource are defined.
        if (this.waterLevel === undefined || this.isSource === undefined) {
            this.waterLevel = 0; // Full water level for a source block.
            this.isSource = true;
            this.cutoff = this.waterLevel;
        } else {
            // Update the rendering cutoff using waterLevel.
            this.cutoff = this.waterLevel;
        }

        const worldPos = getBlockWorldPosition(this);

        // For non-source water blocks, determine if they should dissipate.
        if (!this.isSource) {
            // Check neighbors (above, left, right) to see if any have a higher water level.
            let neighborHasHigher = false;
            const neighbors = [
                GetBlockAtWorldPosition(
                    worldPos.x,
                    worldPos.y - BLOCK_SIZE,
                    false
                ), // above
                GetBlockAtWorldPosition(
                    worldPos.x - BLOCK_SIZE,
                    worldPos.y,
                    false
                ), // left
                GetBlockAtWorldPosition(
                    worldPos.x + BLOCK_SIZE,
                    worldPos.y,
                    false
                ), // right
            ];
            neighbors.forEach((n) => {
                if (
                    n &&
                    n.blockType === this.blockType &&
                    n.waterLevel < this.waterLevel
                ) {
                    neighborHasHigher = true;
                }
            });
            // Only dissipate if no neighbor has a higher water level.
            if (!neighborHasHigher) {
                this.waterLevel += 0.25;
                this.cutoff = this.waterLevel;
                if (this.waterLevel >= 0.85) {
                    this.setBlockType(Blocks.Air);
                    return;
                }
            }
        }

        // --- Downward Flow ---
        let below = GetBlockAtWorldPosition(
            worldPos.x,
            worldPos.y + BLOCK_SIZE,
            false
        );
        if (
            (below && below.blockType === Blocks.Air) ||
            (below && GetBlock(below.blockType).breakByFluid)
        ) {
            if (GetBlock(below.blockType).breakByFluid) {
                below.breakBlock(GetBlock(below.blockType).dropWithoutTool);
            }
            below.setBlockType(this.blockType);
            // For source blocks, spawn a source downward; otherwise propagate the current waterLevel.
            below.isSource = false;
            below.waterLevel = 0;
            below.cutoff = below.waterLevel;
        }

        // --- Vertical Check Above ---
        let above = GetBlockAtWorldPosition(
            worldPos.x,
            worldPos.y - BLOCK_SIZE,
            false
        );
        if (above) {
            // Instead of forcing waterLevel to 0, we could average them to help smooth changes.
            // For now, we simply keep this block's waterLevel low.
            if (above.blockType === this.blockType) {
                this.waterLevel = 0;
                this.cutoff = this.waterLevel;
            } else {
                if (above.blockType === Blocks.Air && this.isSource) {
                    this.waterLevel = 0;
                    this.cutoff = this.waterLevel + 0.1;
                }
            }
        }

        // --- Sideways Flow ---
        // Avoid sideways flow if below is water (to prevent interference) or if waterLevel is too high.
        if (!this.isSource && below && GetBlock(below.blockType).fluid) return;
        if (this.waterLevel > 0.85) return;

        // For side flow, new water blocks receive a waterLevel that is slightly higher than the current one.
        let sideLevel = this.isSource ? 0.2 : this.waterLevel + 0.1;

        // Check left.
        let left = GetBlockAtWorldPosition(
            worldPos.x - BLOCK_SIZE,
            worldPos.y,
            false
        );
        if (
            left &&
            (left.blockType === Blocks.Air ||
                GetBlock(left.blockType).breakByFluid)
        ) {
            if (GetBlock(left.blockType).breakByFluid) {
                left.breakBlock(GetBlock(left.blockType).dropWithoutTool);
            }
            left.setBlockType(this.blockType);
            left.isSource = false; // Sideways water is flowing.
            left.waterLevel = sideLevel;
            left.cutoff = left.waterLevel;
        } else if (
            left &&
            left.blockType === this.blockType &&
            left.waterLevel > sideLevel &&
            !left.isSource
        ) {
            left.waterLevel = sideLevel;
            left.cutoff = left.waterLevel;
        }

        // Check right.
        let right = GetBlockAtWorldPosition(
            worldPos.x + BLOCK_SIZE,
            worldPos.y,
            false
        );
        if (
            right &&
            (right.blockType === Blocks.Air ||
                GetBlock(right.blockType).breakByFluid)
        ) {
            if (GetBlock(right.blockType).breakByFluid) {
                right.breakBlock(GetBlock(right.blockType).dropWithoutTool);
            }
            right.setBlockType(this.blockType);
            right.isSource = false; // Sideways water is flowing.
            right.waterLevel = sideLevel;
            right.cutoff = right.waterLevel;
        } else if (
            right &&
            right.blockType === this.blockType &&
            right.waterLevel > sideLevel &&
            !right.isSource
        ) {
            right.waterLevel = sideLevel;
            right.cutoff = right.waterLevel;
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

    // shouldDisplayFluidSprite(block) {
    //     // Only process if this block is a fluid.
    //     if (!block.fluid) return false;

    //     // Get the chunk that this block belongs to.
    //     const chunk = GetChunk(this.chunkX);
    //     if (!chunk) return true; // If no chunk, assume sprite should display.

    //     // Get the block directly above.
    //     const aboveBlock = chunk.getUp(this.x, this.y);

    //     // If there's no block above or it's air, show the fluid sprite.
    //     if (!aboveBlock || aboveBlock.blockType === Blocks.Air) {
    //         return true;
    //     }

    //     // Only display the fluid sprite if the block above is NOT the same fluid type.
    //     return aboveBlock.blockType !== this.blockType;
    // }

    breakBlock(drop = false) {
        if (this.blockType === Blocks.Air) return;

        if (chunks.has(this.chunkX)) {
            chunks.get(this.chunkX).checkForBlockWithAirBeneath(this.x, this.y);
        }

        if (drop) this.dropBlock();

        if (GetBlock(this.blockType).dropTable) this.dropTable();

        this.playBreakSound();

        if (this.metaData && this.metaData.storage) this.dropStorage();

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
                    this.transform.position.x +
                        camera.x +
                        RandomRange(0, BLOCK_SIZE / 3),
                    this.transform.position.y + camera.y + BLOCK_SIZE / 4
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
                this.transform.position.x +
                    camera.x +
                    RandomRange(0, BLOCK_SIZE / 3),
                this.transform.position.y + camera.y + BLOCK_SIZE / 4
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
                            camera.x +
                            RandomRange(0, BLOCK_SIZE / 3),
                        this.transform.position.y + camera.y + BLOCK_SIZE / 4
                    ),
                    {
                        blockId: item.blockId,
                        itemId: item.itemId,
                        count: item.count,
                    }
                );
            }
        }
    }

    updateSprite() {
        if (!GetBlock(this.blockType).sprite) {
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
