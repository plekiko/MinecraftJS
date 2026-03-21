class InputHandler {
    constructor(keyBindings) {
        this.keyBindings = keyBindings;
        const keysFromBindings = new Set();
        for (const keys of Object.values(keyBindings)) {
            for (const k of keys) keysFromBindings.add(k);
        }

        this.keys = {}; // Tracks whether a key is held down
        this.keysDown = {}; // Tracks single press events
        this._pauseConsumedByUI = false;
        keysFromBindings.forEach((key) => {
            this.keys[key] = false;
            this.keysDown[key] = false;
        });

        this.mouse = {
            buttons: [false, false, false], // [left, middle, right] down state
            clicked: [false, false, false], // [left, middle, right] single-press (consumed when read)
            position: { x: 0, y: 0 },
        };
        this.scroll = { deltaX: 0, deltaY: 0 }; // Store scroll delta
        this._initializeEventListeners();
    }

    get shiftPressed() {
        return !!(this.keys["ShiftLeft"] || this.keys["ShiftRight"]);
    }

    _initializeEventListeners() {
        document.addEventListener("keydown", (event) =>
            this._handleKeyDown(event)
        );
        document.addEventListener("keyup", (event) => this._handleKeyUp(event));
        document.addEventListener("mousedown", (event) =>
            this._handleMouseDown(event)
        );
        document.addEventListener("mouseup", (event) =>
            this._handleMouseUp(event)
        );
        document.addEventListener("mousemove", (event) =>
            this._handleMouseMove(event)
        );
        document.addEventListener("wheel", (event) =>
            this._handleScroll(event)
        );
    }

    _handleKeyDown(event) {
        if (game.chat.inChat) return;
        const key = event.code;
        if (game.pauseMenu.getActive()) {
            const pauseKeys = this.keyBindings.pause;
            if (!pauseKeys || !pauseKeys.includes(key)) return;
        }
        if (!(key in this.keys)) {
            this.keys[key] = false;
            this.keysDown[key] = false;
        }
        if (key in this.keys) {
            event.preventDefault(); // Prevent default action for all keys

            if (!this.keys[key]) {
                this.keysDown[key] = true; // Set keysDown only on the first keydown
            }
            this.keys[key] = true; // Keep keys set to true as long as the key is held down
            if (!game.chat.inChat) {
                if (
                    this.keyBindings.chatOpen &&
                    this.keyBindings.chatOpen.includes(key)
                ) {
                    game.chat.openChat();
                } else if (
                    this.keyBindings.chatCommand &&
                    this.keyBindings.chatCommand.includes(key)
                ) {
                    game.chat.currentMessage = "/";
                    game.chat.cursorPosition = 1;
                    game.chat.openChat();
                }
            }
        }
    }

    _handleKeyUp(event) {
        const key = event.code;
        if (!(key in this.keys)) {
            this.keys[key] = false;
            this.keysDown[key] = false;
        }
        if (key in this.keys) {
            this.keys[key] = false;
            this.keysDown[key] = false;
        }
    }

    _handleMouseDown(event) {
        if (event.button >= 0 && event.button <= 2) {
            if (!this.mouse.buttons[event.button]) {
                this.mouse.clicked[event.button] = true;
            }
            this.mouse.buttons[event.button] = true;
        }
    }

    _handleMouseUp(event) {
        if (event.button >= 0 && event.button <= 2) {
            this.mouse.buttons[event.button] = false;
            this.mouse.clicked[event.button] = false;
        }
    }

    _handleMouseMove(event) {
        this.mouse.position.x = event.clientX;
        this.mouse.position.y = event.clientY;
    }

    _handleScroll(event) {
        this.scroll.deltaX = event.deltaX;
        this.scroll.deltaY = event.deltaY;
    }

    _mouseBindingToIndex(b) {
        if (b === "Mouse0") return 0;
        if (b === "Mouse1") return 1;
        if (b === "Mouse2") return 2;
        return -1;
    }

    isActionDown(action) {
        const keys = this.keyBindings[action];
        if (!keys) return false;
        return keys.some((b) => {
            if (b === "ScrollUp" || b === "ScrollDown") return false; // scroll has no hold state
            const idx = this._mouseBindingToIndex(b);
            if (idx >= 0) return this.mouse.buttons[idx];
            return !!this.keys[b];
        });
    }
    isActionPressed(action) {
        const keys = this.keyBindings[action];
        if (!keys) return false;
        for (const b of keys) {
            const idx = this._mouseBindingToIndex(b);
            if (idx >= 0) {
                if (this.mouse.clicked[idx]) {
                    this.mouse.clicked[idx] = false;
                    return true;
                }
            } else if (b === "ScrollUp" && this.scroll.deltaY < 0) {
                this.scroll.deltaY = 0;
                return true;
            } else if (b === "ScrollDown" && this.scroll.deltaY > 0) {
                this.scroll.deltaY = 0;
                return true;
            } else if (this.keysDown[b]) {
                return true;
            }
        }
        return false;
    }

    // Getters for key state
    isKeyDown(keyCode) {
        return this.keys[keyCode] || false; // True as long as the key is held down
    }

    isKeyPressed(keyCode) {
        return this.keysDown[keyCode] || false;
    }

    getChatTypingKeys() {
        return Object.keys(this.keys);
    }

    resetKeysPressed() {
        for (const key in this.keysDown) {
            this.keysDown[key] = false;
        }
    }

    // Getters for mouse state (physical buttons; inventory UI uses these)
    isLeftMouseButtonPressed() {
        if (this.mouse.clicked[0]) {
            this.mouse.clicked[0] = false;
            return true;
        }
        return false;
    }

    isRightMouseButtonPressed() {
        if (this.mouse.clicked[2]) {
            this.mouse.clicked[2] = false;
            return true;
        }
        return false;
    }

    getMousePosition() {
        const rect = CANVAS.getBoundingClientRect();
        const displayX = this.mouse.position.x - rect.left;
        const displayY = this.mouse.position.y - rect.top;
        // Scale from displayed canvas size to internal resolution (so cursor and hit-testing match)
        return {
            x: (displayX / rect.width) * CANVAS.width,
            y: (displayY / rect.height) * CANVAS.height,
        };
    }

    getMouseWorldPosition() {
        const pos = this.getMousePosition();
        return {
            x: pos.x + camera.x,
            y: pos.y + camera.y,
        };
    }

    getMousePositionOnBlockGrid() {
        const pos = this.getMousePosition();

        const gridX = Math.floor((pos.x + camera.x) / BLOCK_SIZE) * BLOCK_SIZE;
        const gridY = Math.floor((pos.y + camera.y) / BLOCK_SIZE) * BLOCK_SIZE;

        return new Vector2(Math.floor(gridX), Math.floor(gridY));
    }

    // Getters for scroll state
    getScrollDelta() {
        const scrollDelta = { ...this.scroll };
        this.scroll.deltaX = 0;
        this.scroll.deltaY = 0;
        return scrollDelta;
    }

    // Resetters for mouse button states
    resetMouseState() {
        this.mouse.buttons[0] = false;
        this.mouse.buttons[1] = false;
        this.mouse.buttons[2] = false;
        this.mouse.clicked[0] = false;
        this.mouse.clicked[1] = false;
        this.mouse.clicked[2] = false;
    }

    // Direct mouse state checkers for continuous state
    isLeftMouseDown() {
        return this.mouse.buttons[0];
    }

    isRightMouseDown() {
        return this.mouse.buttons[2];
    }
}

const keyBindings = loadKeyBindings();
const input = new InputHandler(keyBindings);
