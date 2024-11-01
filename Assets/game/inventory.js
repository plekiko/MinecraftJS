class Inventory {
    constructor() {
        this.inventoryUI = { x: 492, y: 150 };

        this.items = [];
        this.craftingSlots = [];

        this.craftingOutputSlot = new InventorySlot({
            position: {
                x: this.inventoryUI.x + 508,
                y: this.inventoryUI.y + 130,
            },
            item: new InventoryItem(),
        });

        this.selectedBlock = null;
        this.selectedItem = null;
        this.currentSlot = 0;

        this.lastHoveredSlot = { x: null, y: null };

        this.hoverItem = null;
        this.hoverSlot = { x: null, y: null, array: null };

        this.holdingItem = null;

        this.createItemArray();
    }

    createItemArray() {
        for (let y = 0; y < 4; y++) {
            this.items[y] = [];
            for (let x = 0; x < 9; x++) {
                const position = {
                    x: this.inventoryUI.x + 32 + x * 63,
                    y: y !== 3 ? this.inventoryUI.y + 298 + y * 63 : 651,
                };

                this.items[y][x] = new InventorySlot({
                    position: position,
                    item: new InventoryItem(/*{ blockId: 34, count: 64 }*/),
                });
            }
        }

        this.createCraftingArray();
    }

    createCraftingArray() {
        for (let y = 0; y < 2; y++) {
            this.craftingSlots[y] = [];
            for (let x = 0; x < 2; x++) {
                const position = {
                    x: this.inventoryUI.x + 312 + x * 63,
                    y: this.inventoryUI.y + 95 + y * 63,
                };

                this.craftingSlots[y][x] = new InventorySlot({
                    position: position,
                    item: new InventoryItem(),
                });
            }
        }
    }

    // Helper method to check if a slot is hovered over
    isSlotHovered(x, y) {
        return this.mouseOverPosition(x, y, 16 * 3, 16 * 3);
    }

    // Logic for right-click item spreading
    handleRightClickSpread(item, x, y) {
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

        return leftOver.length > 0 ? leftOver : null;
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

        // Move item if holdingItem is already set and array is specified
        if (this.holdingItem && array) {
            this.movingLogic(item);
            return;
        }

        // If item is empty or count is 0, no interaction is needed
        if (item.count <= 0 || (!item.blockId && item.itemId === null)) return;

        if (array) {
            // Remove item from the specified array and set it as holdingItem
            this.holdingItem = structuredClone(item);
            this.removeItem(y, x, item.count, array);
            return;
        }

        // Handle interaction when no array is defined
        if (!this.holdingItem) {
            // Pick up the clicked item if holdingItem is empty
            this.holdingItem = structuredClone(item);
        } else if (
            this.holdingItem.blockId === item.blockId ||
            this.holdingItem.itemId === item.itemId
        ) {
            // If holdingItem and clicked item are the same type, combine counts if below limit
            if (this.holdingItem.count + item.count <= 64) {
                this.holdingItem.count += item.count;
            }
        }

        // Check if interacting with crafting output slot to complete crafting
        if (item === this.craftingOutputSlot.item) {
            this.craftingComplete();
        }

        // Clear the clicked item slot
        this.clearItem(item);
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
        return this.addToEmptySlot(newItem, remainingCount);
    }

    addToExistingStack(newItem, remainingCount) {
        for (let row of this.items) {
            for (let slot of row) {
                const item = slot.item;
                if (
                    item.blockId === newItem.blockId &&
                    item.itemId === newItem.itemId &&
                    item.count < 64
                ) {
                    console.log("yo");
                    const availableSpace = 64 - item.count;
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
                    return 0;
                }
            }
        }

        // If no empty slot is found, return the remaining count
        return remainingCount;
    }

    update(deltaTime) {
        this.mouseHoverOverSlotsLogic();

        if (!input.isRightMouseDown()) this.resetLastHoveredSlot();

        this.craftingLogic();
    }

    resetLastHoveredSlot() {
        this.lastHoveredSlot = { x: null, y: null };
    }

    mouseHoverOverSlotsLogic() {
        this.hoverItem = null;
        this.hoverSlot = { x: null, y: null, array: null };

        this.mouseOverCheck(this.items);
        this.mouseOverCheck(this.craftingSlots);

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
        if (recipe.type === RecipeType.Shapeless) {
            return this.isShapelessMatch(recipe.input);
        } else if (recipe.type === RecipeType.Shaped) {
            return this.isShapedMatch(recipe.input);
        }
        return false;
    }

    isShapelessMatch(inputItem) {
        const slots = this.craftingSlots.flat();
        const inputCounts = {};

        // Set up inputCounts for a single item instead of an array
        inputCounts[inputItem.blockId] = inputItem.count;

        // Check each slot and decrease count as items are found
        for (const slot of slots) {
            const item = slot.item;

            // If the slot has an item that doesn't match the input requirement, return false
            if (item.blockId && !inputCounts[item.blockId]) return false;

            if (item.blockId && inputCounts[item.blockId]) {
                inputCounts[item.blockId] -= item.count;
                if (inputCounts[item.blockId] <= 0)
                    delete inputCounts[item.blockId];
            }
        }

        // All required items should be found and their counts met with no extra items
        return Object.keys(inputCounts).length === 0;
    }

    isShapedMatch(inputPattern) {
        const rows = this.craftingSlots.length;
        const cols = this.craftingSlots[0].length;

        // Get dimensions of the input pattern
        const patternRows = inputPattern.length;
        const patternCols = inputPattern[0].length;

        // Loop through the crafting grid, looking for a matching pattern alignment
        for (let startRow = 0; startRow <= rows - patternRows; startRow++) {
            for (let startCol = 0; startCol <= cols - patternCols; startCol++) {
                // Assume this is a potential match until proven otherwise
                let isMatch = true;

                // Check if items in the pattern match the items in the crafting grid starting at startRow, startCol
                for (let row = 0; row < patternRows; row++) {
                    for (let col = 0; col < patternCols; col++) {
                        const patternItem = inputPattern[row][col];
                        const slot =
                            this.craftingSlots[startRow + row][startCol + col];

                        // If the pattern expects an item here, but the slot doesn't match, mark as non-matching
                        if (!this.isSlotMatch(slot, patternItem)) {
                            isMatch = false;
                            break;
                        }
                    }
                    if (!isMatch) break;
                }

                console.log(
                    this.areAllOtherSlotsEmpty(
                        startRow,
                        startCol,
                        patternRows,
                        patternCols
                    )
                );

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
        if (!patternItem && !slot.item) return true; // Empty slot and empty pattern match
        if (!patternItem || !slot.item) return false; // Only one is empty

        return (
            slot.item.blockId === patternItem.blockId &&
            slot.item.count >= patternItem.count
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
        return this.craftingSlots.flat().every((slot) => slot.item.count === 0);
    }

    mouseOverSlot(x, y, array, overWriteItem = null) {
        const item = !overWriteItem ? array[y][x].item : overWriteItem;

        this.hoverItem = item;

        if (overWriteItem) {
            this.handleLeftClickItemInteraction(overWriteItem, 0, 0, null);
            return;
        }

        this.hoverSlot = { x: x, y: y, array: array };

        this.handleRightClickSpread(item, x, y);

        if (this.handleRightClickGetHalf(item, x, y, array)) return;

        this.handleLeftClickItemInteraction(item, x, y, array);
    }

    getHalf(item, x, y, array) {
        this.holdingItem = structuredClone(item);
        const half = Math.round(item.count / 2);
        this.holdingItem.count = half;
        this.removeItem(y, x, half, array);
    }

    rightClickMovingLogic(item) {
        if (
            this.holdingItem &&
            this.holdingItem.count > 0 &&
            item.count < 64 &&
            ((item.blockId === null && item.itemId == null) ||
                (item.blockId === this.holdingItem.blockId &&
                    item.itemId === this.holdingItem.itemId))
        ) {
            item.count += 1;
            this.holdingItem.count -= 1;

            if (item.count === 1) {
                item.blockId = this.holdingItem.blockId;
                item.itemId = this.holdingItem.itemId;
            }

            if (this.holdingItem.count === 0) {
                this.holdingItem = null;
            }
        }
    }

    movingLogic(item) {
        if (item.count <= 0 || (!item.blockId && item.itemId == null)) {
            item.count = this.holdingItem.count;

            if (this.holdingItem.blockId)
                item.blockId = this.holdingItem.blockId;
            else if (this.holdingItem.itemId != null)
                item.itemId = this.holdingItem.itemId;

            this.holdingItem = null;
            return;
        }

        if (
            item.blockId !== this.holdingItem.blockId ||
            item.itemId !== this.holdingItem.itemId
        ) {
            const oldItem = structuredClone(item);
            item.blockId = this.holdingItem.blockId;
            item.itemId = this.holdingItem.itemId;
            item.count = this.holdingItem.count;
            this.holdingItem = oldItem;
            return;
        }

        if (
            item.blockId === this.holdingItem.blockId &&
            item.itemId === this.holdingItem.itemId
        ) {
            const maxStackSize = 64;
            const totalCount = item.count + this.holdingItem.count;

            item.count = Math.min(totalCount, maxStackSize);
            this.holdingItem.count =
                totalCount > maxStackSize ? totalCount - maxStackSize : 0;

            if (this.holdingItem.count === 0) {
                this.holdingItem = null;
            }
        }
    }

    mouseOverPosition(x, y, sizeX, sizeY) {
        const mousePos = input.getMousePosition();
        return (
            mousePos.x >= x &&
            mousePos.x <= x + sizeX &&
            mousePos.y >= y &&
            mousePos.y <= y + sizeY
        );
    }
}

class InventorySlot {
    constructor({ position = { x: 0, y: 0 }, item = new InventoryItem() }) {
        this.position = position;
        this.item = item;
    }
}
