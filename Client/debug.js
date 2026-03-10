setInterval(() => {
    updateDebug();
}, 1000 / 144);
function updateDebug() {
    HandleDebugging();
    CameraLogic();
}

function HandleDebugging() {
    if (drawDebugMouseBlock) PrintBlockLogic();
}

function handleDebugInput() {
    if (player && !player.canMove) return; // e.g. pause menu open
    if (input.isKeyPressed("KeyB")) toggleChunkBorders();
    if (input.isKeyPressed("KeyN")) toggleCamera();
    if (input.isKeyPressed("KeyH")) toggleHitbox();
    if (input.isKeyPressed("KeyM")) togglePrintBlock();
    if (input.isKeyPressed("KeyF")) toggleFileSize();
    if (input.isKeyPressed("KeyI")) toggleFps();
    if (input.isKeyPressed("KeyC")) toggleCoordinates();
    if (input.isKeyPressed("KeyO") && typeof SaveWorld === "function") SaveWorld();
    if (input.isKeyPressed("KeyP") && typeof SaveWorld === "function") SaveWorld(false, true);
}

function updateDebugButtonLabels() {
    const set = (id, label, on) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${label} - ${on ? "ON" : "OFF"}`;
    };
    set("debug-chunk-borders", "Chunk Borders", drawingChunkBorders);
    set("debug-camera", "Camera", drawCamera);
    set("debug-hitbox", "Hitbox", drawHitbox);
    set("debug-print-block", "Print Block", drawDebugMouseBlock);
    set("debug-file-size", "File Size", drawFileSize);
    set("debug-fps", "FPS", drawFps);
    set("debug-coords", "Coords", drawCoordinates);
}

function toggleChunkBorders() {
    drawingChunkBorders = !drawingChunkBorders;
    updateDebugButtonLabels();
}
function toggleCamera() {
    drawCamera = !drawCamera;
    updateDebugButtonLabels();
}
function toggleHitbox() {
    drawHitbox = !drawHitbox;
    updateDebugButtonLabels();
}
function togglePrintBlock() {
    drawDebugMouseBlock = !drawDebugMouseBlock;
    updateDebugButtonLabels();
}
function toggleFileSize() {
    drawFileSize = !drawFileSize;
    updateDebugButtonLabels();
}
function toggleFps() {
    drawFps = !drawFps;
    updateDebugButtonLabels();
}
function toggleCoordinates() {
    drawCoordinates = !drawCoordinates;
    updateDebugButtonLabels();
}

function PrintBlockLogic() {
    if (input.isLeftMouseDown() || input.isRightMouseDown()) {
        const mousePos = input.getMousePositionOnBlockGrid();
        const block = GetBlockAtWorldPosition(mousePos.x, mousePos.y);

        chat.message(
            `${GetBlock(block.blockType).name} at ${mousePos.x}, ${
                mousePos.y
            } ${
                block.metaData && block.metaData.props
                    ? "metadata: " + JSON.stringify(block.metaData.props)
                    : ""
            }`
        );

        console.log(mousePos.x + " - " + mousePos.y);
        console.log(block);

        // block.setBlockType(Blocks.OakLog);
    }
}

function CameraLogic() {
    if (player) return;

    const maxSpeed = 15;
    const acceleration = 1;
    const deceleration = 1;

    // Horizontal movement (A/D keys)
    if (input.isKeyDown("KeyA"))
        camera.velocity.x = Math.max(
            camera.velocity.x - acceleration,
            -maxSpeed
        );
    if (input.isKeyDown("KeyD"))
        camera.velocity.x = Math.min(
            camera.velocity.x + acceleration,
            maxSpeed
        );

    // Vertical movement (W/S keys)
    if (input.isKeyDown("KeyW"))
        camera.velocity.y = Math.max(
            camera.velocity.y - acceleration,
            -maxSpeed
        );
    if (input.isKeyDown("KeyS"))
        camera.velocity.y = Math.min(
            camera.velocity.y + acceleration,
            maxSpeed
        );

    // Decelerate smoothly when no input
    if (!input.isKeyDown("KeyA") && !input.isKeyDown("KeyD"))
        camera.velocity.x += -Math.sign(camera.velocity.x) * deceleration;
    if (!input.isKeyDown("KeyW") && !input.isKeyDown("KeyS"))
        camera.velocity.y += -Math.sign(camera.velocity.y) * deceleration;

    // Ensure velocity stops at zero
    if (Math.abs(camera.velocity.x) < deceleration) camera.velocity.x = 0;
    if (Math.abs(camera.velocity.y) < deceleration) camera.velocity.y = 0;

    // Update camera position based on velocity
    camera.update();
}
