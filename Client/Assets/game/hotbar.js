const SHIMMER_SPEED = 30;
const SHIMMER_DISTANCE = 1;
const BAR_ICON_SCALE = 2.85;

class Hotbar {
    constructor(inventory = null) {
        this.inventory = inventory;
        this.currentSlot = 0;

        this.flashingHearts = false;
        this.flashCounter = 0;
        this.previousHealth = 0;

        this.flashingFood = false;
        this.foodFlashCounter = 0;
        this.previousFood = 0;

        this.shimmerTime = 0;
    }

    drawHearts(health, maxHealth, hotbar) {
        if (!world.player.abilities.hasHealth) return;

        this.shimmerTime += deltaTime;

        if (this.flashingHearts) this.flashCounter += deltaTime;

        if (this.flashCounter >= 0.1) {
            this.flashingHearts = false;
            this.flashCounter = 0;
        }

        if (this.previousHealth !== world.player.health) {
            this.previousHealth = world.player.health;
            this.flashingHearts = true;
        }

        const heartSize = 9 * BAR_ICON_SCALE;
        const isLowHealth = health <= 3;
        const heartTop = Math.round(hotbar.y - 32);

        const drawHeartAt = (i, cropX) => {
            const leftX = Math.round(
                hotbar.x + 12 + i * heartSize - heartSize / 2,
            );
            const yOffset = isLowHealth
                ? Math.sign(
                      Math.sin(this.shimmerTime * SHIMMER_SPEED + i * 2.399),
                  ) * SHIMMER_DISTANCE
                : 0;
            drawImage({
                url: getSpriteUrl(`gui/icons`),
                x: leftX + heartSize / 2,
                y: heartTop + yOffset,
                scale: BAR_ICON_SCALE,
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

    drawFood(food, maxFood, hotbar) {
        if (!world.player.abilities.hasHealth) return;

        if (this.flashingFood) this.foodFlashCounter += deltaTime;

        if (this.foodFlashCounter >= 0.1) {
            this.flashingFood = false;
            this.foodFlashCounter = 0;
        }

        if (this.previousFood !== world.player.foodLevel) {
            this.previousFood = world.player.foodLevel;
            this.flashingFood = true;
        }

        const foodSize = 9 * BAR_ICON_SCALE;
        const isLowFood = food <= 3;
        const foodTop = Math.round(hotbar.y - 32);

        const drawFoodAt = (i, cropX) => {
            const leftX = Math.round(
                hotbar.x +
                    hotbar.sizeX -
                    (maxFood * foodSize) / 2 +
                    foodSize / 2 +
                    i * foodSize -
                    foodSize / 2,
            );
            const yOffset = isLowFood
                ? Math.round(
                      Math.sign(
                          Math.sin(
                              this.shimmerTime * SHIMMER_SPEED + i * 2.399 + 1,
                          ),
                      ) * SHIMMER_DISTANCE,
                  )
                : 0;
            drawImage({
                url: getSpriteUrl(`gui/icons`),
                x: leftX + foodSize / 2,
                y: foodTop + yOffset,
                scale: BAR_ICON_SCALE,
                centerX: true,
                crop: { x: cropX, y: 27, width: 9, height: 9 },
            });
        };

        const fullFood = Math.floor(food / 2);
        // Empty food (always render beneath)
        for (let i = 0; i < maxFood / 2; i++) {
            drawFoodAt(i, this.flashingFood ? 25 : 16);
        }
        // Full and half food on top
        for (let i = maxFood / 2 - 1; i >= maxFood / 2 - fullFood; i--) {
            drawFoodAt(i, 52);
        }
        if (food % 2 !== 0) {
            drawFoodAt(maxFood / 2 - fullFood - 1, 61);
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
        this.drawHearts(world.player.health, world.player.maxHealth, hotbar);
        this.drawFood(
            world.player.foodLevel,
            world.player.maxFoodLevel,
            hotbar,
        );
    }

    update() {
        this.handleSelecting();
        this.handleSelected();
    }

    handleSelected() {
        if (this.inventory.items[3][this.currentSlot].item.blockId) {
            this.inventory.selectedBlock = getBlock(
                this.inventory.items[3][this.currentSlot].item.blockId,
            );
        } else {
            this.inventory.selectedBlock = null;
        }
        if (this.inventory.items[3][this.currentSlot].item.itemId != null) {
            this.inventory.selectedItem = getItem(
                this.inventory.items[3][this.currentSlot].item.itemId,
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
        if (chat.inChat) return;
        if (world.player.windowOpen) return;

        if (input.isActionPressed("hotbarUp")) this.currentSlot--;
        if (input.isActionPressed("hotbarDown")) this.currentSlot++;

        this.currentSlot = (this.currentSlot + 9) % 9;

        for (let i = 1; i < 10; i++) {
            if (input.isActionPressed("hotbar" + i)) {
                this.currentSlot = i - 1;
            }
        }
    }
}
