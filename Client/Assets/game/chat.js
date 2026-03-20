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
        this._boundKeyHandler = this._handleChatKeyDown.bind(this);
    }

    openChat() {
        this.historyIndex = 0;
        this.inChat = true;
        if (world.player) world.player.canMove = false;
        document.addEventListener("keydown", this._boundKeyHandler, {
            capture: true,
        });
    }

    closeChat() {
        this.inChat = false;
        if (world.player) world.player.canMove = true;
        document.removeEventListener("keydown", this._boundKeyHandler, {
            capture: true,
        });
        this.currentMessage = "";
    }

    _handleChatKeyDown(event) {
        event.preventDefault();
        const key = event.key;

        if (key === "Escape") {
            this.closeChat();
            event.stopPropagation();
            return;
        }
        if (key === "Enter") {
            this.send();
            return;
        }
        if (key === "Tab") {
            this.autocomplete();
            return;
        }
        if (key === "Backspace") {
            if (this.cursorPosition > 0) {
                this.currentMessage =
                    this.currentMessage.slice(0, this.cursorPosition - 1) +
                    this.currentMessage.slice(this.cursorPosition);
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
                this.cursorPosition + 1,
            );
            return;
        }
        if (key === "ArrowUp") {
            if (
                this.chatLog.length > 0 &&
                this.historyIndex < this.chatLog.length
            ) {
                if (this.historyIndex === -1) this.historyIndex = 0;
                this.historyIndex++;
                this.currentMessage =
                    this.chatLog[this.chatLog.length - this.historyIndex];
                this.cursorPosition = this.currentMessage.length;
            }
            return;
        }
        if (key === "ArrowDown") {
            if (this.historyIndex > 1) {
                this.historyIndex--;
                this.currentMessage =
                    this.chatLog[this.chatLog.length - this.historyIndex];
                this.cursorPosition = this.currentMessage.length;
            } else if (this.historyIndex === 1) {
                this.historyIndex = -1;
                this.currentMessage = "";
                this.cursorPosition = 0;
            }
            return;
        }

        if (
            event.key.length === 1 &&
            event.key.charCodeAt(0) >= 32 &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
        ) {
            if (this.currentMessage.length >= this.maxLength) return;
            if (event.repeat) return;
            this.resetAutocomplete();
            this.currentMessage =
                this.currentMessage.slice(0, this.cursorPosition) +
                key +
                this.currentMessage.slice(this.cursorPosition);
            this.cursorPosition++;
        }
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
                this.currentMessage.slice(1, this.currentMessage.length),
            );
            message = "";
            color = Colors.Yellow; // Cheat commands use yellow
        }

        if (multiplayer && this.isValidText(message)) {
            server.send({
                type: "chat",
                message: message,
                sender: world.player.UUID,
                color,
            });
        }

        if (message) {
            this.message(message, world.player.name, color);
        }

        this.closeChat();
    }

    welcomeMessage() {
        this.message(
            "------------------------------------------------------",
            "",
            Colors.Green,
            true,
        );
        this.message(
            "Welcome to Minecraft JS! Type /help for commands.",
            "",
            Colors.Green,
        );
        this.message(
            "This is a 2D Minecraft experience built with JavaScript.",
            "",
            Colors.Green,
        );
        this.message(
            "This project is open source and available on GitHub.",
            "",
            Colors.Green,
        );
        this.message(
            "Donations are appreciated to support development. :)",
            "",
            Colors.Green,
        );
        this.message(
            "------------------------------------------------------",
            "",
            Colors.Green,
            true,
        );
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
                (cmd) => cmd.name.toLowerCase() === commandName,
            );
            if (!command) {
                return [];
            }

            const argType = command.args[argIndex - 1];
            const prefix = parts[argIndex]?.toLowerCase() || "";

            switch (argType) {
                case "category.item":
                    const blockItems = Object.keys(Blocks).map(
                        (name) => `Blocks.${name}`,
                    );
                    const items = Object.keys(Items).map(
                        (name) => `Items.${name}`,
                    );
                    const itemSuggestions = [...blockItems, ...items].filter(
                        (item) => item.toLowerCase().startsWith(prefix),
                    );
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
                        world.player
                            ? Math.floor(
                                  world.player.position.x / BLOCK_SIZE,
                              ).toString()
                            : "0",
                    ];

                case "entity":
                    const entitySuggestions = Object.keys(Entities).filter(
                        (entity) => entity.toLowerCase().startsWith(prefix),
                    );
                    return entitySuggestions;
                case "structure":
                    const structureSuggestions = Object.keys(Structures).filter(
                        (structure) =>
                            structure.toLowerCase().startsWith(prefix),
                    );
                    return structureSuggestions;
                case "biome":
                    const biomeSuggestions = Object.keys(AllBiomes).filter(
                        (biome) => biome.toLowerCase().startsWith(prefix),
                    );
                    return biomeSuggestions;
                case "rule":
                    const ruleSuggestions = [
                        ...Object.keys(GAMERULES),
                        "list",
                    ].filter((rule) => rule.toLowerCase().startsWith(prefix));
                    return ruleSuggestions;
                case "value":
                    return ["true", "false"];
                case "dimension":
                    return ["overworld", "nether", "0", "1"];
                case "time":
                    return ["1", "3", "5", "7.5"];
                case "block":
                    const blockSuggestions = Object.keys(Blocks).filter(
                        (block) => block.toLowerCase().startsWith(prefix),
                    );
                    return blockSuggestions;
                default:
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
                cursorWordIndex,
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
            const biomeChunkX = world.generator.locateBiome(biome);

            if (!biomeChunkX) {
                this.message("Biome not found.", "", Colors.Red);
                return;
            }
            const chunkPos = biomeChunkX * CHUNK_WIDTH;
            this.message(
                `Biome ${biomeName} found at ${chunkPos}.`,
                "",
                Colors.Green,
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
        return text != null && text.trim().length > 0;
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
                if (!world.player) break;
                world.player.dieEvent();
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
                this.message(`Seed: ${world.seed}`);

                if (!navigator?.clipboard) {
                    this.message(
                        "Clipboard API not available. Unable to copy seed.",
                        "",
                        Colors.Red,
                    );
                } else {
                    navigator.clipboard.writeText(world.seed);
                }
                this.message("Seed copied to clipboard.", "", Colors.Green);
                break;
            case "hit":
                if (!world.player) break;
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

        world.generator.fill(
            position1.x,
            position1.y,
            position2.x,
            position2.y,
            blockType,
        );

        this.cheatMessage(
            `Filled area from (${world.worldToBlocks(position1).x}, ${
                world.worldToBlocks(position1).y
            }) to (${world.worldToBlocks(position2).x}, ${
                world.worldToBlocks(position2).y
            }) with ${blockName}.`,
            "",
            Colors.Green,
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
            const userBlockPos = new Vector2(
                Math.floor(position.x / BLOCK_SIZE),
                world.worldToUserBlockY(position.y),
            );

            const placed = world.setBlockTypeAtUserBlockPosition(
                userBlockPos.x,
                userBlockPos.y,
                block,
                false,
                activeDimension,
                null,
                true,
            );

            if (placed) {
                world.serverPlaceBlock(
                    world.getChunkXForWorldX(position.x),
                    world.worldToLocal(position.x, position.y).x,
                    world.worldToLocal(position.x, position.y).y,
                    block,
                );
            }

            if (!placed) {
                this.message("Could not place block here.", "", Colors.Red);
                return;
            }

            this.cheatMessage(
                `Set block ${blockName} at ${userBlockPos.x}, ${userBlockPos.y}`,
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
        if (!world.player) return;

        if (!messageArray[1]) {
            this.invalidCommand("/hit <damage>");
            return;
        }

        const damage = parseInt(messageArray[1]);

        if (isNaN(damage)) {
            this.invalidCommand("/hit <damage>");
            return;
        }

        world.player.hit(damage);
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
            const playerUserPos = world.worldToBlocks(world.player.position);
            world.generator.generateStructure(
                structureName,
                world.player.position.x,
                playerUserPos.y * BLOCK_SIZE,
            );

            this.cheatMessage(
                `Structure ${structureName} generated at ${playerUserPos.x}, ${playerUserPos.y}`,
            );
        } else {
            this.message(
                `Structure ${structureName} not found.`,
                "",
                Colors.Red,
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

        if (Entities[itemName] != null) {
            const entity = Entities[itemName];
            const userPosition = world.worldToBlocks(position);

            for (let i = 0; i < count; i++) {
                summonEntity(entity, structuredClone(position));
            }

            this.cheatMessage(
                `Summoned ${count} ${entity.name} at ${userPosition.x}, ${userPosition.y}`,
            );
        } else {
            this.message("Entity not found.", "", Colors.Red);
        }
    }

    getWorldPosition(position) {
        if (position.x === "~")
            position.x = world.player.position.x / BLOCK_SIZE;
        if (position.y === "~")
            position.y = world.worldToBlocks(world.player.position).y;

        if (isNaN(position.x) || isNaN(position.y)) return null;

        return world.userBlocksToWorldPosition(position.x, position.y);
    }

    teleport(messageArray) {
        if (!world.player) {
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
            return;
        }

        world.player.teleport(targetPosition);

        this.cheatMessage(`Teleported player to x: ${x} y: ${y}`);
    }

    gamemode(messageArray) {
        if (!messageArray[1]) {
            this.invalidCommand("/gamemode <Gamemode>");
            return;
        }

        if (!world.player) {
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
                    "0 (Survival) 1 (Creative) 2 (Adventure) 3 (Spectator)",
            );
            return;
        }

        world.player.setGamemode(gamemode);

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
                sender: world.player.UUID,
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

    message(message, sender = "", color = Colors.White, force = false) {
        if (!this.isValidText(message) && !force) return;

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
        if (!world.player) return;

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

            world.player.inventory.addItem(inventoryItem);

            this.cheatMessage(
                `Gave ${count} ${
                    category === "Blocks"
                        ? getBlock(item).name
                        : getItem(item).name
                } to the player.`,
            );
        } else {
            this.message(`Item ${messageArray[1]} not found.`, "", Colors.Red);
        }
    }

    clear() {
        this.cheatMessage("Cleared Inventory");
        world.player.inventory.createItemArray();
    }

    draw(ctx) {
        if (!this.inChat) {
            const maxMessages = Math.min(
                this.viewHistory,
                this.tempMessages.length,
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

    measureTextWidth(text, fontSize) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = `${fontSize}px Pixel`; // Use the same font as your chat
        return ctx.measureText(text).width;
    }

    update() {
        if (!this.inChat) {
            // check message duration and hide if elapsed
            const now = Date.now();
            this.tempMessages = this.tempMessages.filter(
                (msg) => now - msg.timestamp < this.messageDuration,
            );
        } else {
            this.cursorPosition = Math.max(
                0,
                Math.min(this.currentMessage.length, this.cursorPosition),
            );

            this.cursorBlinkTime += deltaTime;

            if (this.cursorBlinkTime >= 0.5) {
                this.showCursor = !this.showCursor;
                this.cursorBlinkTime = 0;
            }
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
