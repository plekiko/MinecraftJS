class Inventory {
    constructor() {
        this.inventoryUI = { x: 492, y: 150 };

        this.items = [];
        this.craftingSlots = [];

        this.craftingOutputPosition = {
            x: this.inventoryUI.x + 508,
            y: this.inventoryUI.y + 130,
        };
        this.craftingOutputSlot = new InventorySlot({
            position: {
                ...this.craftingOutputPosition,
            },
            item: new InventoryItem(),
        });

        this.craftingPosition = {
            x: this.inventoryUI.x + 312,
            y: this.inventoryUI.y + 95,
        };

        this.selectedBlock = null;
        this.selectedItem = null;
        this.currentSlot = 0;

        this.craftingTable = false;
        this.craftingTableOutputPosition = {
            x: this.inventoryUI.x + 437,
            y: this.inventoryUI.y + 127,
        };
        this.craftingTablePosition = {
            x: this.inventoryUI.x + 109,
            y: this.inventoryUI.y + 64,
        };

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

    isSlotHovered(x, y) {
        return mouseOverPosition(x, y, 16 * 3, 16 * 3);
    }

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

    refreshInventory() {
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

        // Specific handling for the crafting output slot
        if (item === this.craftingOutputSlot.item) {
            const maxStackSize = this.getStackSize(item);
            const isSameType =
                this.holdingItem &&
                this.holdingItem.blockId === item.blockId &&
                this.holdingItem.itemId === item.itemId;

            // Calculate combined count only if holding the same item type
            const combinedCount = isSameType
                ? this.holdingItem.count + this.craftingOutputSlot.item.count
                : this.craftingOutputSlot.item.count;

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

    addToExistingStack(newItem, remainingCount) {
        for (let row of this.items) {
            for (let slot of row) {
                const item = slot.item;
                if (
                    item.blockId === newItem.blockId &&
                    item.itemId === newItem.itemId &&
                    item.count < this.getStackSize(item)
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

        // Direct match on blockId, itemId, or blockCategory
        return (
            (patternItem.blockId && slotItem.blockId === patternItem.blockId) ||
            (patternItem.itemId != null &&
                slotItem.itemId === patternItem.itemId) ||
            (patternItem.blockCategory &&
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
            item.count < this.getStackSize(item) &&
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
            const maxStackSize = this.getStackSize(item);
            const totalCount = item.count + this.holdingItem.count;

            item.count = Math.min(totalCount, maxStackSize);
            this.holdingItem.count =
                totalCount > maxStackSize ? totalCount - maxStackSize : 0;

            if (this.holdingItem.count === 0) {
                this.holdingItem = null;
            }
        }
    }

    draw(ctx) {
        // Black Background
        ctx.fillStyle = "rgb(0, 0, 0, .6)";
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

        const path = this.craftingTable ? "crafting_table" : "inventory";

        const inventoryUI = drawImage(
            "Assets/sprites/gui/" + path + ".png",
            CANVAS.width / 2,
            CANVAS.height / 6,
            3.5
        );

        this.drawItems(inventoryUI);
        this.drawItems();
        this.drawHoldItem();
        this.drawHoverTitle();
    }

    drawItems(inventoryUI) {
        for (let y = 0; y < this.items.length; y++) {
            for (let x = 0; x < this.items[y].length; x++) {
                this.drawSlot(this.items[y][x]);
            }
        }

        this.drawCraftingSlots(inventoryUI);
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

        drawText(title, mousePos.x + 20, mousePos.y - 5, 25, true, "left");
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

        image = drawImage(spritePath, mousePos.x, mousePos.y, 2.5, false);

        if (holdingItem.count <= 1) return;

        drawText(
            holdingItem.count,
            image.x + image.sizeX + 5,
            image.y + image.sizeY + 3
        );
    }

    drawCraftingSlots(inventoryUI) {
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

        const slotX = slot.position.x;
        const slotY = slot.position.y;

        const spritePath =
            "Assets/sprites/" +
            (item.blockId
                ? "blocks/" + GetBlock(item.blockId).sprite
                : "items/" + GetItem(item.itemId).sprite) +
            ".png";

        // Draw the sprite
        drawImage(spritePath, slotX, slotY, 3, false);

        if (item.count <= 1) return;

        // Draw the count
        drawText(item.count, slotX + 55, slotY + 50, 30);
    }
}

class InventorySlot {
    constructor({ position = { x: 0, y: 0 }, item = new InventoryItem() }) {
        this.position = position;
        this.item = item;
    }

    isEmpty() {
        return this.item.itemId != null && !this.item.blockId;
    }
}
