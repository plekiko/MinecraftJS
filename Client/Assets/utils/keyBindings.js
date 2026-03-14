// intended for latin layouts
const DEFAULT_KEY_BINDINGS = {
    attack: ["Mouse0"],
    pickBlock: ["Mouse1"],
    place: ["Mouse2"],
    moveUp: ["KeyW"],
    moveDown: ["KeyS"],
    moveLeft: ["KeyA"],
    moveRight: ["KeyD"],
    jump: ["Space"],
    sprint: ["ShiftLeft", "ShiftRight"],
    use: ["KeyE"],
    drop: ["KeyQ"],
    hotbarUp: ["ScrollUp"],
    hotbarDown: ["ScrollDown"],
    hotbar1: ["Digit1"],
    hotbar2: ["Digit2"],
    hotbar3: ["Digit3"],
    hotbar4: ["Digit4"],
    hotbar5: ["Digit5"],
    hotbar6: ["Digit6"],
    hotbar7: ["Digit7"],
    hotbar8: ["Digit8"],
    hotbar9: ["Digit9"],
    chatOpen: ["KeyT"],
    chatCommand: ["Slash"],
    chatClose: ["Escape"],
    chatSubmit: ["Enter"],
    chatHistoryUp: ["ArrowUp"],
    chatHistoryDown: ["ArrowDown"],
    pause: ["Escape"],
    debugChunkBorders: ["KeyB"],
    debugCamera: ["KeyN"],
    debugHitbox: ["KeyH"],
    debugPrintBlock: ["KeyM"],
    debugFileSize: ["KeyF"],
    debugFps: ["KeyI"],
    debugCoordinates: ["KeyC"],
    debugSave: ["KeyO"],
    debugSaveBackup: ["KeyP"],
};

const ACTION_LABELS = {
    attack: "Attack/Destroy",
    pickBlock: "Pick Block",
    place: "Use Item/Place Block",
    moveUp: "Move Up",
    moveDown: "Move Down",
    moveLeft: "Move Left",
    moveRight: "Move Right",
    jump: "Jump",
    sprint: "Sprint",
    use: "Use / Inventory",
    drop: "Drop",
    hotbarUp: "Hotbar Left",
    hotbarDown: "Hotbar Right",
    hotbar1: "Hotbar Slot 1",
    hotbar2: "Hotbar Slot 2",
    hotbar3: "Hotbar Slot 3",
    hotbar4: "Hotbar Slot 4",
    hotbar5: "Hotbar Slot 5",
    hotbar6: "Hotbar Slot 6",
    hotbar7: "Hotbar Slot 7",
    hotbar8: "Hotbar Slot 8",
    hotbar9: "Hotbar Slot 9",
    chatOpen: "Open Chat",
    chatCommand: "Open Command",
    chatClose: "Close Chat",
    chatSubmit: "Send Message",
    chatHistoryUp: "Chat History Up",
    chatHistoryDown: "Chat History Down",
    pause: "Pause / Back",
    debugChunkBorders: "Chunk Borders",
    debugCamera: "Camera",
    debugHitbox: "Hitbox",
    debugPrintBlock: "Print Block",
    debugFileSize: "File Size",
    debugFps: "FPS",
    debugCoordinates: "Coordinates",
    debugSave: "Save World",
    debugSaveBackup: "Save Backup",
};

const GAMEPLAY_ACTIONS = [
    "attack",
    "pickBlock",
    "place",
    "moveUp",
    "moveDown",
    "moveLeft",
    "moveRight",
    "jump",
    "sprint",
    "use",
    "drop",
    "hotbarUp",
    "hotbarDown",
    "hotbar1",
    "hotbar2",
    "hotbar3",
    "hotbar4",
    "hotbar5",
    "hotbar6",
    "hotbar7",
    "hotbar8",
    "hotbar9",
    "chatOpen",
    "chatCommand",
];

const DEBUG_ACTIONS = [
    "debugChunkBorders",
    "debugCamera",
    "debugHitbox",
    "debugPrintBlock",
    "debugFileSize",
    "debugFps",
    "debugCoordinates",
    "debugSave",
    "debugSaveBackup",
];

const REBINDABLE_ACTIONS = [...GAMEPLAY_ACTIONS, ...DEBUG_ACTIONS];

const KEY_DISPLAY_NAMES = {
    Mouse0: "Left Click",
    Mouse1: "Middle Click",
    Mouse2: "Right Click",
    ScrollUp: "Scroll Up",
    ScrollDown: "Scroll Down",
    KeyA: "A",
    KeyB: "B",
    KeyC: "C",
    KeyD: "D",
    KeyE: "E",
    KeyF: "F",
    KeyG: "G",
    KeyH: "H",
    KeyI: "I",
    KeyJ: "J",
    KeyK: "K",
    KeyL: "L",
    KeyM: "M",
    KeyN: "N",
    KeyO: "O",
    KeyP: "P",
    KeyQ: "Q",
    KeyR: "R",
    KeyS: "S",
    KeyT: "T",
    KeyU: "U",
    KeyV: "V",
    KeyW: "W",
    KeyX: "X",
    KeyY: "Y",
    KeyZ: "Z",
    Digit0: "0",
    Digit1: "1",
    Digit2: "2",
    Digit3: "3",
    Digit4: "4",
    Digit5: "5",
    Digit6: "6",
    Digit7: "7",
    Digit8: "8",
    Digit9: "9",
    Space: "Space",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Escape: "Escape",
    Enter: "Enter",
    ShiftLeft: "Left Shift",
    ShiftRight: "Right Shift",
    ControlLeft: "Left Ctrl",
    ControlRight: "Right Ctrl",
    AltLeft: "Left Alt",
    AltRight: "Right Alt",
    Tab: "Tab",
    Backspace: "Backspace",
    Minus: "-",
    Equal: "=",
    Backquote: "`",
    Slash: "/",
    Backslash: "\\",
    Period: ".",
    Delete: "Delete",
};

function getKeyDisplayName(keyCode) {
    return KEY_DISPLAY_NAMES[keyCode] || keyCode;
}

function getActionLabel(action) {
    return ACTION_LABELS[action] || action;
}

function loadKeyBindings() {
    try {
        
        const raw = localStorage.getItem("keyBindings");
        if (!raw) return { ...DEFAULT_KEY_BINDINGS };
        const parsed = JSON.parse(raw);
        const out = { ...DEFAULT_KEY_BINDINGS };
        for (const action of Object.keys(DEFAULT_KEY_BINDINGS)) {
            if (Array.isArray(parsed[action])) {
                out[action] = parsed[action];
            }
        }
        return out;
    } catch (e) {
        return { ...DEFAULT_KEY_BINDINGS };
    }
}

function saveKeyBindings(bindings) {
    const out = { ...bindings };
    out.pause = ["Escape"];
    localStorage.setItem("keyBindings", JSON.stringify(out));
}
