class Chat {
    constructor() {
        this.inChat = false;
        this.messages = [];
        this.chatLog = [];
        this.currentMessage = "";

        this.cursorBlinkTime = 0;
        this.showCursor = true;

        this.maxLenght = 50;

        this.historyIndex = 0;

        this.viewHistory = 10;
    }

    openChat() {
        this.historyIndex = 0;
        this.inChat = true;
        if (player) player.canMove = false;
    }

    closeChat() {
        this.inChat = false;
        if (player) player.canMove = true;

        this.currentMessage = "";
    }

    send() {
        let message = this.currentMessage;

        if (!this.isValidText(message)) {
            this.closeChat();
            return;
        }

        this.chatLog.push(this.currentMessage);

        if (this.currentMessage.startsWith("/", 0)) {
            this.doCheat(
                this.currentMessage.slice(1, this.currentMessage.length)
            );
            message = "";
        }

        this.message(message);

        this.closeChat();
    }

    isValidText(text) {
        if (!/[a-zA-Z0-9]/.test(text)) return false;

        return true;
    }

    doCheat(message) {
        const messageArray = message.split(" ");

        if (messageArray[0] == "give") this.give(messageArray);
        if (messageArray[0] == "clear") this.clear();
    }

    message(message) {
        if (!this.isValidText(message)) return;

        this.messages.push(message);
    }

    give(messageArray) {
        if (!player) return;

        if (messageArray.length < 2) {
            console.log("Invalid command. Usage: /give <Category.ItemName>");
            return;
        }

        const itemPath = messageArray[1].split(".");
        const category = itemPath[0];
        const itemName = itemPath[1];
        const count = messageArray[2] ? parseInt(messageArray[2]) : 1;

        const collections = {
            Blocks,
            Items,
        };

        if (collections[category] && collections[category][itemName] != null) {
            const item = collections[category][itemName];

            const inventoryItem =
                category === "Blocks"
                    ? new InventoryItem({
                          blockId: item,
                          count: count,
                      })
                    : new InventoryItem({
                          itemId: item,
                          count: count,
                      });

            if (inventoryItem.blockId === Blocks.Air) return;

            player.inventory.addItem(inventoryItem);

            this.message(
                `Gave ${count} ${category}.${itemName} to the player.`
            );
        } else {
            this.message(`Item ${messageArray[1]} not found.`);
        }
    }

    clear() {
        this.message("Cleared Inventory");
        player.inventory.createItemArray();
    }

    draw(ctx) {
        if (!this.inChat) return;

        ctx.fillStyle = "rgb(0, 0, 0, .6)";
        ctx.fillRect(10, CANVAS.height - 50, 1000, 40);

        // Append "_" to currentMessage if showCursor is true
        const messageToDisplay =
            this.currentMessage + (this.showCursor ? "_" : "");

        drawText(messageToDisplay, 17, CANVAS.height - 20, 30, false, "left");

        for (let i = 0; i < this.viewHistory; i++) {
            const messageIndex = this.messages.length - 1 - i;

            if (!this.messages[messageIndex]) continue;

            drawText(
                this.messages[messageIndex],
                17,
                CANVAS.height - 60 - i * 30,
                30,
                true,
                "left"
            );
        }
    }

    historyCycle() {
        if (input.isKeyPressed("ArrowUp")) {
            if (this.chatLog.length > 0) {
                // Move to the previous message in the history
                if (this.historyIndex < this.chatLog.length) {
                    if (this.historyIndex == -1) this.historyIndex = 0;
                    this.historyIndex++;
                    this.currentMessage =
                        this.chatLog[this.chatLog.length - this.historyIndex];
                }
            }
        }

        if (input.isKeyPressed("ArrowDown")) {
            // Move to the next message in the history or reset to an empty message
            if (this.historyIndex > 1) {
                this.historyIndex--;
                this.currentMessage =
                    this.chatLog[this.chatLog.length - this.historyIndex];
            } else if (this.historyIndex === 1) {
                this.historyIndex = -1; // Reset to current input
                this.currentMessage = ""; // Clear the message if no history is selected
            }
        }
    }

    updateTyping() {
        const isShiftPressed =
            input.isKeyDown("ShiftLeft") || input.isKeyDown("ShiftRight");

        this.historyCycle();

        trackedKeys.forEach((key) => {
            if (input.isKeyPressed(key)) {
                if (key === "Backspace") {
                    this.currentMessage = this.currentMessage.slice(0, -1);
                    return;
                }
                if (this.currentMessage.length >= this.maxLenght) return;

                switch (key) {
                    case key.startsWith("Key") && key:
                        const letter = key.replace("Key", "");
                        this.currentMessage += isShiftPressed
                            ? letter.toUpperCase()
                            : letter.toLowerCase();
                        break;
                    case key.startsWith("Digit") && key:
                        this.currentMessage += key.replace("Digit", "");
                        break;
                    case "Space":
                        this.currentMessage += " ";
                        break;
                    case "Backslash":
                        this.currentMessage += "/";
                        break;
                    case "Period":
                        this.currentMessage += ".";
                        break;

                    default:
                        break;
                }
            }
        });
    }

    update(deltaTime) {
        if (!this.inChat && input.isKeyPressed("KeyT")) {
            this.openChat();
        }
        if (input.isKeyPressed("Enter")) {
            if (this.inChat) {
                this.send();
            }
        }

        if (this.inChat) {
            if (input.isKeyPressed("Escape")) this.closeChat();

            this.updateTyping();

            this.cursorBlinkTime += deltaTime;

            if (this.cursorBlinkTime >= 0.5) {
                this.showCursor = !this.showCursor;
                this.cursorBlinkTime = 0;
            }
        }
    }
}
