const panel = document.querySelector(".help-container");

setInterval(() => {
    updateDebug();
}, 1000 / 60);

function updateDebug() {
    HandleInput();
    HandleDebugging();
    CameraLogic();
}

function HandleDebugging() {
    if (drawDebugMouseBlock) PrintBlockLogic();
}

function HandleInput() {
    if (player && !player.canMove) return;
    if (input.isKeyPressed("KeyB")) drawingChunkBorders = !drawingChunkBorders;
    if (input.isKeyPressed("KeyN")) drawCamera = !drawCamera;
    if (input.isKeyPressed("KeyH")) drawHitbox = !drawHitbox;
    if (input.isKeyPressed("KeyM")) drawDebugMouseBlock = !drawDebugMouseBlock;
    if (input.isKeyPressed("KeyF")) drawFileSize = !drawFileSize;
    if (input.isKeyPressed("KeyI")) drawFps = !drawFps;
    if (input.isKeyPressed("KeyC")) drawCoordinates = !drawCoordinates;
    if (input.isKeyPressed("KeyO")) SaveWorld();
    if (input.isKeyPressed("KeyP")) LoadWorld();
    if (input.isKeyPressed("KeyZ"))
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
    // if (input.isKeyPressed("KeyR")) RegenerateWorld();
}

function PrintBlockLogic() {
    if (input.isLeftMouseDown()) {
        const mousePos = input.getMousePositionOnBlockGrid();
        const block = GetBlockAtWorldPosition(mousePos.x, mousePos.y);

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
