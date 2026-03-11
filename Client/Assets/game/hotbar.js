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

        const heartSize = 9 * 3; // 3x original res
        const heartTop = Math.round(hotbar.y - 32);

        const drawHeartAt = (i, cropX) => {
            const leftX = Math.round(hotbar.x + 12 + i * heartSize - heartSize / 2);
            drawImage({
                url: getSpriteUrl(`gui/icons`),
                x: leftX + heartSize / 2,
                y: heartTop,
                scale: 3,
                centerX: true,
                crop: { x: cropX, y: 0, width: 9, height: 9 },
            });
        };

        const fullHearts = Math.floor(health / 2);
        // Empty hearts (always render beneath)
        for (let i = 0; i < maxHealth / 2; i++) {
            drawHeartAt(i, this.flashingHearts ? 25 : 16);
        }
        // Full and half hearts on top
        for (let i = 0; i < fullHearts; i++) {
            drawHeartAt(i, 52);
        }
        if (health % 2 !== 0) {
            drawHeartAt(fullHearts, 61);
        }
    }

    draw(ctx) {
        // Draw hotbar
        const hotbar = drawImage({
            url: getSpriteUrl("gui/widgets", isEqualToOriginal("gui/widgets")),
            x: CANVAS.width / 2,
            y: CANVAS.height - 75,
            scale: 3,
            crop: { x: 0, y: 0, width: 182, height: 22 },
        });

        // Draw current slot selector
        drawImage({
            url: getSpriteUrl("gui/widgets", isEqualToOriginal("gui/widgets")),
            x: CANVAS.width / 2 - 240 + this.currentSlot * 60,
            y: CANVAS.height - 78,
            scale: 3,
            crop: { x: 0, y: 22, width: 24, height: 24 },
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
            const position = {
                x: CANVAS.width / 2 - 262 + i * 60, // Exact original X position and 60px gap
                y: CANVAS.height - 76 + 12, // Adjusted to align items with hotbar slots
            };
            this.drawSlot(this.inventory.items[3][i], position);
        }
    }

    drawSlot(slot, position) {
        slot.draw(0, 0, position, 0.9);
    }

    handleSelecting() {
        const scrollDelta = input.getScrollDelta();

        if (chat.inChat) return;
        if (player.windowOpen) return;

        if (scrollDelta.deltaY < 0) this.currentSlot--;
        if (scrollDelta.deltaY > 0) this.currentSlot++;

        this.currentSlot = (this.currentSlot + 9) % 9;

        for (let i = 1; i < 10; i++) {
            if (input.isKeyPressed(`Digit${i}`)) {
                this.currentSlot = i - 1;
            }
        }
    }
}
