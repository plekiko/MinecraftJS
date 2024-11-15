class Chat {
    constructor() {
        this.inChat = false;
        this.messages = [];
        this.chatLog = [];
        this.tempMessages = [];
        this.currentMessage = "";

        this.cursorBlinkTime = 0;
        this.showCursor = true;

        this.maxLenght = 50;

        this.messageDuration = 8000;

        this.historyIndex = 0;

        this.viewHistory = 10;

        this.loadLog();
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

        this.addToLog(this.currentMessage);

        if (this.currentMessage.startsWith("/", 0)) {
            this.doCheat(
                this.currentMessage.slice(1, this.currentMessage.length)
            );
            message = "";
        }

        this.message(message, "Player");

        this.closeChat();
    }

    addToLog(message) {
        if (this.chatLog[this.chatLog.length - 1] == message) return;
        this.chatLog.push(message);

        this.saveLog();
    }

    saveLog() {
        localStorage.setItem("log", JSON.stringify(this.chatLog));
    }

    loadLog() {
        const loadedLog = JSON.parse(localStorage.getItem("log"));
        if (loadedLog) this.chatLog = loadedLog;
    }

    clearLog() {
        this.chatLog = [];
        this.saveLog();

        this.message("Cleared chat history");
    }

    isValidText(text) {
        if (!/[a-zA-Z0-9]/.test(text)) return false;

        return true;
    }

    doCheat(message) {
        const messageArray = message.split(" ");
        const cheat = messageArray[0];

        switch (cheat) {
            case "give":
                this.give(messageArray);
                break;
            case "clear":
                this.clear();
                break;
            case "clearlog":
                this.clearLog();
                break;
            case "gamemode":
                this.gamemode(messageArray);
                break;
            case "tp":
                this.teleport(messageArray);
                break;
            default:
                this.message("Invalid Command!");
                break;
        }
    }

    teleport(messageArray) {
        if (!player) {
            this.message("No player found.");
            return;
        }

        // Check if x and y coordinates are provided
        if (!messageArray[1] || !messageArray[2]) {
            this.invalidCommand("/tp x(number) y(number)");
            return;
        }

        const x = parseInt(messageArray[1]);
        const y = parseInt(messageArray[2]);

        if (isNaN(x) || isNaN(y)) {
            this.invalidCommand("/tp x(number) y(number)");
            return;
        }

        player.position.x = x * BLOCK_SIZE;
        player.position.y = CHUNK_HEIGHT * BLOCK_SIZE - y * BLOCK_SIZE;

        this.message(`Teleported player to x: ${x} y: ${y}`);
    }

    gamemode(messageArray) {
        if (!messageArray[1]) {
            this.invalidCommand("/gamemode <Gamemode>");
            return;
        }
        if (!player) {
            this.message("No player found.");
            return;
        }

        const gamemode = messageArray[1];

        switch (gamemode) {
            // Survival
            case "0":
                player.abilities.mayFly = false;
                player.abilities.flying = false;
                player.abilities.instaBuild = false;
                player.abilities.mayBuild = true;

                this.message("Set gamemode to Survival.");
                return;

            // Creative
            case "1":
                player.abilities.mayFly = true;
                player.abilities.instaBuild = true;
                player.abilities.mayBuild = true;

                this.message("Set gamemode to Creative.");
                return;

            // Adventure
            case "2":
                player.abilities.mayFly = false;
                player.abilities.flying = false;
                player.abilities.instaBuild = false;
                player.abilities.mayBuild = false;

                this.message("Set gamemode to Adventure.");
                return;
        }

        this.message("Gamemode " + messageArray[1] + " does not exist.");
    }

    invalidCommand(usage) {
        this.message("Invalid command. Usage: " + usage);
    }

    message(message, sender = "Server") {
        if (!this.isValidText(message)) return;

        const messageWithSender = `[${sender}] ${message}`;
        this.messages.push(messageWithSender);

        // Add the new message to tempMessages with a timestamp
        this.tempMessages.push({
            text: messageWithSender,
            timestamp: Date.now(),
        });

        if (this.messages.length > this.viewHistory) {
            this.messages.shift();
        }
    }

    give(messageArray) {
        if (!player) return;

        if (messageArray.length < 2) {
            this.invalidCommand("/give <Category.ItemName>");
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
                `Gave ${count} ${
                    category === "Blocks"
                        ? GetBlock(item).name
                        : GetItem(item).name
                } to the player.`
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
        if (!this.inChat) {
            const maxMessages = Math.min(
                this.viewHistory,
                this.tempMessages.length
            );
            for (let i = 0; i < maxMessages; i++) {
                drawText(
                    this.tempMessages[this.tempMessages.length - 1 - i].text, // Reverse order
                    17,
                    CANVAS.height - 60 - i * 30,
                    30,
                    true,
                    "left"
                );
            }
            return;
        }

        ctx.fillStyle = "rgb(0, 0, 0, .6)";
        ctx.fillRect(10, CANVAS.height - 50, 1000, 40);

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

    updateTempMessages() {
        const now = Date.now();
        this.tempMessages = this.tempMessages.filter(
            (msg) => now - msg.timestamp < this.messageDuration
        );
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
        } else {
            this.updateTempMessages();
        }
    }
}
