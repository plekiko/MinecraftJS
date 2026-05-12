function updateDebug() {
    if (!world) return;
    if (!game) return;

    handleDebugging();
    cameraLogic();
}

function handleDebugging() {
    if (drawDebugMouseBlockOverlay) printBlockLogic();
}

function handleDebugInput() {
    if (world.player && !world.player.canMove) return; // e.g. pause menu open
    if (input.isActionPressed("debugChunkBorders")) toggleChunkBorders();
    if (input.isActionPressed("debugCamera")) toggleCamera();
    if (input.isActionPressed("debugHitbox")) toggleHitbox();
    if (input.isActionPressed("debugPrintBlock")) togglePrintBlock();
    if (input.isActionPressed("debugFileSize")) toggleFileSize();
    if (input.isActionPressed("debugFps")) toggleFps();
    if (input.isActionPressed("debugCoordinates")) toggleCoordinates();
    if (input.isActionPressed("debugSave") && typeof saveWorld === "function")
        saveWorld();
    if (
        input.isActionPressed("debugSaveBackup") &&
        typeof saveWorld === "function"
    )
        saveWorld(false, true);
}

function updateDebugButtonLabels() {
    const set = (id, label, on) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${label} - ${on ? "ON" : "OFF"}`;
    };
    set("debug-chunk-borders", "Chunk Borders", drawingChunkBorders);
    set("debug-camera", "Camera", drawCameraOverlay);
    set("debug-hitbox", "Hitbox", drawHitbox);
    set("debug-print-block", "Print Block", drawDebugMouseBlockOverlay);
    set("debug-file-size", "File Size", drawFileSizeOverlay);
    set("debug-fps", "FPS", drawFpsOverlay);
    set("debug-coords", "Coords", drawCoordinatesOverlay);
}

function toggleChunkBorders() {
    drawingChunkBorders = !drawingChunkBorders;
    updateDebugButtonLabels();
}
function toggleCamera() {
    drawCameraOverlay = !drawCameraOverlay;
    updateDebugButtonLabels();
}
function toggleHitbox() {
    drawHitbox = !drawHitbox;
    updateDebugButtonLabels();
}
function togglePrintBlock() {
    drawDebugMouseBlockOverlay = !drawDebugMouseBlockOverlay;
    updateDebugButtonLabels();
}
function toggleFileSize() {
    drawFileSizeOverlay = !drawFileSizeOverlay;
    updateDebugButtonLabels();
}
function toggleFps() {
    drawFpsOverlay = !drawFpsOverlay;
    updateDebugButtonLabels();
}
function toggleCoordinates() {
    drawCoordinatesOverlay = !drawCoordinatesOverlay;
    updateDebugButtonLabels();
}

function printBlockLogic() {
    if (input.isActionDown("attack") || input.isActionDown("place")) {
        const mousePos = input.getMousePositionOnBlockGrid();
        const block = world.getBlockAtWorldPosition(mousePos.x, mousePos.y);

        game.chat.message(
            `${getBlock(block.blockType).name} at ${mousePos.x}, ${
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

function cameraLogic() {
    if (world?.player) return;

    const maxSpeed = 15;
    const acceleration = 1;
    const deceleration = 1;

    // Horizontal movement (A/D keys)
    if (input.isActionDown("moveLeft"))
        camera.velocity.x = Math.max(
            camera.velocity.x - acceleration,
            -maxSpeed
        );
    if (input.isActionDown("moveRight"))
        camera.velocity.x = Math.min(
            camera.velocity.x + acceleration,
            maxSpeed
        );

    // Vertical movement (W/S keys)
    if (input.isActionDown("moveUp"))
        camera.velocity.y = Math.max(
            camera.velocity.y - acceleration,
            -maxSpeed
        );
    if (input.isActionDown("moveDown"))
        camera.velocity.y = Math.min(
            camera.velocity.y + acceleration,
            maxSpeed
        );

    // Decelerate smoothly when no input
    if (!input.isActionDown("moveLeft") && !input.isActionDown("moveRight"))
        camera.velocity.x += -Math.sign(camera.velocity.x) * deceleration;
    if (!input.isActionDown("moveUp") && !input.isActionDown("moveDown"))
        camera.velocity.y += -Math.sign(camera.velocity.y) * deceleration;

    // Ensure velocity stops at zero
    if (Math.abs(camera.velocity.x) < deceleration) camera.velocity.x = 0;
    if (Math.abs(camera.velocity.y) < deceleration) camera.velocity.y = 0;

    // Update camera position based on velocity
    camera.update();
}
