class InputHandler {
    constructor(keys) {
        this.keys = {};
        this.keysDown = {};
        keys.forEach((key) => {
            this.keys[key] = false;
            this.keysDown[key] = false;
        });
        this.mouse = {
            leftMouseDown: false,
            position: { x: 0, y: 0 },
        };
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
        document.addEventListener("mouseup", () => this._handleMouseUp());
        document.addEventListener("mousemove", (event) =>
            this._handleMouseMove(event)
        );
    }

    _handleKeyDown(event) {
        const key = event.code;
        if (key in this.keys) {
            if (!this.keys[key]) {
                this.keysDown[key] = true;
            }
            this.keys[key] = true;
        }
    }

    _handleKeyUp(event) {
        const key = event.code;
        if (key in this.keys) {
            this.keys[key] = false;
            this.keysDown[key] = false;
        }
    }

    _handleMouseDown(event) {
        if (event.button === 0) {
            this.mouse.leftMouseDown = true;
        }
    }

    isLeftMouseButtonPressed() {
        if (this.mouse.leftMouseDown) {
            this.mouse.leftMouseDown = false;
            return true;
        }
        return false;
    }

    _handleMouseUp() {
        this.mouse.leftMouseDown = false;
    }

    _handleMouseMove(event) {
        this.mouse.position.x = event.clientX;
        this.mouse.position.y = event.clientY;
    }

    isKeyDown(keyCode) {
        return this.keys[keyCode] || false;
    }

    isKeyPressed(keyCode) {
        if (this.keysDown[keyCode]) {
            this.keysDown[keyCode] = false;
            return true;
        }
        return false;
    }

    getMousePosition() {
        return { ...this.mouse.position };
    }

    getMousePositionOnBlockGrid() {
        const pos = this.getMousePosition();

        const gridX =
            Math.floor((pos.x + camera.x) / BLOCK_SIZE) * BLOCK_SIZE -
            Math.floor(camera.x);
        const gridY =
            Math.floor((pos.y + camera.y) / BLOCK_SIZE) * BLOCK_SIZE -
            Math.floor(camera.y);

        return new Vector2(Math.floor(gridX), Math.floor(gridY));
    }

    isLeftMouseDown() {
        return this.mouse.leftMouseDown;
    }
}

// Define the keys you want to track
const trackedKeys = [
    "KeyA",
    "KeyB",
    "KeyC",
    "68",
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
];

// Create an instance of the InputHandler with the keys you want to track
const input = new InputHandler(trackedKeys);
