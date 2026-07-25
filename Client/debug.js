import { runtime } from "./Assets/utils/runtime.js";
import { input } from "./Assets/utils/input.js";
import { camera } from "./Assets/utils/renderer.js";
import { getBlock } from "./Assets/world/block.js";
import { saveWorld } from "./Assets/world/saving.js";

export function updateDebug() {
    if (!runtime.world) return;
    if (!runtime.game) return;

    handleDebugging();
    cameraLogic();
}

export function handleDebugging() {
    if (runtime.drawDebugMouseBlockOverlay) printBlockLogic();
}

export function handleDebugInput() {
    if (runtime.world.player && !runtime.world.player.canMove) return; // e.g. pause menu open
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

export function updateDebugButtonLabels() {
    const set = (id, label, on) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${label} - ${on ? "ON" : "OFF"}`;
    };
    set("debug-chunk-borders", "Chunk Borders", runtime.drawingChunkBorders);
    set("debug-camera", "Camera", runtime.drawCameraOverlay);
    set("debug-hitbox", "Hitbox", runtime.drawHitbox);
    set("debug-print-block", "Print Block", runtime.drawDebugMouseBlockOverlay);
    set("debug-file-size", "File Size", runtime.drawFileSizeOverlay);
    set("debug-fps", "FPS", runtime.drawFpsOverlay);
    set("debug-coords", "Coords", runtime.drawCoordinatesOverlay);
}

export function toggleChunkBorders() {
    runtime.drawingChunkBorders = !runtime.drawingChunkBorders;
    updateDebugButtonLabels();
}
export function toggleCamera() {
    runtime.drawCameraOverlay = !runtime.drawCameraOverlay;
    updateDebugButtonLabels();
}
export function toggleHitbox() {
    runtime.drawHitbox = !runtime.drawHitbox;
    updateDebugButtonLabels();
}
export function togglePrintBlock() {
    runtime.drawDebugMouseBlockOverlay = !runtime.drawDebugMouseBlockOverlay;
    updateDebugButtonLabels();
}
export function toggleFileSize() {
    runtime.drawFileSizeOverlay = !runtime.drawFileSizeOverlay;
    updateDebugButtonLabels();
}
export function toggleFps() {
    runtime.drawFpsOverlay = !runtime.drawFpsOverlay;
    updateDebugButtonLabels();
}
export function toggleCoordinates() {
    runtime.drawCoordinatesOverlay = !runtime.drawCoordinatesOverlay;
    updateDebugButtonLabels();
}

export function printBlockLogic() {
    if (input.isActionDown("attack") || input.isActionDown("place")) {
        const mousePos = input.getMousePositionOnBlockGrid();
        const block = runtime.world.getBlockAtWorldPosition(mousePos.x, mousePos.y);

        runtime.game.chat.message(
            `${getBlock(block.blockType).name} at ${mousePos.x}, ${
                mousePos.y
            } ${
                block.metaData
                    ? "metadata: " + JSON.stringify(block.metaData)
                    : ""
            }`,
        );

        console.log(mousePos.x + " - " + mousePos.y);
        console.log(block);

        // block.setBlockType(Blocks.OakLog);
    }
}

export function cameraLogic() {
    if (runtime.world?.player) return;

    const maxSpeed = 15;
    const acceleration = 1;
    const deceleration = 1;

    // Horizontal movement (A/D keys)
    if (input.isActionDown("moveLeft"))
        camera.velocity.x = Math.max(
            camera.velocity.x - acceleration,
            -maxSpeed,
        );
    if (input.isActionDown("moveRight"))
        camera.velocity.x = Math.min(
            camera.velocity.x + acceleration,
            maxSpeed,
        );

    // Vertical movement (W/S keys)
    if (input.isActionDown("moveUp"))
        camera.velocity.y = Math.max(
            camera.velocity.y - acceleration,
            -maxSpeed,
        );
    if (input.isActionDown("moveDown"))
        camera.velocity.y = Math.min(
            camera.velocity.y + acceleration,
            maxSpeed,
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
