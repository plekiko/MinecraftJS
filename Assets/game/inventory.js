class Inventory {
    constructor() {
        this.inventoryUI = { x: 492, y: 150 };

        this.items = [];
        this.craftingSlots = [];
        this.furnaceSlots = [];
        this.storageSlots = null;

        this.craftingOutputPosition = {
            x: 508,
            y: 130,
        };
        this.craftingOutputSlot = new InventorySlot({
            position: {
                ...this.craftingOutputPosition,
            },
            item: new InventoryItem(),
        });

        this.craftingPosition = {
            x: 312,
            y: 95,
        };

        this.selectedBlock = null;
        this.selectedItem = null;
        this.currentSlot = 0;

        this.craftingTable = false;
        this.craftingTableOutputPosition = {
            x: 437,
            y: 127,
        };
        this.craftingTablePosition = {
            x: 109,
            y: 64,
        };

        this.furnace = false;
        this.furnaceSlots = null;

        this.openUIImage = "";

        this.interactedBlock = null;

        this.lastHoveredSlot = { x: null, y: null };

        this.hoverItem = null;
        this.hoverSlot = { x: null, y: null, array: null };

        this.holdingItem = null;

        this.storage = null;

        this.createItemArray();
    }

    createItemArray() {
        for (let y = 0; y < 4; y++) {
            this.items[y] = [];
            for (let x = 0; x < 9; x++) {
                const position = {
                    x: 32 + x * 63,
                    y: y !== 3 ? 298 + y * 63 : 501,
                };

                this.items[y][x] = new InventorySlot({
                    position: position,
                    item: new InventoryItem(),
                });
            }
        }

        this.createCraftingArray();
    }

    createCraftingArray(range = 2) {
        this.craftingSlots = [];
        const basePosition = this.craftingTable
            ? this.craftingTablePosition
            : this.craftingPosition;

        for (let y = 0; y < range; y++) {
            this.craftingSlots[y] = [];
            for (let x = 0; x < range; x++) {
                const position = {
                    x: basePosition.x + x * 63,
                    y: basePosition.y + y * 63,
                };

                this.craftingSlots[y][x] = new InventorySlot({
                    position: position,
                    item: new InventoryItem(),
                });
            }
        }
    }

    dropAll(position) {
        for (let y = 0; y < this.items.length; y++) {
            for (let x = 0; x < this.items[y].length; x++) {
                const item = this.items[y][x].item;

                if (!item.blockId && (!item.itemId || item.itemId === 0))
                    continue;

                summonEntity(
                    Drop,
                    new Vector2(
                        position.x + RandomRange(-BLOCK_SIZE, BLOCK_SIZE),
                        position.y
                    ),
                    {
                        blockId: item.blockId,
                        itemId: item.itemId,
                        count: item.count,
                    }
                );
            }
        }

        this.createItemArray();
    }

    isSlotHovered(x, y) {
        return mouseOverPosition(
            this.inventoryUI.x + x,
            this.inventoryUI.y + y,
            16 * 3,
            16 * 3
        );
    }

    handleRightClickSpread(item, x, y, array) {
        if (array[y][x].onlyTake) return;
        if (
            input.isRightMouseDown() &&
            (this.lastHoveredSlot.x !== x || this.lastHoveredSlot.y !== y)
        ) {
            this.rightClickMovingLogic(item);
            this.lastHoveredSlot = { x, y };
        }
    }

    closeInventory() {
        // console.log("hey dont close me!");

        let leftOver = [];

        for (let y = 0; y < this.craftingSlots.length; y++) {
            for (let x = 0; x < this.craftingSlots[y].length; x++) {
                const item = this.craftingSlots[y][x].item;

                if ((item.blockId || item.itemId != null) && item.count > 0) {
                    let leftOverCount = 0;
                    leftOverCount = this.addItem(item);
                    if (leftOverCount > 0) {
                        leftOver.push(
                            new InventoryItem({
                                blockId: item.blockId,
                                itemId: item.itemId,
                                count: leftOverCount,
                            })
                        );
                    }
                }
            }
        }

        this.createCraftingArray();

        this.furnaceSlots = null;

        this.storageSlots = null;

        this.storage = null;

        this.openUIImage = "";

        return leftOver.length > 0 ? leftOver : null;
    }

    addItemToArray(newItem, array) {
        let remaining = newItem.count;

        // First, try to add to existing stacks.
        for (let y = 0; y < array.length; y++) {
            for (let x = 0; x < array[y].length; x++) {
                let slot = array[y][x];
                if (
                    !slot.isEmpty() &&
                    slot.item.blockId === newItem.blockId &&
                    slot.item.itemId === newItem.itemId &&
                    slot.item.count < this.getStackSize(slot.item)
                ) {
                    const available =
                        this.getStackSize(slot.item) - slot.item.count;
                    const toAdd = Math.min(remaining, available);
                    slot.item.count += toAdd;
                    remaining -= toAdd;
                    if (remaining === 0) return 0;
                }
            }
        }

        // Then, try to place into empty slots.
        for (let y = 0; y < array.length; y++) {
            for (let x = 0; x < array[y].length; x++) {
                let slot = array[y][x];
                if (slot.isEmpty()) {
                    // Place as many as possible in this slot.
                    const stackSize = this.getStackSize(newItem);
                    slot.item = structuredClone(newItem);
                    slot.item.count = Math.min(remaining, stackSize);
                    remaining -= slot.item.count;
                    if (remaining === 0) return 0;
                }
            }
        }
        return remaining;
    }

    handleShiftClick(slot, array) {
        if (!input.shiftPressed || !array || slot.isEmpty()) return false;

        let targetArray = null;
        // Determine target array: if the slot is in the main inventory and chest is open, transfer to chest;
        // otherwise if slot is in the chest, transfer to main inventory.
        if (array === this.items && this.storageSlots) {
            targetArray = this.storageSlots;
        } else if (array === this.storageSlots && this.items) {
            targetArray = this.items;
        } else {
            return false;
        }

        if (slot.onlyTake) return false;

        // Clone the item from the current slot.
        let itemToTransfer = structuredClone(slot.item);
        let originalCount = itemToTransfer.count;

        // Try to add the entire cloned item stack into the target array.
        let remaining = this.addItemToArray(itemToTransfer, targetArray);
        let moved = originalCount - remaining;

        // Deduct the moved amount from the original slot.
        slot.item.count -= moved;
        if (slot.item.count <= 0) {
            this.clearSlot(slot);
        }

        // Update the underlying storage if the original array is a storage.
        if (array === this.storageSlots) {
            for (let i = 0; i < this.storageSlots.length; i++) {
                for (let j = 0; j < this.storageSlots[i].length; j++) {
                    this.storage[i][j] = structuredClone(
                        this.storageSlots[i][j].item
                    );
                }
            }
        }
        if (targetArray === this.storageSlots) {
            // Rebuild the chest storage from the storageSlots view.
            for (let i = 0; i < this.storageSlots.length; i++) {
                for (let j = 0; j < this.storageSlots[i].length; j++) {
                    // Make a deep copy if needed; structuredClone (or JSON methods) can be used here.
                    this.storage[i][j] = structuredClone(
                        this.storageSlots[i][j].item
                    );
                }
            }
        }

        return true;
    }

    openConverter(storage) {
        this.storage = storage;

        let slots = [];

        this.openUIImage = "converter";

        slots = [
            [
                new InventorySlot({
                    position: { x: 193, y: 123 },
                    item: this.storage[0][0],
                }),
                new InventorySlot({
                    position: { x: 410, y: 126 },
                    onlyTake: true,
                }),
            ],
        ];

        this.storageSlots = slots;
    }

    updateConverter() {
        // Ensure we're in converter mode.
        if (!this.storageSlots || this.openUIImage !== "converter") return;

        const leftSlot = this.storageSlots[0][0];
        const rightSlot = this.storageSlots[0][1];

        // If the left slot is empty, clear the right slot.
        if (leftSlot.isEmpty()) {
            this.clearSlot(rightSlot);
            return;
        }

        // Only operate on blocks—not items.
        // If there's no blockId, then this is not a block.
        if (!leftSlot.item.blockId) {
            this.clearSlot(rightSlot);
            return;
        }

        // Retrieve block data for the item in the left slot.
        const block = GetBlock(leftSlot.item.blockId);

        // If the block has the cannotBeConverted tag, do nothing (or clear the output).
        if (block.cannotBeConverted) {
            this.clearSlot(rightSlot);
            return;
        }

        // Otherwise, take the input item from the left slot and create a converted output.
        let inputItem = leftSlot.item;
        let outputItem = structuredClone(inputItem);
        outputItem.props = outputItem.props || {};

        // Toggle conversion:
        // If the input already has the wall property, remove it; otherwise, add it.
        if (outputItem.props.wall) {
            delete outputItem.props.wall;
        } else {
            outputItem.props.wall = true;
        }

        // Place the converted output in the right slot.
        rightSlot.item = outputItem;

        // When the player takes the output (i.e. holding item matches the converted item), clear both slots.
        if (
            this.holdingItem &&
            this.holdingItem.blockId === rightSlot.item.blockId &&
            this.holdingItem.itemId === rightSlot.item.itemId &&
            this.holdingItem.props &&
            ((this.holdingItem.props.wall && rightSlot.item.props.wall) ||
                (!this.holdingItem.props.wall && !rightSlot.item.props.wall))
        ) {
            this.clearSlot(leftSlot);
            this.clearSlot(rightSlot);

            playPositionalSound(player.position, "blocks/anvil_use.ogg");
        }
    }

    openFurnace(storage) {
        this.furnace = true;

        this.storage = storage;

        this.createFurnaceSlots();
    }

    openSingleChest(storage) {
        this.storage = storage;

        this.createChestSlots();
    }

    createChestSlots() {
        let slots = [];

        for (let y = 0; y < this.storage.length; y++) {
            slots[y] = [];
            for (let x = 0; x < this.storage[y].length; x++) {
                let position = { x: 32 + x * 63, y: 70 + y * 63 };

                let slot = new InventorySlot({
                    position: position,
                    item: this.storage[y][x],
                });
                slots[y][x] = slot;
            }
        }

        this.storageSlots = slots;
    }

    createFurnaceSlots() {
        let slots = [];

        for (let y = 0; y < this.storage.length; y++) {
            slots[y] = [];
            for (let x = 0; x < this.storage.length; x++) {
                let position = { x: 0, y: 0 };

                // Input
                if (y === 0 && x === 0) position = { x: 200, y: 64 };
                // Fuel
                if (y === 0 && x === 1) position = { x: 200, y: 190 };
                // Output
                if (y === 1 && x === 0) position = { x: 410, y: 126 };

                let slot = new InventorySlot({
                    position: position,
                    item: this.storage[y][x],
                });
                slots[y][x] = slot;
            }
        }

        slots[1][0].onlyTake = true;

        this.furnaceSlots = slots;
    }

    refreshInventory() {
        if (this.furnace || this.storageSlots) {
            this.craftingSlots = [];
            return;
        }

        this.craftingOutputSlot.position = this.craftingOutputPosition;
        if (this.craftingTable)
            this.craftingOutputSlot.position = this.craftingTableOutputPosition;

        this.createCraftingArray(this.craftingTable ? 3 : 2);
    }

    // Logic for picking up half the item stack
    handleRightClickGetHalf(item, x, y, array) {
        if (
            input.isRightMouseDown() &&
            !this.holdingItem &&
            (item.blockId || item.itemId != null)
        ) {
            this.getHalf(item, x, y, array);
            return true;
        }
        return false;
    }

    // Logic for picking up or moving items
    handleLeftClickItemInteraction(item, x, y, array) {
        if (!input.isLeftMouseButtonPressed()) return;

        if (input.shiftPressed) {
            // If shift-click transfer succeeded, exit.
            if (array) if (this.handleShiftClick(array[y][x], array)) return;
        }

        // Specific handling for the crafting output slot
        if (item === this.craftingOutputSlot.item) {
            const maxStackSize = this.getStackSize(item);
            const isSameType =
                this.holdingItem &&
                this.holdingItem.blockId === item.blockId &&
                this.holdingItem.itemId === item.itemId &&
                this.arePropsEqual(this.holdingItem.props, item.props);

            // Calculate combined count only if holding the same item type
            const combinedCount = isSameType
                ? this.holdingItem.count + this.craftingOutputSlot.item.count
                : this.craftingOutputSlot.item.count;

            if (item.itemId === null && item.blockId === null) return;

            // Check if we can add the crafting output to holdingItem without exceeding max stack size
            if (
                this.holdingItem &&
                isSameType &&
                combinedCount <= maxStackSize
            ) {
                this.holdingItem.count = combinedCount;
                this.clearItem(item);
                this.craftingComplete();
            } else if (!this.holdingItem) {
                // If not already holding an item, pick up the crafting output directly
                this.holdingItem = structuredClone(item);
                this.clearItem(item);
                this.craftingComplete();
            }
            return; // Return here to prevent further interaction logic with crafting slot
        }

        // If we are holding an item, attempt to place it in the specified item slot
        if (this.holdingItem && array) {
            // Check if the current slot allows placing items
            if (array[y][x].onlyTake) {
                return; // Do not allow placing items in this slot
            }

            this.movingLogic(item);
            return;
        }

        // Exit if the item has no count or identifiers
        if (item.count <= 0 || (!item.blockId && item.itemId === null)) return;

        // Pick up the entire item if interacting with a specified array
        if (array) {
            this.holdingItem = structuredClone(item);
            this.removeItem(y, x, item.count, array);
            return;
        }

        // If we're not holding an item, pick up the item in the current slot
        if (!this.holdingItem) {
            this.holdingItem = structuredClone(item);
        }
        // If holding an item of the same type, attempt to combine them
        else if (
            this.holdingItem.blockId === item.blockId &&
            this.holdingItem.itemId === item.itemId
        ) {
            const maxStackSize = this.getStackSize(item);
            const combinedCount = this.holdingItem.count + item.count;

            if (combinedCount <= maxStackSize) {
                this.holdingItem.count = combinedCount;
                this.clearItem(item);
            } else {
                this.holdingItem.count = maxStackSize;
                item.count = combinedCount - maxStackSize;
            }
        }
    }

    getStackSize(item) {
        return item.itemId ? GetItem(item.itemId).stackSize : 64;
    }

    craftingComplete() {
        for (let y = 0; y < this.craftingSlots.length; y++) {
            for (let x = 0; x < this.craftingSlots[y].length; x++) {
                const item = this.craftingSlots[y][x].item;

                if (item.count > 0) {
                    item.count--;
                }

                if (item.count <= 0) this.clearSlot(this.craftingSlots[y][x]);
            }
        }
    }

    removeItem(y, x, count = 1, array = this.items) {
        const item = array[y] && array[y][x].item;
        if (!item) return;

        item.count -= count;
        if (item.count <= 0) this.clearItem(item);
    }

    clearItem(item) {
        item.blockId = null;
        item.itemId = null;
        item.count = 0;
    }

    addItem(newItem) {
        let remainingCount = newItem.count;

        remainingCount = this.addToExistingStack(newItem, remainingCount);

        if (remainingCount > 0) {
            remainingCount = this.addToEmptySlot(newItem, remainingCount);
        }

        return remainingCount;
    }

    getAllItems() {
        let items = [];

        for (let y = 0; y < this.items.length; y++) {
            for (let x = 0; x < this.items[y].length; x++) {
                const item = this.items[y][x].item;

                if (item.count > 0) {
                    items.push(structuredClone(item));
                }
            }
        }

        return items;
    }

    addToExistingStack(newItem, remainingCount) {
        for (let row of this.items) {
            for (let slot of row) {
                const item = slot.item;
                if (
                    item.blockId === newItem.blockId &&
                    item.itemId === newItem.itemId &&
                    item.count < this.getStackSize(item) &&
                    this.arePropsEqual(item.props, newItem.props)
                ) {
                    const availableSpace = this.getStackSize(item) - item.count;
                    const toAdd = Math.min(remainingCount, availableSpace);
                    item.count += toAdd;
                    remainingCount -= toAdd;

                    if (remainingCount === 0) return 0;
                }
            }
        }
        return remainingCount;
    }

    addToEmptySlot(newItem, remainingCount) {
        if (remainingCount === 0) return 0;

        // First, try to place the item in row 3
        if (this.items[3]) {
            for (let slot of this.items[3]) {
                const item = slot.item;
                if (item.blockId === null && item.itemId === null) {
                    item.blockId = newItem.blockId;
                    item.itemId = newItem.itemId;
                    item.count = remainingCount;
                    item.props = newItem.props;
                    return 0;
                }
            }
        }

        // If no slot was found in row 3, proceed to check from row 0 onwards
        for (let rowIndex = 0; rowIndex < this.items.length; rowIndex++) {
            if (rowIndex === 3) continue; // Skip row 3 since we've already checked it
            for (let slot of this.items[rowIndex]) {
                const item = slot.item;
                if (item.blockId === null && item.itemId === null) {
                    item.blockId = newItem.blockId;
                    item.itemId = newItem.itemId;
                    item.count = remainingCount;
                    item.props = newItem.props;
                    return 0;
                }
            }
        }

        // If no empty slot is found, return the remaining count
        return remainingCount;
    }

    update() {
        this.mouseHoverOverSlotsLogic();

        if (!input.isRightMouseDown()) this.resetLastHoveredSlot();

        this.craftingLogic();

        if (this.openUIImage === "converter") {
            this.updateConverter();
        }
    }

    resetLastHoveredSlot() {
        this.lastHoveredSlot = { x: null, y: null };
    }

    mouseHoverOverSlotsLogic() {
        this.hoverItem = null;
        this.hoverSlot = { x: null, y: null, array: null };

        this.mouseOverCheck(this.items);
        this.mouseOverCheck(this.craftingSlots);
        this.mouseOverCheck(this.furnaceSlots);
        this.mouseOverCheck(this.storageSlots);

        if (
            this.isSlotHovered(
                this.craftingOutputSlot.position.x,
                this.craftingOutputSlot.position.y
            )
        ) {
            this.mouseOverSlot(0, 0, null, this.craftingOutputSlot.item);
        }
    }

    mouseOverCheck(array) {
        if (!array) return;
        for (let y = 0; y < array.length; y++) {
            for (let x = 0; x < array[y].length; x++) {
                const item = array[y][x];
                if (this.isSlotHovered(item.position.x, item.position.y)) {
                    this.mouseOverSlot(x, y, array);
                    break;
                }
            }
        }
    }

    craftingLogic() {
        this.clearSlot(this.craftingOutputSlot);

        if (this.areAllCraftingSlotsEmpty()) return;

        // Iterate over each recipe to check if it matches the crafting slots
        for (const recipe of recipes) {
            if (this.isRecipeMatch(recipe)) {
                // Crafting match found, output the result
                this.createOutput(recipe.output);
                return;
            }
        }
    }

    isRecipeMatch(recipe) {
        switch (recipe.type) {
            case RecipeType.Shapeless:
                return this.isShapelessMatch(recipe.input);
            case RecipeType.Shaped:
                return this.isShapedMatch(recipe.input);
            case RecipeType.Filled:
                return this.isFilledMatch(recipe.input);
        }
        return false;
    }

    isFilledMatch(inputItem) {
        if (this.craftingSlots.length < 3) return false;
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                if (!this.isMatch(this.craftingSlots[y][x].item, inputItem)) {
                    return false;
                }
            }
        }

        return true;
    }

    isShapelessMatch(inputItem) {
        const slots = this.craftingSlots.flat();
        const nonEmptySlots = slots.filter((slot) => slot.item.count > 0);

        // If inputItem is an array, handle multiple items in a shapeless recipe
        const recipeItems = Array.isArray(inputItem) ? inputItem : [inputItem];

        // Ensure the number of non-empty slots matches the number of recipe items
        if (nonEmptySlots.length !== recipeItems.length) return false;

        // Check if each recipe item has a matching slot item
        return recipeItems.every((recipeItem) =>
            nonEmptySlots.some((slot) => this.isMatch(slot.item, recipeItem))
        );
    }

    isMatch(slotItem, patternItem) {
        // Retrieve the category of slotItem using GetBlock if it has a blockId
        const slotCategory = slotItem.blockId
            ? GetBlock(slotItem.blockId).category
            : null;

        if (slotItem.count == 0 && patternItem.count == 0) return true;

        return (
            (patternItem.blockId && slotItem.blockId === patternItem.blockId) ||
            (patternItem.itemId !== null &&
                slotItem.itemId === patternItem.itemId) ||
            (patternItem.blockCategory &&
                slotCategory &&
                slotCategory === patternItem.blockCategory)
        );
    }

    isShapedMatch(inputPattern) {
        const rows = this.craftingSlots.length;
        const cols = this.craftingSlots[0].length;

        const patternRows = inputPattern.length;
        const patternCols = inputPattern[0].length;

        for (let startRow = 0; startRow <= rows - patternRows; startRow++) {
            for (let startCol = 0; startCol <= cols - patternCols; startCol++) {
                let isMatch = true;

                // Check if the items in the pattern match the crafting grid from startRow, startCol
                for (let row = 0; row < patternRows; row++) {
                    for (let col = 0; col < patternCols; col++) {
                        const patternItem = inputPattern[row][col];
                        const slot =
                            this.craftingSlots[startRow + row][startCol + col];

                        // If the slot doesn't match the pattern, mark as non-matching
                        if (!this.isMatch(slot.item, patternItem)) {
                            isMatch = false;
                            break;
                        }
                    }
                    if (!isMatch) break;
                }

                // Ensure all other slots outside the pattern area are empty
                if (
                    isMatch &&
                    this.areAllOtherSlotsEmpty(
                        startRow,
                        startCol,
                        patternRows,
                        patternCols
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    areAllOtherSlotsEmpty(startRow, startCol, patternRows, patternCols) {
        for (let row = 0; row < this.craftingSlots.length; row++) {
            for (let col = 0; col < this.craftingSlots[row].length; col++) {
                const isInPatternArea =
                    row >= startRow &&
                    row < startRow + patternRows &&
                    col >= startCol &&
                    col < startCol + patternCols;

                const slot = this.craftingSlots[row][col];

                // Check if any slot outside the pattern area contains an item
                if (
                    !isInPatternArea &&
                    (slot.item.blockId || slot.item.itemId != null)
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    isSlotMatch(slot, patternItem) {
        // If both patternItem and slot item are empty, consider it a match
        if (!patternItem && !slot.item) return true;

        // If pattern expects an empty slot (count 0), ensure the slot is empty
        if (patternItem.count === 0) return slot.item.count === 0;

        // If pattern item has a count but slot item is empty, return false
        if (slot.item.count === 0) return false;

        console.log(patternItem);
        console.log(slot.item);

        // Direct match based on blockId, itemId, or blockCategory
        return (
            (patternItem.blockId &&
                slot.item.blockId === patternItem.blockId) ||
            (patternItem.itemId != null &&
                slot.item.itemId === patternItem.itemId) ||
            (patternItem.blockCategory &&
                slot.item.blockCategory ===
                    GetBlock(patternItem.blockId).category)
        );
    }

    clearSlot(slot) {
        slot.item.blockId = null;
        slot.item.itemId = null;
        slot.item.count = 0;
    }

    createOutput(output) {
        // console.log(`Crafted: ${output.count} of ${output.blockId}`);
        if (this.craftingOutputSlot.item.count > 0) return;

        this.craftingOutputSlot.item.blockId = output.blockId;
        this.craftingOutputSlot.item.itemId = output.itemId;
        this.craftingOutputSlot.item.count = output.count;
    }

    areAllCraftingSlotsEmpty() {
        return this.craftingSlots.flat().every((slot) => slot.isEmpty());
    }

    mouseOverSlot(x, y, array, overWriteItem = null) {
        const item = !overWriteItem ? array[y][x].item : overWriteItem;

        this.hoverItem = item;

        if (overWriteItem) {
            this.handleLeftClickItemInteraction(overWriteItem, 0, 0, null);
            return;
        }

        this.hoverSlot = { x: x, y: y, array: array };

        if (!item.onlyTake) this.handleRightClickSpread(item, x, y, array);

        if (this.handleRightClickGetHalf(item, x, y, array)) return;

        this.handleLeftClickItemInteraction(item, x, y, array);
    }

    getHalf(item, x, y, array) {
        this.holdingItem = structuredClone(item);
        const half = Math.round(item.count / 2);
        this.holdingItem.count = half;
        this.removeItem(y, x, half, array);
    }

    getSlotFromInventory(item) {
        for (let y = 0; y < this.items.length; y++) {
            for (let x = 0; x < this.items[y].length; x++) {
                const slot = this.items[y][x];
                if (
                    (slot.item.blockId && slot.item.blockId === item.blockId) ||
                    (slot.item.itemId !== null &&
                        slot.item.itemId === item.itemId)
                )
                    return slot;
            }
        }
    }

    rightClickMovingLogic(item) {
        if (
            this.holdingItem &&
            this.holdingItem.count > 0 &&
            item.count < this.getStackSize(item) &&
            ((item.blockId === null && item.itemId == null) ||
                (item.blockId === this.holdingItem.blockId &&
                    item.itemId === this.holdingItem.itemId &&
                    this.arePropsEqual(item.props, this.holdingItem.props)))
        ) {
            item.count += 1;
            this.holdingItem.count -= 1;

            if (item.count === 1) {
                item.blockId = this.holdingItem.blockId;
                item.itemId = this.holdingItem.itemId;
                item.props = structuredClone(this.holdingItem.props || {});
            }

            if (this.holdingItem.count === 0) {
                this.holdingItem = null;
            }
        }
    }

    movingLogic(slotItem) {
        if (
            slotItem.count <= 0 ||
            (!slotItem.blockId && slotItem.itemId == null)
        ) {
            // Replace the slot's item with the holding item (cloning props too)
            slotItem.count = this.holdingItem.count;
            slotItem.blockId = this.holdingItem.blockId;
            slotItem.itemId = this.holdingItem.itemId;
            slotItem.props = structuredClone(this.holdingItem.props || {});
            this.holdingItem = null;
            return;
        }

        if (
            slotItem.blockId !== this.holdingItem.blockId ||
            slotItem.itemId !== this.holdingItem.itemId ||
            !this.arePropsEqual(slotItem.props, this.holdingItem.props)
        ) {
            // Swap the items (and their props)
            let oldItem = structuredClone(slotItem);
            slotItem.blockId = this.holdingItem.blockId;
            slotItem.itemId = this.holdingItem.itemId;
            slotItem.count = this.holdingItem.count;
            slotItem.props = structuredClone(this.holdingItem.props || {});
            this.holdingItem = oldItem;
            return;
        }

        if (
            slotItem.blockId === this.holdingItem.blockId &&
            slotItem.itemId === this.holdingItem.itemId &&
            this.arePropsEqual(slotItem.props, this.holdingItem.props)
        ) {
            const maxStackSize = this.getStackSize(slotItem);
            const totalCount = slotItem.count + this.holdingItem.count;

            slotItem.count = Math.min(totalCount, maxStackSize);
            this.holdingItem.count =
                totalCount > maxStackSize ? totalCount - maxStackSize : 0;

            if (this.holdingItem.count === 0) {
                this.holdingItem = null;
            }
        }
    }

    arePropsEqual(a, b) {
        // Treat null/undefined as equal
        if (!a && !b) return true;
        if ((a && !b) || (!a && b)) return false;
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;
        for (let key of aKeys) {
            if (a[key] !== b[key]) return false;
        }
        return true;
    }

    draw(ctx) {
        // Black Background
        ctx.fillStyle = "rgb(0, 0, 0, .6)";
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

        let path = "inventory";
        if (this.craftingTable) path = "crafting_table";
        if (this.furnace) path = "furnace";
        if (this.storageSlots) path = "single_chest";

        if (this.openUIImage !== "") {
            path = this.openUIImage;
        }

        this.inventoryUI = drawImage({
            url: "Assets/sprites/gui/" + path + ".png",
            x: CANVAS.width / 2,
            y: CANVAS.height / 6,
            scale: 3.5,
        });

        this.drawItems();
        this.drawHoldItem();
        this.drawHoverTitle();
    }

    drawItems() {
        this.drawHoverSlot();
        this.drawSlots(this.items);

        this.drawCraftingSlots();
        this.drawSlots(this.furnaceSlots);
        this.drawSlots(this.storageSlots);
        this.drawFurnaceExtras();
    }

    drawHoverSlot() {
        if (!this.hoverSlot.array) return;

        const slot = this.hoverSlot.array[this.hoverSlot.y][this.hoverSlot.x];

        if (!slot) return;
        if (slot.onlyTake) return;

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "white";
        ctx.fillRect(
            slot.position.x + this.inventoryUI.x - 4,
            slot.position.y + this.inventoryUI.y - 4,
            20 * 3,
            20 * 3
        );
        ctx.globalAlpha = 1;
    }

    drawFurnaceExtras() {
        if (!this.furnace) return;
        const furnaceData = this.interactedBlock.metaData.props;
        if (!furnaceData) return;
        if (!furnaceData.isActive) return;

        const fuelMax = furnaceData.burningFuelTime;
        const fuelProgress = furnaceData.fuelProgression;

        if (fuelProgress < 0 || fuelProgress > fuelMax) return;

        // Calculate the frame for the flame
        const flameFrame = Math.ceil(14 - (fuelProgress / fuelMax) * 14);

        drawImage({
            url: "Assets/sprites/gui/furnace_flame.png",
            x: this.inventoryUI.x + 196,
            y: this.inventoryUI.y + 126,
            scale: 3.5,
            centerX: false,
            sizeY: flameFrame,
        });

        const arrowProgression = furnaceData.progression;
        if (arrowProgression < 0 || arrowProgression > 10) return;

        const arrowFrame = Math.ceil((arrowProgression / 10) * 25);

        drawImage({
            url: "Assets/sprites/gui/furnace_arrow.png",
            x: this.inventoryUI.x + 277,
            y: this.inventoryUI.y + 120,
            scale: 3.5,
            centerX: false,
            sizeX: arrowFrame,
        });
    }

    getSlotItem(item) {
        return item.blockId ? GetBlock(item.blockId) : GetItem(item.itemId);
    }

    drawSlots(array) {
        if (!array) return;
        for (let y = 0; y < array.length; y++) {
            for (let x = 0; x < array[y].length; x++) {
                this.drawSlot(array[y][x]);
            }
        }
    }

    drawHoverTitle() {
        if (!player.windowOpen) return;
        if (!this.hoverItem) return;
        if (!this.hoverItem.blockId && this.hoverItem.itemId == null) return;

        const mousePos = input.getMousePosition();

        const hoverInventoryItem = this.hoverItem;

        let title = hoverInventoryItem.blockId
            ? GetBlock(hoverInventoryItem.blockId).name
            : GetItem(hoverInventoryItem.itemId).name;

        let text = title;
        // if (Object.keys(hoverInventoryItem.props).length > 0)
        //     text += ` (${JSON.stringify(hoverInventoryItem.props)})`;
        if (hoverInventoryItem.props.wall) text += " (Wall)";

        drawText({
            text: text,
            x: mousePos.x + 20,
            y: mousePos.y - 5,
            size: 25,
            shadow: true,
            textAlign: "left",
        });
    }

    drawHoldItem() {
        if (!player.windowOpen) return;
        const holdingItem = this.holdingItem;
        if (!holdingItem) return;
        const mousePos = input.getMousePosition();

        let image = null;

        const spritePath =
            "Assets/sprites/" +
            (holdingItem.blockId
                ? "blocks/" + GetBlock(holdingItem.blockId).sprite
                : "items/" + GetItem(holdingItem.itemId).sprite) +
            ".png";

        let cutoff = 0;
        if (holdingItem.blockId)
            cutoff = GetBlock(holdingItem.blockId).defaultCutoff;

        image = drawImage({
            url: spritePath,
            x: mousePos.x,
            y: mousePos.y,
            scale: 2.5,
            centerX: false,
            dark: holdingItem.props.wall === true,
            sizeY: 16 - cutoff * 16,
            fixAnimation: cutoff === 0,
        });

        if (holdingItem.count <= 1) return;

        drawText({
            text: holdingItem.count,
            x: image.x + image.sizeX + 5,
            y: mousePos.y + 45,
        });
    }

    drawCraftingSlots() {
        for (let y = 0; y < this.craftingSlots.length; y++) {
            for (let x = 0; x < this.craftingSlots[y].length; x++) {
                this.drawSlot(this.craftingSlots[y][x]);
            }
        }

        // Draw Output
        const outputSlot = this.craftingOutputSlot;
        this.drawSlot(outputSlot);
    }

    drawSlot(slot) {
        const item = slot.item;

        if (item.count <= 0) return;
        if (!item.blockId && item.itemId === null) return;

        const slotX = this.inventoryUI.x + slot.position.x;
        const slotY = this.inventoryUI.y + slot.position.y;

        const spritePath =
            "Assets/sprites/" +
            (item.blockId
                ? "blocks/" + GetBlock(item.blockId).sprite
                : "items/" + GetItem(item.itemId).sprite) +
            ".png";

        // If block get the default draw cutoff
        let cutoff = 0;
        if (item.blockId) cutoff = GetBlock(item.blockId).defaultCutoff;

        // Draw the sprite
        drawImage({
            url: spritePath,
            x: slotX,
            y: slotY,
            scale: 3,
            centerX: false,
            dark: item.props.wall === true,
            sizeY: 16 - cutoff * 16,
            fixAnimation: cutoff === 0,
        });

        if (item.count <= 1) return;

        // Draw the count
        drawText({ text: item.count, x: slotX + 55, y: slotY + 50, size: 30 });
    }
}

class InventorySlot {
    constructor({
        position = { x: 0, y: 0 },
        item = new InventoryItem(),
        onlyTake = false,
    }) {
        this.position = position;
        this.item = item;
        this.onlyTake = onlyTake;
    }

    isEmpty() {
        return this.item.itemId === null && !this.item.blockId;
    }
}
