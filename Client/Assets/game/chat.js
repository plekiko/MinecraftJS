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

        this.maxLength = 50;
        this.messageDuration = 8000;

        this.historyIndex = 0;
        this.viewHistory = 25;

        this.suggestions = [];
        this.suggestionIndex = -1;
        this.originalInput = "";
        this.autocompletePart = "";

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

        let color = Colors.White; // Default color for regular messages
        if (this.currentMessage.startsWith("/", 0)) {
            this.doCheat(
                this.currentMessage.slice(1, this.currentMessage.length)
            );
            message = "";
            color = Colors.Yellow; // Cheat commands use yellow
        }

        if (multiplayer && this.isValidText(message)) {
            server.send({
                type: "chat",
                message: message,
                sender: player.UUID,
                color,
            });
        }

        if (message) {
            this.message(message, player.name, color);
        }

        this.closeChat();
    }

    getCommandSuggestions() {
        return [
            { name: "give", args: ["category.item", "count"] },
            { name: "clear", args: [] },
            { name: "clearlog", args: [] },
            { name: "gamemode", args: ["mode"] },
            { name: "tp", args: ["x", "y"] },
            { name: "summon", args: ["entity", "x", "y", "count"] },
            { name: "kill", args: [] },
            { name: "time", args: ["time"] },
            { name: "help", args: [] },
            { name: "structure", args: ["structure"] },
            { name: "locatebiome", args: ["biome"] },
            { name: "seed", args: [] },
            { name: "hit", args: ["damage"] },
            { name: "gamerule", args: ["rule", "value"] },
            { name: "dim", args: ["dimension"] },
            { name: "dimension", args: ["dimension"] },
            { name: "setblock", args: ["block", "x", "y"] },
            { name: "fill", args: ["block", "x", "y", "x", "y"] },
        ];
    }

    resetAutocomplete() {
        this.suggestions = [];
        this.suggestionIndex = -1;
        this.originalInput = "";
        this.autocompletePart = "";
    }

    generateSuggestions(input, argIndex) {
        const commands = this.getCommandSuggestions();
        const parts = input.trim().split(/\s+/); // Split on any whitespace
        const isCommand = input.startsWith("/") && argIndex === 0;

        if (isCommand) {
            const prefix = parts[0].slice(1).toLowerCase();
            const suggestions = commands
                .filter((cmd) => cmd.name.toLowerCase().startsWith(prefix))
                .map((cmd) => cmd.name);
            return suggestions;
        } else {
            const commandName = parts[0].slice(1).toLowerCase();
            const command = commands.find(
                (cmd) => cmd.name.toLowerCase() === commandName
            );
            if (!command) {
                console.log("No matching command found");
                return [];
            }

            const argType = command.args[argIndex - 1];
            const prefix = parts[argIndex]?.toLowerCase() || "";

            switch (argType) {
                case "category.item":
                    const blockItems = Object.keys(Blocks).map(
                        (name) => `Blocks.${name}`
                    );
                    const items = Object.keys(Items).map(
                        (name) => `Items.${name}`
                    );
                    const itemSuggestions = [...blockItems, ...items].filter(
                        (item) => item.toLowerCase().startsWith(prefix)
                    );
                    console.log(`Item suggestions: ${itemSuggestions}`);
                    return itemSuggestions;
                case "count":
                case "damage":
                    return ["1", "64"];
                case "mode":
                    return [
                        "survival",
                        "creative",
                        "adventure",
                        "spectator",
                        "0",
                        "1",
                        "2",
                        "3",
                    ];
                case "x":
                case "y":
                    return [
                        "~",
                        "0",
                        player
                            ? Math.floor(
                                  player.position.x / BLOCK_SIZE
                              ).toString()
                            : "0",
                    ];
                case "entity":
                    const entitySuggestions = Object.keys(Entities).filter(
                        (entity) => entity.toLowerCase().startsWith(prefix)
                    );
                    console.log(`Entity suggestions: ${entitySuggestions}`);
                    return entitySuggestions;
                case "structure":
                    const structureSuggestions = Object.keys(Structures).filter(
                        (structure) =>
                            structure.toLowerCase().startsWith(prefix)
                    );
                    console.log(
                        `Structure suggestions: ${structureSuggestions}`
                    );
                    return structureSuggestions;
                case "biome":
                    const biomeSuggestions = Object.keys(AllBiomes).filter(
                        (biome) => biome.toLowerCase().startsWith(prefix)
                    );
                    console.log(`Biome suggestions: ${biomeSuggestions}`);
                    return biomeSuggestions;
                case "rule":
                    const ruleSuggestions = [
                        ...Object.keys(GAMERULES),
                        "list",
                    ].filter((rule) => rule.toLowerCase().startsWith(prefix));
                    console.log(`Rule suggestions: ${ruleSuggestions}`);
                    return ruleSuggestions;
                case "value":
                    return ["true", "false"];
                case "dimension":
                    return ["overworld", "nether", "eather", "0", "1", "2"];
                case "time":
                    return ["1", "3", "5", "7.5"];
                case "block":
                    const blockSuggestions = Object.keys(Blocks).filter(
                        (block) => block.toLowerCase().startsWith(prefix)
                    );
                    return blockSuggestions;
                default:
                    console.log("No suggestions for unknown argType");
                    return [];
            }
        }
    }

    autocomplete() {
        if (!this.inChat) return; // Prevent autocomplete when chat is closed

        const parts = this.currentMessage.trim().split(/\s+/);
        const cursorWordIndex =
            this.currentMessage.slice(0, this.cursorPosition).split(/\s+/)
                .length - 1;
        const currentPart =
            parts[cursorWordIndex] ||
            (this.currentMessage.startsWith("/") ? "/" : "");

        // Initialize or continue autocomplete cycle
        if (this.suggestionIndex === -1) {
            this.originalInput = this.currentMessage;
            this.autocompletePart = currentPart;
            this.suggestions = this.generateSuggestions(
                this.currentMessage,
                cursorWordIndex
            );
        }

        if (this.suggestions.length === 0) return;

        // Cycle to the next suggestion
        this.suggestionIndex =
            (this.suggestionIndex + 1) % this.suggestions.length;
        const suggestion = this.suggestions[this.suggestionIndex];

        // Reconstruct the message
        if (cursorWordIndex === 0 && this.currentMessage.startsWith("/")) {
            parts[cursorWordIndex] = "/" + suggestion;
        } else {
            parts[cursorWordIndex] = suggestion;
        }

        this.currentMessage = parts.join(" ");
        this.cursorPosition =
            parts.slice(0, cursorWordIndex).join(" ").length +
            (cursorWordIndex > 0 ? 1 : 0) +
            (parts[cursorWordIndex] || "").length;
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

    locateBiome(messageArray) {
        if (!messageArray[1]) {
            this.invalidCommand("/locatebiome <BiomeName>");
            return;
        }

        const biomeName = messageArray[1];
        const biome = AllBiomes[biomeName];

        if (biome) {
            const biomeChunkX = LocateBiome(biome);

            if (!biomeChunkX) {
                this.message("Biome not found.", "", Colors.Red);
                return;
            }
            const chunkPos = biomeChunkX * CHUNK_WIDTH;
            this.message(
                `Biome ${biomeName} found at ${chunkPos}.`,
                "",
                Colors.Green
            );
        } else {
            this.message("Biome not found.", "", Colors.Red);
        }
    }

    clearLog() {
        this.chatLog = [];
        this.saveLog();
        this.message("Cleared chat history", "", Colors.Green);
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
            case "help":
                this.printHelp();
                break;
            case "structure":
                this.structure(messageArray);
                break;
            case "locatebiome":
                this.locateBiome(messageArray);
                break;
            case "seed":
                this.message(`Seed: ${seed}`);

                if (!navigator?.clipboard) {
                    console.log("Clipboard API not available");
                } else {
                    navigator.clipboard.writeText(seed);
                }
                this.message("Seed copied to clipboard.");
                break;
            case "hit":
                if (!player) break;
                this.hitPlayer(messageArray);
                break;
            case "gamerule":
                this.gameRule(messageArray);
                break;
            case "dim" || "dimension":
                this.dimension(messageArray);
                break;
            case "setblock":
                this.setBlock(messageArray);
                break;
            case "fill":
                this.fill(messageArray);
                break;
            default:
                this.message("Invalid Command!", "", Colors.Red);
                break;
        }

        this.closeChat();
    }

    fill(messageArray) {
        // Use the fill function
        if (!messageArray[1]) {
            this.invalidCommand("/fill <block> <x1> <y1> <x2> <y2>");
            return;
        }

        const blockName = messageArray[1];

        const x1 = messageArray[2] !== "~" ? parseInt(messageArray[2]) : "~";
        const y1 = messageArray[3] !== "~" ? parseInt(messageArray[3]) : "~";
        const x2 = messageArray[4] !== "~" ? parseInt(messageArray[4]) : "~";
        const y2 = messageArray[5] !== "~" ? parseInt(messageArray[5]) : "~";

        const position1 = this.getWorldPosition(new Vector2(x1, y1));
        const position2 = this.getWorldPosition(new Vector2(x2, y2));

        if (
            x1 === null ||
            y1 === null ||
            x2 === null ||
            y2 === null ||
            position1 === null ||
            position2 === null
        ) {
            this.invalidCommand("/fill <block> <x1> <y1> <x2> <y2>");
            return;
        }

        const blockType = Blocks[blockName];

        if (!blockType) {
            this.message(`Block ${blockName} not found.`, "", Colors.Red);
            return;
        }

        fill(position1.x, position1.y, position2.x, position2.y, blockType);

        this.cheatMessage(
            `Filled area from (${worldToBlocks(position1).x}, ${
                worldToBlocks(position1).y
            }) to (${worldToBlocks(position2).x}, ${
                worldToBlocks(position2).y
            }) with ${blockName}.`
        );
    }

    setBlock(messageArray) {
        if (!messageArray[1]) {
            this.invalidCommand("/setblock <block> <x> <y>");
            return;
        }

        const blockName = messageArray[1];
        const x = messageArray[2] !== "~" ? parseInt(messageArray[2]) : "~";
        const y = messageArray[3] !== "~" ? parseInt(messageArray[3]) : "~";

        const position = this.getWorldPosition(new Vector2(x, y));

        if (!position) {
            this.invalidCommand("/setblock <block> <x> <y>");
            return;
        }

        const block = Blocks[blockName];

        if (block) {
            SetBlockTypeAtPosition(position.x, position.y, block);
            this.cheatMessage(
                `Set block ${blockName} at ${Math.floor(
                    position.x
                )}, ${Math.floor(position.y)}`
            );
        } else {
            this.message("Block not found.", "", Colors.Red);
        }
    }

    dimension(messageArray) {
        if (!messageArray[1]) {
            this.invalidCommand("/dim <dimension>");
            return;
        }

        const dimension = messageArray[1].toLowerCase();

        if (dimension === "overworld" || dimension === "0") {
            gotoDimension(0);
        } else if (dimension === "nether" || dimension === "1") {
            gotoDimension(1);
        } else if (dimension === "eather" || dimension === "2") {
            gotoDimension(2);
        } else {
            this.message("Invalid dimension.");
        }
    }

    gameRule(messageArray) {
        // /gamerule <rule> <value>
        if (!messageArray[1]) {
            this.invalidCommand("/gamerule <rule> <value>");
            return;
        }

        const rule = messageArray[1];
        const value = messageArray[2];

        if (rule === "list") {
            for (const key in GAMERULES) {
                this.message(`${key}: ${GAMERULES[key]}`);
            }
            return;
        }

        if (GAMERULES[rule] === undefined) {
            this.message("Invalid rule.");
            return;
        }

        if (value === "true") {
            GAMERULES[rule] = true;
            this.cheatMessage(`${rule} set to true.`);
        } else if (value === "false") {
            GAMERULES[rule] = false;
            this.cheatMessage(`${rule} set to false.`);
        } else {
            this.message("Invalid value. Use true or false.");
        }
    }

    hitPlayer(messageArray) {
        if (!player) return;

        if (!messageArray[1]) {
            this.invalidCommand("/hit <damage>");
            return;
        }

        const damage = parseInt(messageArray[1]);

        if (isNaN(damage)) {
            this.invalidCommand("/hit <damage>");
            return;
        }

        player.hit(damage);
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

        this.cheatMessage(`Time set to ${newTime}`);

        time = newTime;
    }

    structure(messageArray) {
        if (!messageArray[1]) {
            this.invalidCommand("/structure <StructureName>");
            return;
        }

        const structureName = messageArray[1];

        if (Structures[structureName] !== undefined) {
            GenerateStructure(
                structureName,
                player.position.x,
                player.position.y
            );

            this.cheatMessage(
                `Structure ${structureName} generated at ${player.position.x}, ${player.position.y}`
            );
        } else {
            this.message(
                `Structure ${structureName} not found.`,
                "",
                Colors.Red
            );
        }
    }

    summon(messageArray) {
        if (!messageArray[1] || !messageArray[2] || !messageArray[3]) {
            this.invalidCommand("/summon <Entity> <x> <y> <count>");
            return;
        }

        const itemName = messageArray[1];

        const x = messageArray[2] !== "~" ? parseInt(messageArray[2]) : "~";
        const y = messageArray[3] !== "~" ? parseInt(messageArray[3]) : "~";

        const position = this.getWorldPosition(new Vector2(x, y));

        let count = parseInt(messageArray[4]);

        if (!count || isNaN(count) || count < 1) count = 1;

        if (!position) {
            this.invalidCommand("/summon <Entity> <x> <y>");
            return;
        }

        position.y = -position.y + CHUNK_HEIGHT * BLOCK_SIZE;

        console.log(itemName);

        if (Entities[itemName] != null) {
            const entity = Entities[itemName];

            for (let i = 0; i < count; i++) {
                summonEntity(entity, structuredClone(position));
            }

            this.cheatMessage(
                `Summoned ${count} ${entity.name} at ${position.x}, ${position.y}`
            );
        } else {
            this.message("Entity not found.", "", Colors.Red);
        }
    }

    getWorldPosition(position) {
        if (position.x === "~") position.x = player.position.x / BLOCK_SIZE;
        if (position.y === "~")
            position.y = CHUNK_HEIGHT - player.position.y / BLOCK_SIZE;

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

        this.cheatMessage(`Teleported player to x: ${x} y: ${y}`);
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
            spectator: 3,
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
                    "0 (Survival) 1 (Creative) 2 (Adventure) 3 (Spectator)"
            );
            return;
        }

        player.setGamemode(gamemode);

        const gamemodeNames = [
            "Survival",
            "Creative",
            "Adventure",
            "Spectator",
        ];
        this.cheatMessage("Gamemode set to " + gamemodeNames[gamemode] + ".");
    }

    cheatMessage(message) {
        if (multiplayer) {
            server.send({
                type: "chat",
                message: message,
                sender: player.UUID,
            });
        }

        this.message(message);

        this.closeChat();
    }

    invalidCommand(usage) {
        this.message("Usage: " + usage, "", Colors.Red);
    }

    printHelp() {
        const commands = this.getCommandSuggestions();

        this.message("Available Commands:", "", Colors.LightPurple);
        commands.forEach((command) => {
            const args = command.args.length
                ? command.args.map((arg) => `<${arg}>`).join(" ")
                : "";
            this.message(`/${command.name} ${args}`, "", Colors.Aqua);
        });
    }

    message(message, sender = "", color = Colors.White) {
        if (!this.isValidText(message)) return;

        let finalMessage = sender ? `[${sender}] ${message}` : message;

        // Store in messages array (for persistent history)
        this.messages.push({ text: finalMessage, color });

        // Store in tempMessages with timestamp for temporary display
        this.tempMessages.push({
            text: finalMessage,
            timestamp: Date.now(),
            color,
        });

        // Trim messages to respect viewHistory limit
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

            if (inventoryItem.air) return;

            player.inventory.addItem(inventoryItem);

            this.cheatMessage(
                `Gave ${count} ${
                    category === "Blocks"
                        ? GetBlock(item).name
                        : GetItem(item).name
                } to the player.`
            );
        } else {
            this.message(`Item ${messageArray[1]} not found.`, "", Colors.Red);
        }
    }

    clear() {
        this.cheatMessage("Cleared Inventory");
        player.inventory.createItemArray();
    }

    draw(ctx) {
        if (!this.inChat) {
            const maxMessages = Math.min(
                this.viewHistory,
                this.tempMessages.length
            );
            for (let i = 0; i < maxMessages; i++) {
                const msg = this.tempMessages[this.tempMessages.length - 1 - i];
                drawText({
                    text: msg.text,
                    x: 17,
                    y: CANVAS.height - 60 - i * 30,
                    size: 30,
                    color: msg.color, // Use stored color
                    shadow: true,
                    textAlign: "left",
                });
            }
            return;
        }

        ctx.fillStyle = "rgb(0, 0, 0, .6)";
        ctx.fillRect(10, CANVAS.height - 50, 1000, 40);

        const beforeCursor = this.currentMessage.slice(0, this.cursorPosition);
        const cursorX = 17 + this.measureTextWidth(beforeCursor, 30);

        drawText({
            text: this.currentMessage,
            x: 17,
            y: CANVAS.height - 20,
            size: 30,
            color: "white", // Current message remains white for simplicity
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

            const msg = this.messages[messageIndex];
            drawText({
                text: msg.text,
                x: 17,
                y: CANVAS.height - 60 - i * 30,
                size: 30,
                color: msg.color, // Use stored color
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
                if (key !== "Tab") {
                    this.resetAutocomplete();
                }

                if (key === "Tab") {
                    this.autocomplete();
                    return;
                }
                if (key === "Backspace") {
                    if (this.cursorPosition > 0) {
                        this.currentMessage =
                            this.currentMessage.slice(
                                0,
                                this.cursorPosition - 1
                            ) + this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition--;
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
                if (key === "Minus") {
                    this.currentMessage =
                        this.currentMessage.slice(0, this.cursorPosition) +
                        "-" +
                        this.currentMessage.slice(this.cursorPosition);
                    this.cursorPosition++;
                }

                if (input.shiftPressed) {
                    if (key === "Equal") {
                        this.currentMessage =
                            this.currentMessage.slice(0, this.cursorPosition) +
                            "+" +
                            this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition++;
                    }
                }

                if (this.currentMessage.length >= this.maxLength) return;

                if (key.startsWith("Key")) {
                    const letter = key.replace("Key", "");
                    this.currentMessage =
                        this.currentMessage.slice(0, this.cursorPosition) +
                        (isShiftPressed
                            ? letter.toUpperCase()
                            : letter.toLowerCase()) +
                        this.currentMessage.slice(this.cursorPosition);
                    this.cursorPosition++;
                } else if (key.startsWith("Digit")) {
                    this.currentMessage =
                        this.currentMessage.slice(0, this.cursorPosition) +
                        key.replace("Digit", "") +
                        this.currentMessage.slice(this.cursorPosition);
                    this.cursorPosition++;
                } else if (key === "Space") {
                    this.currentMessage =
                        this.currentMessage.slice(0, this.cursorPosition) +
                        " " +
                        this.currentMessage.slice(this.cursorPosition);
                    this.cursorPosition++;
                } else if (key === "Slash") {
                    this.currentMessage =
                        this.currentMessage.slice(0, this.cursorPosition) +
                        "/" +
                        this.currentMessage.slice(this.cursorPosition);
                    this.cursorPosition++;
                } else if (key === "Period") {
                    this.currentMessage =
                        this.currentMessage.slice(0, this.cursorPosition) +
                        "." +
                        this.currentMessage.slice(this.cursorPosition);
                    this.cursorPosition++;
                } else if (key === "Backquote") {
                    if (isShiftPressed) {
                        this.currentMessage =
                            this.currentMessage.slice(0, this.cursorPosition) +
                            "~" +
                            this.currentMessage.slice(this.cursorPosition);
                        this.cursorPosition++;
                    }
                }
            }
        });
    }

    update() {
        if (!this.inChat) {
            if (input.isKeyPressed("KeyT")) {
                this.openChat();
            }
            if (input.isKeyPressed("Slash")) {
                this.openChat();
                this.currentMessage = "/";
                this.cursorPosition = 1;
            }
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

const Colors = Object.freeze({
    Red: "#FF5555",
    DarkRed: "#AA0000",
    Green: "#55FF55",
    DarkGreen: "#00AA00",
    Blue: "#5555FF",
    DarkBlue: "#0000AA",
    Yellow: "#FFFF55",
    LightPurple: "#FF55FF",
    DarkPurple: "#AA00AA",
    Aqua: "#55FFFF",
    White: "#FFFFFF",
    Black: "#000000",
    Gray: "#AAAAAA",
    DarkGray: "#555555",
});
