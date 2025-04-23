class InputHandler {
    constructor(keys) {
        this.keys = {}; // Tracks whether a key is held down
        this.keysDown = {}; // Tracks single press events
        keys.forEach((key) => {
            this.keys[key] = false;
            this.keysDown[key] = false;
        });
        this.shiftPressed = false; // Tracks if Shift is pressed
        this.mouse = {
            leftMouseDown: false,
            rightMouseDown: false,
            leftMouseClicked: false, // Single-click tracking for left button
            rightMouseClicked: false, // Single-click tracking for right button
            wheelDown: false,
            position: { x: 0, y: 0 },
        };
        this.scroll = { deltaX: 0, deltaY: 0 }; // Store scroll delta
        this._initializeEventListeners();
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
        const key = event.code;

        event.preventDefault(); // Prevent default action for all keys

        // Check for Shift specifically
        if (key === "ShiftLeft" || key === "ShiftRight") {
            this.shiftPressed = true;
        }

        if (key in this.keys) {
            if (!this.keys[key]) {
                this.keysDown[key] = true; // Set keysDown only on the first keydown
            }
            this.keys[key] = true; // Keep keys set to true as long as the key is held down
        }
    }

    _handleKeyUp(event) {
        const key = event.code;

        // Check for Shift specifically
        if (key === "ShiftLeft" || key === "ShiftRight") {
            this.shiftPressed = false;
        }

        if (key in this.keys) {
            this.keys[key] = false; // Reset key state
            this.keysDown[key] = false; // Clear single press event
        }
    }

    _handleMouseDown(event) {
        if (event.button === 0) {
            if (!this.mouse.leftMouseDown) {
                this.mouse.leftMouseClicked = true; // Set left mouse clicked only on the first press
            }
            this.mouse.leftMouseDown = true;
        } else if (event.button === 2) {
            if (!this.mouse.rightMouseDown) {
                this.mouse.rightMouseClicked = true; // Set right mouse clicked only on the first press
            }
            this.mouse.rightMouseDown = true;
        } else if (event.button === 1) {
            this.mouse.wheelDown = true;
        }
    }

    _handleMouseUp(event) {
        if (event.button === 0) {
            this.mouse.leftMouseDown = false;
            this.mouse.leftMouseClicked = false; // Reset single-click state
        } else if (event.button === 2) {
            this.mouse.rightMouseDown = false;
            this.mouse.rightMouseClicked = false; // Reset single-click state
        } else if (event.button === 1) {
            this.mouse.wheelDown = false;
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

    // Getters for key state
    isKeyDown(keyCode) {
        return this.keys[keyCode] || false; // True as long as the key is held down
    }

    isKeyPressed(keyCode) {
        if (this.keysDown[keyCode]) {
            // True only on the first press event
            this.keysDown[keyCode] = false; // Reset after being checked once
            return true;
        }
        return false;
    }

    // Getters for mouse state
    isLeftMouseButtonPressed() {
        if (this.mouse.leftMouseClicked) {
            // Check for single-click event
            this.mouse.leftMouseClicked = false; // Reset after being read
            return true;
        }
        return false;
    }

    isRightMouseButtonPressed() {
        if (this.mouse.rightMouseClicked) {
            // Check for single-click event
            this.mouse.rightMouseClicked = false; // Reset after being read
            return true;
        }
        return false;
    }

    getMousePosition() {
        return { ...this.mouse.position };
    }

    getMouseWorldPosition() {
        return {
            x: this.mouse.position.x + camera.x,
            y: this.mouse.position.y + camera.y,
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
        this.mouse.leftMouseDown = false;
        this.mouse.rightMouseDown = false;
        this.mouse.leftMouseClicked = false;
        this.mouse.rightMouseClicked = false;
    }

    // Direct mouse state checkers for continuous state
    isLeftMouseDown() {
        return this.mouse.leftMouseDown;
    }

    isRightMouseDown() {
        return this.mouse.rightMouseDown;
    }
}

// Define the keys you want to track
const trackedKeys = [
    "KeyA",
    "KeyB",
    "KeyC",
    "KeyD",
    "KeyE",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyI",
    "KeyJ",
    "KeyK",
    "KeyL",
    "KeyM",
    "KeyN",
    "KeyO",
    "KeyP",
    "KeyQ",
    "KeyR",
    "KeyS",
    "KeyT",
    "KeyU",
    "KeyV",
    "KeyW",
    "KeyX",
    "KeyY",
    "KeyZ",
    "Digit0",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Space",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Escape",
    "Enter",
    "ShiftLeft",
    "ShiftRight",
    "ControlLeft",
    "ControlRight",
    "AltLeft",
    "AltRight",
    "Tab",
    "Backspace",
    "Minus",
    "Equal",
    "Backquote",
    "Slash",
    "Backslash",
    "Period",
];

// Create an instance of the InputHandler with the keys you want to track
const input = new InputHandler(trackedKeys);
