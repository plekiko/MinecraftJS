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
            drawImage(
                `Assets/sprites/gui/${
                    this.flashingHearts ? "heart_white.png" : "empty_heart.png"
                }`,
                hotbar.x + i * 9 * 2.9 + 12,
                hotbar.y - 35,
                3
            );
        }

        // Draw Full and Half Hearts
        for (let i = 0; i < Math.floor(health / 2); i++) {
            drawImage(
                "Assets/sprites/gui/heart.png",
                hotbar.x + i * 9 * 2.9 + 12,
                hotbar.y - 35,
                3
            );
        }

        // Check for Half Heart
        if (health % 2 !== 0) {
            drawImage(
                "Assets/sprites/gui/half_heart.png", // Use the half-heart sprite
                hotbar.x + Math.floor(health / 2) * 9 * 2.9 + 12,
                hotbar.y - 35,
                3
            );
        }
    }

    draw(ctx) {
        // Draw hotbar
        const hotbar = drawImage(
            "Assets/sprites/gui/hotbar.png",
            CANVAS.width / 2,
            CANVAS.height - 75,
            3
        );

        // Draw current slot
        drawImage(
            "Assets/sprites/gui/selected-slot.png",
            CANVAS.width / 2 - 240 + this.currentSlot * 60,
            CANVAS.height - 78,
            3
        );

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
            const item = this.inventory.items[3][i].item;
            if (item.blockId !== null) {
                this.drawBlock(item.blockId, i);
                this.drawCount(item.count, i);
            } else {
                if (item.itemId != null) {
                    this.drawItem(item.itemId, i);
                    this.drawCount(item.count, i);
                }
            }
        }
    }

    drawBlock(blockId, slot) {
        const block = GetBlock(blockId);

        this.drawInSlot("blocks/" + block.sprite + ".png", slot);
    }

    drawItem(itemId, slot) {
        const item = GetItem(itemId);

        this.drawInSlot("items/" + item.sprite + ".png", slot);
    }

    drawCount(count, slot) {
        if (count <= 1) return;
        ctx.fillStyle = "rgb(0, 0, 0, .7)";
        ctx.font = "25px Pixel";

        drawText({
            text: count,
            x: CANVAS.width / 2 - 213 + slot * 60,
            y: CANVAS.height - 17,
        });
    }

    drawInSlot(sprite, slot) {
        const path = "Assets/sprites/" + sprite;

        drawImage(
            path,
            CANVAS.width / 2 - 240 + slot * 60,
            CANVAS.height - 63,
            2.8
        );
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
