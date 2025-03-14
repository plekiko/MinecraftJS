class Hotbar {
    constructor(inventory = null) {
        this.inventory = inventory;
        this.currentSlot = 0;
        this.flashingHearts = false;
        this.flashCounter = 0;
        this.previousHealth = 0;
    }

    drawHearts(health, maxHealth, hotbar) {
        if (!player.abilities.hasHealth) return;

        if (this.flashingHearts) this.flashCounter += deltaTime;

        if (this.flashCounter >= 0.1) {
            this.flashingHearts = false;
            this.flashCounter = 0;
        }

        if (this.previousHealth !== player.health) {
            this.previousHealth = player.health;
            this.flashingHearts = true;
        }

        // Empty Hearts
        for (let i = 0; i < maxHealth / 2; i++) {
            drawImage({
                url: `Assets/sprites/gui/${
                    this.flashingHearts ? "heart_white.png" : "empty_heart.png"
                }`,
                x: hotbar.x + i * 9 * 2.9 + 12,
                y: hotbar.y - 35,
                scale: 3,
            });
        }

        // Draw Full and Half Hearts
        for (let i = 0; i < Math.floor(health / 2); i++) {
            drawImage({
                url: "Assets/sprites/gui/heart.png",
                x: hotbar.x + i * 9 * 2.9 + 12,
                y: hotbar.y - 35,
                scale: 3,
            });
        }

        // Check for Half Heart
        if (health % 2 !== 0) {
            drawImage({
                url: "Assets/sprites/gui/half_heart.png",
                x: hotbar.x + Math.floor(health / 2) * 9 * 2.9 + 12,
                y: hotbar.y - 35,
                scale: 3,
            });
        }
    }

    draw(ctx) {
        // Draw hotbar
        const hotbar = drawImage({
            url: "Assets/sprites/gui/hotbar.png",
            x: CANVAS.width / 2,
            y: CANVAS.height - 75,
            scale: 3,
        });

        // Draw current slot selector
        drawImage({
            url: "Assets/sprites/gui/selected-slot.png",
            x: CANVAS.width / 2 - 240 + this.currentSlot * 60,
            y: CANVAS.height - 78,
            scale: 3,
        });

        this.drawItems();
        this.drawHearts(player.health, player.maxHealth, hotbar);
    }

    update() {
        this.handleSelecting();
        this.handleSelected();
    }

    handleSelected() {
        if (this.inventory.items[3][this.currentSlot].item.blockId) {
            this.inventory.selectedBlock = GetBlock(
                this.inventory.items[3][this.currentSlot].item.blockId
            );
        } else {
            this.inventory.selectedBlock = null;
        }
        if (this.inventory.items[3][this.currentSlot].item.itemId != null) {
            this.inventory.selectedItem = GetItem(
                this.inventory.items[3][this.currentSlot].item.itemId
            );
        } else {
            this.inventory.selectedItem = null;
        }

        this.inventory.currentSlot = this.currentSlot;
    }

    drawItems() {
        for (let i = 0; i < this.inventory.items[3].length; i++) {
            const slot = {
                position: {
                    x: CANVAS.width / 2 - 240 + i * 60, // Exact original X position and 60px gap
                    y: CANVAS.height - 75 + 12, // Adjusted to align items with hotbar slots
                },
                item: this.inventory.items[3][i].item,
            };
            this.drawSlot(slot);
        }
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

        // If block, get the default draw cutoff
        let cutoff = 0;
        if (item.blockId) cutoff = GetBlock(item.blockId).defaultCutoff;

        // Draw the sprite
        drawImage({
            url: spritePath,
            x: slotX,
            y: slotY,
            scale: 2.7,
            centerX: true,
            dark: item.props?.wall === true,
            sizeY: 16 - cutoff * 16,
            fixAnimation: cutoff === 0,
        });

        if (item.count <= 1) return;

        // Draw the count (unchanged, as text position is correct)
        drawText({
            text: item.count,
            x: slotX + 27,
            y: slotY + 58 - 14, // Adjusted to maintain original count position relative to new item Y
            size: 25,
            color: "white",
            shadow: true,
        });
    }

    handleSelecting() {
        if (chat.inChat) return;
        const scrollDelta = input.getScrollDelta();

        if (scrollDelta.deltaY < 0) this.currentSlot--;
        if (scrollDelta.deltaY > 0) this.currentSlot++;

        this.currentSlot = (this.currentSlot + 9) % 9;

        if (input.isKeyPressed("Digit1")) this.currentSlot = 0;
        if (input.isKeyPressed("Digit2")) this.currentSlot = 1;
        if (input.isKeyPressed("Digit3")) this.currentSlot = 2;
        if (input.isKeyPressed("Digit4")) this.currentSlot = 3;
        if (input.isKeyPressed("Digit5")) this.currentSlot = 4;
        if (input.isKeyPressed("Digit6")) this.currentSlot = 5;
        if (input.isKeyPressed("Digit7")) this.currentSlot = 6;
        if (input.isKeyPressed("Digit8")) this.currentSlot = 7;
        if (input.isKeyPressed("Digit9")) this.currentSlot = 8;
    }
}
