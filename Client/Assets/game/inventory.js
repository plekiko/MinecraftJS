class Inventory {
    constructor() {
        this.inventoryUI = { x: 492, y: 150 };

        this.items = [];
        this.craftingSlots = null;
        this.creativeSlots = null;

        this.currentCreativePage = 0;

        this.storageSlots = null;

        this.creativeItems = [];
        this.creativeMaxPages = 0;
        this.inventoryText = null;

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

        this.openUIOffset = { x: 0, y: 0 };
        this.openUIImage = {
            url: "inventory",
            crop: { x: 0, y: 0, width: 176, height: 166 },
        };
        this.openUIImageOffset = { x: 0, y: 0 };

        this.interactedBlock = null;

        this.lastHoveredSlot = { x: null, y: null };

        this.updateStorage = false;

        this.buttons = [];

        this.hoverItem = null;
        this.hoverSlot = { x: null, y: null, array: null };

        this.holdingItem = null;

        this.storage = null;

        this.wasItemInConverterOutput = false;

        this.createItemArray();

        this.populateCreativeInventory();
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
            this.inventoryUI.x + x + this.openUIOffset.x,
            this.inventoryUI.y + y + this.openUIOffset.y,
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

            // Reverse sync if modifying storageSlots
            if (array === this.storageSlots) {
                this.reverseSync();
            }
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

        this.inventoryText = null;

        this.wasItemInConverterOutput = false;

        this.openUIImageOffset = { x: 0, y: 0 };

        this.openUIOffset = { x: 0, y: 0 };

        this.openUIImage = {
            url: "inventory",
            crop: { x: 0, y: 0, width: 176, height: 166 },
        };

        this.createCraftingArray();

        this.clearButtons();

        this.creativeSlots = null;

        this.storageSlots = null;

        this.storage = null;

        this.updateStorage = false;

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
                    if (slot.onlyTake) continue;

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
                    if (slot.onlyTake) continue;

                    // Place as many as possible in this slot.
                    const stackSize = this.getStackSize(newItem);
                    slot.item = this.cloneItem(newItem);
                    slot.item.count = Math.min(remaining, stackSize);
                    remaining -= slot.item.count;
                    if (remaining === 0) return 0;
                }
            }
        }
        return remaining;
    }

    cloneItem(item) {
        return new InventoryItem({
            blockId: item.blockId,
            itemId: item.itemId,
            count: item.count,
            props: structuredClone(item.props || {}),
        });
    }

    handleShiftClick(slot, array) {
        if (!input.shiftPressed || !array || slot.isEmpty()) return false;

        let targetArray = null;
        if (array === this.items && this.storageSlots) {
            targetArray = this.storageSlots; // Shift-clicking from inventory to hopper/chest
        } else if (array === this.storageSlots && this.items) {
            targetArray = this.items; // Shift-clicking from hopper/chest to inventory
        } else {
            return false;
        }

        if (slot.onlyTake) return false;

        // Check if there are any non-onlyTake slots available in targetArray
        let hasValidTarget = false;
        for (let y = 0; y < targetArray.length; y++) {
            for (let x = 0; x < targetArray[y].length; x++) {
                if (!targetArray[y][x].onlyTake) {
                    hasValidTarget = true;
                    break;
                }
            }
            if (hasValidTarget) break;
        }
        if (!hasValidTarget) return false; // No valid slots to transfer into

        let itemToTransfer = this.cloneItem(slot.item);
        let originalCount = itemToTransfer.count;

        // Add items to the target array (addItemToArray now respects onlyTake)
        let remaining = this.addItemToArray(itemToTransfer, targetArray);
        let moved = originalCount - remaining;

        // Deduct the moved amount from the source slot
        if (moved > 0) {
            slot.item.count -= moved;
            if (slot.item.count <= 0) {
                this.clearSlot(slot);
            }

            // If transferring TO storageSlots (e.g., hopper), sync this.storage with the updated storageSlots
            if (targetArray === this.storageSlots) {
                for (let i = 0; i < this.storageSlots.length; i++) {
                    for (let j = 0; j < this.storageSlots[i].length; j++) {
                        this.storage[i][j] = this.cloneItem(
                            this.storageSlots[i][j].item
                        );
                    }
                }
            }

            // If transferring FROM storageSlots, sync this.storage with the updated storageSlots
            if (array === this.storageSlots) {
                for (let i = 0; i < this.storageSlots.length; i++) {
                    for (let j = 0; j < this.storageSlots[i].length; j++) {
                        this.storage[i][j] = this.cloneItem(
                            this.storageSlots[i][j].item
                        );
                    }
                }
            }
        }

        return moved > 0; // Return true only if items were actually moved
    }

    syncStorageSlots() {
        if (!this.storageSlots || !this.storage) return;

        for (let i = 0; i < this.storageSlots.length; i++) {
            for (let j = 0; j < this.storageSlots[i].length; j++) {
                this.storageSlots[i][j].item = this.cloneItem(
                    this.storage[i][j]
                );
            }
        }
    }

    openConverter(storage) {
        this.storage = storage;

        let slots = [];

        this.openUIImage = {
            url: "converter",
            crop: { x: 0, y: 0, width: 176, height: 166 },
        };

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

    openHopper(storage) {
        this.storage = storage;

        let slots = [[]];

        this.updateStorage = true;

        this.openUIImage = {
            url: "hopper",
            crop: { x: 0, y: 0, width: 176, height: 133 },
        };

        for (let x = 0; x < this.storage[0].length; x++) {
            slots[0].push(
                new InventorySlot({
                    position: { x: 158 + x * 63, y: 189 },
                    item: this.storage[0][x],
                })
            );
        }

        this.openUIOffset.y = -115;

        this.storageSlots = slots;
    }

    updateConverter() {
        // Ensure we're in converter mode
        if (!this.storageSlots) return;

        const leftSlot = this.storageSlots[0][0];
        const rightSlot = this.storageSlots[0][1];

        if (leftSlot.isEmpty()) {
            this.wasItemInConverterOutput = false;
            rightSlot.clear();
            return;
        }

        const leftItem = this.getSlotItem(leftSlot.item);

        if (!leftItem) {
            this.wasItemInConverterOutput = false;
            return;
        }

        // Check if the left slot contains a valid input item
        if (
            leftItem.cannotBeConverted === undefined ||
            leftItem.cannotBeConverted
        ) {
            rightSlot.clear();
            return;
        }

        if (
            this.wasItemInConverterOutput &&
            !this.getSlotItem(rightSlot.item)
        ) {
            this.wasItemInConverterOutput = false;
            leftSlot.clear();
            rightSlot.clear();

            playPositionalSound(player.position, "blocks/anvil_use.ogg");
            return;
        }

        // Set the right slot to the converted item
        rightSlot.item = this.cloneItem(leftSlot.item); // Use leftSlot.item directly since it’s already an InventoryItem

        // Determine if the output becomes a wall (toggle based on input)
        const becomesWall = !(
            leftSlot.item.props && leftSlot.item.props.wall === true
        );

        rightSlot.item.props = { wall: becomesWall };
        rightSlot.item.count = leftSlot.item.count;

        this.wasItemInConverterOutput = true;
    }

    openFurnace(storage) {
        this.furnace = true;
        this.storage = storage;

        this.updateStorage = true;

        this.openUIImage = {
            url: "furnace",
            crop: { x: 0, y: 0, width: 176, height: 166 },
        };

        this.createFurnaceSlots();
    }

    openCreativeInventory() {
        this.openUIImage = {
            url: "generic_54",
            crop: { x: 0, y: 0, width: 176, height: 222 },
        };

        this.openUIImageOffset.y = -80;
        this.openUIOffset.y = 196;

        this.createCreativeSlots();

        this.createCreativeButtons();

        this.inventoryText = new TextElement({
            position: { x: 300, y: -152 },
            text: `Creative - Page ${this.currentCreativePage + 1}/${
                this.creativeMaxPages
            }`,
            size: 27,
        });
    }

    createCreativeButtons() {
        this.addButton({
            position: { x: -50, y: 16 },
            spriteScale: 5,
            size: { x: 50, y: 65 },
            image: "arrow_left",
            hoverImage: "arrow_left_hovered",
            callback: () => this.goLeftInCreativeMenu(),
        });

        this.addButton({
            position: { x: 618, y: 16 },
            spriteScale: 5,
            size: { x: 50, y: 65 },
            image: "arrow_right",
            hoverImage: "arrow_right_hovered",
            callback: () => this.goRightInCreativeMenu(),
        });
    }

    goRightInCreativeMenu() {
        this.currentCreativePage++;

        if (this.currentCreativePage >= this.creativeMaxPages) {
            this.currentCreativePage = this.creativeMaxPages - 1;
        }

        this.inventoryText.text = `Creative - Page ${
            this.currentCreativePage + 1
        }/${this.creativeMaxPages}`;

        this.createCreativeSlots();
    }

    goLeftInCreativeMenu() {
        this.currentCreativePage--;

        if (this.currentCreativePage < 0) {
            this.currentCreativePage = 0;
        }

        this.inventoryText.text = `Creative - Page ${
            this.currentCreativePage + 1
        }/${this.creativeMaxPages}`;

        this.createCreativeSlots();
    }

    createCreativeSlots() {
        const slots = [];
        const itemsPerPage = 9 * 6; // 54 items per page
        const startIndex = this.currentCreativePage * itemsPerPage;
        const endIndex = Math.min(
            startIndex + itemsPerPage,
            this.creativeItems.length
        );

        // Create a 6x9 grid
        for (let y = 0; y < 6; y++) {
            slots[y] = [];
            for (let x = 0; x < 9; x++) {
                const index = startIndex + y * 9 + x;
                const position = { x: 32 + x * 63, y: y * 63 - 129 };

                // Only add a slot if there's an item at this index
                if (index < endIndex && this.creativeItems[index]) {
                    slots[y][x] = new InventorySlot({
                        position: position,
                        item: this.creativeItems[index],
                        infiniteTake: true,
                    });
                } else {
                    // Fill empty slots with a blank slot
                    slots[y][x] = new InventorySlot({
                        position: position,
                        item: new InventoryItem(),
                        infiniteTake: true,
                    });
                }
            }
        }

        this.creativeSlots = slots;
    }

    addButton({
        position,
        size,
        text = "",
        callback,
        image = null,
        hoverImage = null,
        spriteScale = 1,
    }) {
        const button = new Button({
            position,
            size,
            text,
            callback,
            image,
            hoverImage,
            spriteScale,
        });
        this.buttons.push(button);
    }

    clearButtons() {
        this.buttons = [];
    }

    handleButtonInteractions() {
        for (let button of this.buttons) {
            if (
                button.isHovered(this.inventoryUI, this.openUIOffset) &&
                input.isLeftMouseButtonPressed()
            ) {
                button.onClick();
            }
        }
    }

    populateCreativeInventory() {
        // Get all blocks
        const blocks = Object.values(Blocks);

        // Get all items
        const items = Object.values(Items);

        // First we take all blocks and add them to the creative inventory
        for (let i = 0; i < blocks.length; i++) {
            if (GetBlock(blocks[i]).excludeFromCreativeInventory) continue;
            this.creativeItems.push(
                new InventoryItem({ blockId: blocks[i], count: 1 })
            );
        }

        // Then we take all items and add them to the creative inventory
        for (let i = 0; i < items.length; i++) {
            if (GetItem(items[i]).excludeFromCreativeInventory) continue;
            this.creativeItems.push(
                new InventoryItem({ itemId: items[i], count: 1 })
            );
        }

        this.creativeMaxPages = Math.ceil(this.creativeItems.length / (9 * 6));
    }

    openSingleChest(storage) {
        this.storage = storage;

        this.updateStorage = true;

        this.openUIImage = {
            url: "single_chest",
            crop: { x: 0, y: 0, width: 176, height: 166 },
        };

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
            for (let x = 0; x < this.storage[y].length; x++) {
                let position = { x: 0, y: 0 };

                // Input
                if (y === 0 && x === 0) position = { x: 200, y: 64 };
                // Fuel
                if (y === 0 && x === 1) position = { x: 200, y: 190 };
                // Output
                if (y === 1 && x === 0) position = { x: 410, y: 126 };

                let slot = new InventorySlot({
                    position: position,
                    item: this.cloneItem(this.storage[y][x]), // Ensure proper cloning
                });
                slots[y][x] = slot;
            }
        }

        // Set output slot to onlyTake
        slots[1][0].onlyTake = true;

        this.storageSlots = slots;
    }

    refreshInventory() {
        if (this.furnace || this.storageSlots || this.creativeSlots) {
            this.craftingSlots = [];
            return;
        }

        this.craftingOutputSlot.position = this.craftingOutputPosition;
        if (this.craftingTable) {
            this.craftingOutputSlot.position = this.craftingTableOutputPosition;

            this.openUIImage = {
                url: "crafting_table",
                crop: { x: 0, y: 0, width: 176, height: 166 },
            };
        }

        this.createCraftingArray(this.craftingTable ? 3 : 2);
    }

    reverseSync() {
        if (!this.storageSlots || !this.storage) return;

        for (let i = 0; i < this.storageSlots.length; i++) {
            for (let j = 0; j < this.storageSlots[i].length; j++) {
                this.storage[i][j] = this.cloneItem(
                    this.storageSlots[i][j].item
                );
            }
        }
    }

    handleRightClickGetHalf(item, x, y, array) {
        if (
            input.isRightMouseDown() &&
            !this.holdingItem &&
            (item.blockId || item.itemId != null)
        ) {
            this.getHalf(item, x, y, array);

            // Reverse sync if modifying storageSlots
            if (array === this.storageSlots) {
                this.reverseSync();
            }
            return true;
        }
        return false;
    }

    // Logic for picking up or moving items
    handleLeftClickItemInteraction(item, x, y, array) {
        if (!input.isLeftMouseButtonPressed()) return;

        if (input.shiftPressed) {
            if (array) if (this.handleShiftClick(array[y][x], array)) return;
        }

        // Handle crafting output slot
        if (item === this.craftingOutputSlot.item) {
            const maxStackSize = this.getStackSize(item);
            const isSameType =
                this.holdingItem &&
                this.holdingItem.blockId === item.blockId &&
                this.holdingItem.itemId === item.itemId &&
                this.arePropsEqual(this.holdingItem.props, item.props);

            const combinedCount = isSameType
                ? this.holdingItem.count + this.craftingOutputSlot.item.count
                : this.craftingOutputSlot.item.count;

            if (item.itemId === null && item.blockId === null) return;

            if (
                this.holdingItem &&
                isSameType &&
                combinedCount <= maxStackSize
            ) {
                this.holdingItem.count = combinedCount;
                this.clearItem(item);
                this.craftingComplete();
            } else if (!this.holdingItem) {
                this.holdingItem = this.cloneItem(item);
                console.log(this.holdingItem);
                this.clearItem(item);
                this.craftingComplete();
            }
            return;
        }

        // Handle placing an item from cursor into a slot
        if (this.holdingItem && array) {
            const slot = array[y][x];
            if (slot.onlyTake || slot.infiniteTake) {
                // Add infiniteTake check
                // Delete the item
                this.holdingItem = null;
                return; // Do not allow placing items in onlyTake or infiniteTake slots
            }

            this.movingLogic(item);
            this.reverseSync();
            return;
        }

        // Handle picking up an item from a slot
        if (item.count <= 0 || (!item.blockId && item.itemId === null)) return;

        if (array) {
            const slot = array[y][x];
            if (slot.infiniteTake) {
                // Infinite take: copy item without removing from slot
                this.holdingItem = this.cloneItem(item);
            } else {
                // Normal take: remove item from slot
                this.holdingItem = this.cloneItem(item);
                this.removeItem(y, x, item.count, array);
            }
            this.reverseSync();
            return;
        }

        // Handle combining items when cursor already holds an item (not array-based)
        if (!this.holdingItem) {
            this.holdingItem = this.cloneItem(item);
        } else if (
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
        item.props = {};
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
                    items.push(this.cloneItem(item));
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

        if (this.openUIImage.url === "converter") {
            this.updateConverter();
        }

        if (this.updateStorage) this.syncStorageSlots();

        this.handleHotbarAssignment();
        this.handleButtonInteractions();
    }

    handleHotbarAssignment() {
        // Only proceed if an item is hovered and the inventory UI is open
        if (!this.hoverItem || !player.windowOpen) return;

        // Map number keys "Digit1" to "Digit9" to hotbar slots 0-8
        for (let i = 1; i <= 9; i++) {
            if (input.isKeyPressed(`Digit${i}`)) {
                const hotbarIndex = i - 1; // Convert to 0-based index (Digit1 -> slot 0, Digit2 -> slot 1, etc.)
                this.assignToHotbarSlot(hotbarIndex);
                break; // Exit loop after handling the first key press
            }
        }
    }

    assignToHotbarSlot(slotIndex) {
        const hotbarSlot = this.items[3][slotIndex]; // Hotbar is row 3
        const hoveredSlot = this.hoverSlot.array
            ? this.hoverSlot.array[this.hoverSlot.y][this.hoverSlot.x]
            : null;

        if (!this.hoverItem) return; // No hovered item, exit early

        // If the hovered item is already in the hotbar slot, do nothing
        if (
            hoveredSlot &&
            hoveredSlot === hotbarSlot &&
            this.hoverSlot.array === this.items
        ) {
            return;
        }

        // Clone the items to avoid reference issues
        const hoveredItem = this.cloneItem(this.hoverItem);
        const hotbarItem = this.cloneItem(hotbarSlot.item);

        // If the hovered item is from the crafting output slot
        if (
            !this.hoverSlot.array &&
            this.hoverItem === this.craftingOutputSlot.item
        ) {
            if (hotbarSlot.isEmpty() && !hoveredItem.isEmpty()) {
                // Place the crafting output directly into the hotbar slot
                hotbarSlot.item = this.cloneItem(hoveredItem);
                this.clearSlot(this.craftingOutputSlot);
                this.craftingComplete();
            }
            return;
        }

        // Handle swapping or placing from another slot (inventory, crafting, storage, etc.)
        if (hoveredSlot) {
            if (hoveredSlot.onlyTake) return; // Don't allow taking from onlyTake slots
            if (hoveredSlot.infiniteTake) {
                // Infinite take: copy item without removing from slot
                hotbarSlot.item = this.cloneItem(hoveredItem);
                return;
            }

            if (hotbarSlot.isEmpty()) {
                // Move hovered item to empty hotbar slot
                hotbarSlot.item = this.cloneItem(hoveredItem);
                hoveredSlot.clear();
            } else {
                // Swap items between hovered slot and hotbar slot
                hotbarSlot.item = this.cloneItem(hoveredItem);
                hoveredSlot.item = this.cloneItem(hotbarItem);
            }

            // Sync storage if modifying storageSlots
            if (
                this.hoverSlot.array === this.storageSlots ||
                this.storageSlots
            ) {
                this.reverseSync();
            }
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
        this.mouseOverCheck(this.creativeSlots);
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
        slot.item.props = {};
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

        const slot = array[y][x];
        if (!slot.onlyTake && !slot.infiniteTake) {
            // Add infiniteTake check
            this.handleRightClickSpread(item, x, y, array);
        }

        if (!slot.onlyTake)
            if (this.handleRightClickGetHalf(item, x, y, array)) return;

        this.handleLeftClickItemInteraction(item, x, y, array);
    }

    getHalf(item, x, y, array) {
        const slot = array[y][x];
        this.holdingItem = this.cloneItem(item);
        if (slot.infiniteTake) {
            // Infinite take: set holdingItem to half count without modifying slot
            // Get Max stack size
            const maxStackSize = this.getStackSize(item);

            this.holdingItem.count = maxStackSize;
        } else {
            // Normal take: reduce slot count by half
            const half = Math.round(item.count / 2);
            this.holdingItem.count = half;
            this.removeItem(y, x, half, array);
        }
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
            let oldItem = this.cloneItem(slotItem);
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
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

        let path = "inventory";
        let crop = null;

        if (this.openUIImage.url !== "") {
            path = this.openUIImage.url;
            if (this.openUIImage.crop) {
                crop = this.openUIImage.crop;
            }
        }

        const spritePath = "gui/container/" + path;

        const spriteUrl = getSpriteUrl(
            spritePath,
            isEqualToOriginal(spritePath)
        );

        const drawParams = {
            url: spriteUrl,
            x: CANVAS.width / 2 + this.openUIImageOffset.x,
            y: CANVAS.height / 6 + this.openUIImageOffset.y,
            scale: 3.5,
        };

        if (crop) {
            drawParams.crop = crop;
        }

        this.inventoryUI = drawImage(drawParams);

        this.drawItems();
        this.drawHoldItem();
        this.drawButtons(ctx);
        this.drawHoverTitle();

        if (this.inventoryText) {
            this.inventoryText.draw(this.inventoryUI, this.openUIOffset);
        }
    }

    drawButtons(ctx) {
        for (let button of this.buttons) {
            button.draw(ctx, this.inventoryUI, this.openUIOffset);
        }
    }

    drawItems() {
        this.drawHoverSlot();
        this.drawSlots(this.items);

        this.drawCraftingSlots();
        this.drawSlots(this.creativeSlots);
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
            slot.position.x + this.inventoryUI.x - 4 + this.openUIOffset.x,
            slot.position.y + this.inventoryUI.y - 4 + this.openUIOffset.y,
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

        // Flame
        drawImage({
            url: getSpriteUrl("gui/container/furnace"),
            x: this.inventoryUI.x + 196,
            y: this.inventoryUI.y + 126 + (14 - flameFrame) * 3.5, // Offset y downward
            scale: 3.5,
            centerX: false,
            crop: { x: 176, y: 14 - flameFrame, width: 14, height: flameFrame },
        });

        const arrowProgression = furnaceData.progression;
        if (arrowProgression < 0 || arrowProgression > 10) return;

        const arrowFrame = Math.ceil((arrowProgression / 10) * 25);

        // Arrow
        drawImage({
            url: getSpriteUrl("gui/container/furnace"),
            x: this.inventoryUI.x + 277,
            y: this.inventoryUI.y + 120,
            scale: 3.5,
            centerX: false,
            sizeX: arrowFrame,
            crop: { x: 176, y: 14, width: 24, height: 17 },
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

        const isItem = holdingItem.itemId !== null;

        const path = isItem
            ? "items/" + GetItem(holdingItem.itemId).sprite
            : "blocks/" + GetBlock(holdingItem.blockId).iconSprite;

        const spritePath = getSpriteUrl(path);
        const spriteSize = getSpriteSize(path);
        const actualWidth = spriteSize.width || 16;
        const actualHeight = spriteSize.width || 16;

        let cutoff = 0;
        if (holdingItem.blockId) {
            cutoff = GetBlock(holdingItem.blockId).defaultCutoff || 0;
        }

        const drawHeight = actualHeight - cutoff * actualHeight; // Height after cutoff
        const targetHeight = 40; // Desired height in pixels
        const scale = targetHeight / actualHeight; // Scale based on full height, not cropped

        const cropY = cutoff * actualHeight; // Crop from the top by the cutoff amount

        const image = drawImage({
            url: spritePath,
            x: mousePos.x,
            y: mousePos.y,
            scale: scale,
            centerX: false,
            dark: holdingItem.props.wall === true,
            fixAnimation: cutoff === 0,
            crop: {
                x: 0,
                y: cropY, // Start cropping from the top by the cutoff value
                width: actualWidth,
                height: drawHeight, // Draw only the remaining height
            },
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
        slot.draw(
            this.inventoryUI.x + this.openUIOffset.x,
            this.inventoryUI.y + this.openUIOffset.y
        );
    }
}

class Button {
    constructor({
        position = { x: 0, y: 0 },
        size = { x: 50, y: 20 },
        text = "",
        callback = () => {},
        image = null, // Default image
        hoverImage = null, // Hover image
        spriteScale = 1,
    }) {
        this.position = position;
        this.size = size;
        this.text = text;
        this.callback = callback;
        this.image = image;
        this.hoverImage = hoverImage;
        this.spriteScale = spriteScale;
    }

    isHovered(inventoryUI, openUIOffset) {
        const x = inventoryUI.x + this.position.x + openUIOffset.x;
        const y = inventoryUI.y + this.position.y + openUIOffset.y;
        return mouseOverPosition(x, y, this.size.x, this.size.y);
    }

    onClick() {
        playSound("ui/click.ogg");

        this.callback();
    }

    draw(ctx, inventoryUI, openUIOffset) {
        const x = inventoryUI.x + this.position.x + openUIOffset.x;
        const y = inventoryUI.y + this.position.y + openUIOffset.y;
        const isHovered = this.isHovered(inventoryUI, openUIOffset);

        if (this.image) {
            // Draw image-based button
            const imageToDraw =
                isHovered && this.hoverImage ? this.hoverImage : this.image;

            drawImage({
                url: getSpriteUrl("gui/" + imageToDraw),
                x: x,
                y: y,
                width: this.size.x,
                height: this.size.y,
                centerX: false,
                centerY: false,
                scale: this.spriteScale,
            });

            // Draw hitbox
            // ctx.fillStyle = "rgba(255, 0, 0, .5)";
            // ctx.fillRect(x, y, this.size.x, this.size.y);
        } else {
            // Draw text-based button with background
            ctx.fillStyle = isHovered ? "lightgray" : "gray";
            ctx.fillRect(x, y, this.size.width, this.size.height);

            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, this.size.width, this.size.height);

            if (this.text) {
                drawText({
                    text: this.text,
                    x: x + this.size.width / 2,
                    y: y + this.size.height / 2,
                    size: 20,
                    color: "black",
                    textAlign: "center",
                });
            }
        }
    }
}

class TextElement {
    constructor({
        text = "",
        position = { x: 0, y: 0 },
        size = 20,
        textAlign = "center",
    }) {
        this.text = text;
        this.position = position;
        this.size = size;
        this.textAlign = textAlign;
    }

    draw(inventoryUI, openUIOffset) {
        const x = inventoryUI.x + this.position.x + openUIOffset.x;
        const y = inventoryUI.y + this.position.y + openUIOffset.y;

        drawText({
            text: this.text,
            x: x,
            y: y,
            size: this.size,
            textAlign: this.textAlign,
        });
    }
}
