class Chat {
    constructor() {
        this.inChat = false;

        this.messages = [];
        this.chatLog = [];
        this.tempMessages = [];

        this.currentMessage = "";
        this.cursorPosition = 0;

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
            case "summon":
                this.summon(messageArray);
                break;
            case "kill":
                if (!player) break;
                player.dieEvent();
                break;
            case "time":
                this.setTime(messageArray);
                break;
            default:
                this.message("Invalid Command!");
                break;
        }
    }

    setTime(messageArray) {
        if (!messageArray[1]) {
            this.invalidCommand("/time <time (1 - 7.5)>");
            return;
        }

        const newTime = parseFloat(messageArray[1]);

        if (isNaN(newTime)) {
            this.invalidCommand("/time <time (1 - 7.5)>");
            return;
        }

        time = newTime;
    }

    summon(messageArray) {
        if (!messageArray[1] || !messageArray[2] || !messageArray[3]) {
            this.invalidCommand("/summon <Entity> <x> <y>");
            return;
        }

        const entityPath = messageArray[1].split(".");
        const category = entityPath[0];
        const itemName = entityPath[1];

        const collections = {
            Entities,
        };

        const x = messageArray[2] !== "~" ? parseInt(messageArray[2]) : "~";
        const y = messageArray[3] !== "~" ? parseInt(messageArray[3]) : "~";

        const position = this.getWorldPosition(new Vector2(x, y));

        if (!position) {
            this.invalidCommand("/summon <Entity> <x> <y>");
            return;
        }

        if (collections[category] && collections[category][itemName] != null) {
            const entity = collections[category][itemName];

            summonEntity(entity, position);
        } else {
            this.message("Entity not found.");
        }
    }

    getWorldPosition(position) {
        if (position.x === "~") position.x = player.position.x / BLOCK_SIZE;
        if (position.y === "~") position.y = player.position.y / BLOCK_SIZE;

        if (isNaN(position.x) || isNaN(position.y)) return null;

        return new Vector2(position.x * BLOCK_SIZE, position.y * BLOCK_SIZE);
    }

    teleport(messageArray) {
        if (!player) {
            this.message("No player found.");
            return;
        }

        // Check if x and y coordinates are provided
        if (!messageArray[1] || !messageArray[2]) {
            this.invalidCommand("/tp <x> <y>");
            return;
        }

        const x = messageArray[1] !== "~" ? parseInt(messageArray[1]) : "~";
        const y = messageArray[2] !== "~" ? parseInt(messageArray[2]) : "~";

        const targetPosition = this.getWorldPosition(new Vector2(x, y));

        if (!targetPosition) {
            this.invalidCommand("/tp <x> <y>");
        }

        player.teleport(targetPosition);

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

        const gamemodeMap = {
            survival: 0,
            creative: 1,
            adventure: 2,
            // spectator: 3,
        };

        const input = messageArray[1].toLowerCase();

        // Determine the gamemode number
        let gamemode;
        if (isNaN(input)) {
            gamemode = gamemodeMap[input];
        } else {
            gamemode = parseInt(input);
        }

        if (gamemode === undefined || gamemode < 0 || gamemode > 3) {
            this.message(
                "Invalid gamemode. Valid gamemodes are: " +
                    "0 (Survival) 1 (Creative), 2 (Adventure) "
            );
            return;
        }

        player.setGamemode(gamemode);

        const gamemodeNames = [
            "Survival",
            "Creative",
            "Adventure",
            // "Spectator",
        ];
        this.message("Gamemode set to " + gamemodeNames[gamemode] + ".");
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
                drawText({
                    text: this.tempMessages[this.tempMessages.length - 1 - i]
                        .text, // Reverse order
                    x: 17,
                    y: CANVAS.height - 60 - i * 30,
                    size: 30,
                    shadow: true,
                    textAlign: "left",
                });
            }
            return;
        }

        ctx.fillStyle = "rgb(0, 0, 0, .6)";
        ctx.fillRect(10, CANVAS.height - 50, 1000, 40);

        const beforeCursor = this.currentMessage.slice(0, this.cursorPosition);
        const cursorX = 17 + this.measureTextWidth(beforeCursor, 30); // Using the helper function

        // const messageToDisplay =
        //     this.currentMessage.slice(0, this.cursorPosition) +
        //     (this.showCursor ? "_" : "") +
        //     this.currentMessage.slice(this.cursorPosition);

        drawText({
            text: this.currentMessage,
            x: 17,
            y: CANVAS.height - 20,
            size: 30,
            shadow: false,
            textAlign: "left",
        });

        if (this.showCursor) {
            ctx.fillStyle = "white";
            ctx.fillRect(cursorX, CANVAS.height - 22, 13, 4); // Draw cursor
        }

        for (let i = 0; i < this.viewHistory; i++) {
            const messageIndex = this.messages.length - 1 - i;

            if (!this.messages[messageIndex]) continue;

            drawText({
                text: this.messages[messageIndex],
                x: 17,
                y: CANVAS.height - 60 - i * 30,
                size: 30,
                shadow: true,
                textAlign: "left",
            });
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
                    this.cursorPosition = this.currentMessage.length;
                }
            }
        }

        if (input.isKeyPressed("ArrowDown")) {
            // Move to the next message in the history or reset to an empty message
            if (this.historyIndex > 1) {
                this.historyIndex--;
                this.currentMessage =
                    this.chatLog[this.chatLog.length - this.historyIndex];
                this.cursorPosition = this.currentMessage.length;
            } else if (this.historyIndex === 1) {
                this.historyIndex = -1; // Reset to current input
                this.currentMessage = ""; // Clear the message if no history is selected
                this.cursorPosition = 0;
            }
        }
    }

    measureTextWidth(text, fontSize) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = `${fontSize}px Pixel`; // Use the same font as your chat
        return ctx.measureText(text).width;
    }

    updateTyping() {
        this.cursorPosition = Math.max(
            0,
            Math.min(this.currentMessage.length, this.cursorPosition)
        );

        const isShiftPressed =
            input.isKeyDown("ShiftLeft") || input.isKeyDown("ShiftRight");

        this.historyCycle();

        trackedKeys.forEach((key) => {
            if (input.isKeyPressed(key)) {
                if (key === "Backspace") {
                    if (this.cursorPosition > 0) {
                        this.currentMessage =
                            this.currentMessage.slice(
                                0,
                                this.cursorPosition - 1
                            ) + this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition--; // Move cursor back
                    }
                    return;
                }
                if (key === "Delete") {
                    if (this.cursorPosition < this.currentMessage.length) {
                        this.currentMessage =
                            this.currentMessage.slice(0, this.cursorPosition) +
                            this.currentMessage.slice(this.cursorPosition + 1);
                    }
                    return;
                }
                if (key === "ArrowLeft") {
                    this.cursorPosition = Math.max(0, this.cursorPosition - 1);
                    return;
                }
                if (key === "ArrowRight") {
                    this.cursorPosition = Math.min(
                        this.currentMessage.length,
                        this.cursorPosition + 1
                    );
                    return;
                }
                if (this.currentMessage.length >= this.maxLenght) return;

                switch (key) {
                    case key.startsWith("Key") && key:
                        const letter = key.replace("Key", "");
                        this.currentMessage =
                            this.currentMessage.slice(0, this.cursorPosition) +
                            (isShiftPressed
                                ? letter.toUpperCase()
                                : letter.toLowerCase()) +
                            this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition++; // Move cursor forward
                        break;
                    case key.startsWith("Digit") && key:
                        this.currentMessage =
                            this.currentMessage.slice(0, this.cursorPosition) +
                            key.replace("Digit", "") +
                            this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition++;
                        break;
                    case "Space":
                        this.currentMessage =
                            this.currentMessage.slice(0, this.cursorPosition) +
                            " " +
                            this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition++;
                        break;
                    case "Backslash":
                        this.currentMessage =
                            this.currentMessage.slice(0, this.cursorPosition) +
                            "/" +
                            this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition++;
                        break;
                    case "Period":
                        this.currentMessage =
                            this.currentMessage.slice(0, this.cursorPosition) +
                            "." +
                            this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition++;
                        break;
                    case "Backquote":
                        if (input.shiftPressed)
                            this.currentMessage =
                                this.currentMessage.slice(
                                    0,
                                    this.cursorPosition
                                ) +
                                "~" +
                                this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition++;
                        break;
                    default:
                        break;
                }
            }
        });
    }

    update() {
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
