class Hotbar {
    constructor(inventory = null) {
        this.inventory = inventory;

        this.currentSlot = 0;
    }

    draw(ctx) {
        // Draw hotbar
        drawImage(
            "Assets/sprites/gui/hotbar.png",
            CANVAS.width / 2,
            CANVAS.height - 75,
            3
        );

        // Draw current slot
        drawImage(
            "Assets/sprites/gui/selected-slot.png",
            CANVAS.width / 2 - 239 + this.currentSlot * 60,
            CANVAS.height - 78,
            3
        );

        this.drawItems();
    }

    update(deltaTime) {
        this.handleSelecting();
        this.handleSelected();
    }

    handleSelected() {
        if (this.inventory.items[3][this.currentSlot].blockId) {
            this.inventory.selectedBlock =
                this.inventory.items[3][this.currentSlot].blockId;
        } else {
            this.inventory.selectedBlock = null;
        }

        this.inventory.currentSlot = this.currentSlot;
    }

    drawItems() {
        for (let i = 0; i < this.inventory.items[3].length; i++) {
            const item = this.inventory.items[3][i];
            if (item.blockId !== null) {
                this.drawBlock(item.blockId, i);
                this.drawCount(item.count, i);
            }
        }
    }

    drawBlock(blockId, slot) {
        const block = GetBlock(blockId);

        this.drawInSlot("blocks/" + block.sprite + ".png", slot);
    }

    drawCount(count, slot) {
        if (count <= 1) return;
        ctx.fillStyle = "rgb(0, 0, 0, .7)";
        ctx.font = "25px Pixel";

        drawText(count, CANVAS.width / 2 - 213 + slot * 60, CANVAS.height - 17);
    }

    drawInSlot(sprite, slot) {
        const path = "Assets/sprites/" + sprite;

        drawImage(
            path,
            CANVAS.width / 2 - 239 + slot * 60,
            CANVAS.height - 60,
            2.3
        );
    }

    handleSelecting() {
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
