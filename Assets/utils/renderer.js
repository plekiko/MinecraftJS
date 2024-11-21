const CANVAS = document.getElementById("canvas");
const ctx = CANVAS.getContext("2d");

var r = document.querySelector(":root");

CANVAS.width = 1600;
CANVAS.height = 900;
ctx.imageSmoothingEnabled = false;

let drawingChunkBorders = false;
let drawCamera = false;
let drawHeight = false;
let drawDebugMouseBlock = false;
let drawFileSize = false;
let drawFps = true;
let drawHitbox = false;

let cursorInRange = false;

let hotbar = null;

let fps;

const camera = new Camera(0, CHUNK_HEIGHT * 2);

r.style.setProperty("--drawMouse", "none");

function DrawBackground() {
    const gradient = ctx.createLinearGradient(0, CANVAS.height, 0, 0); // Bottom to top gradient
    gradient.addColorStop(0, "#D47147"); // Bottom color
    gradient.addColorStop(1, "#74B3FF"); // Top color

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
}

function mouseOverPosition(x, y, sizeX, sizeY) {
    const mousePos = input.getMousePosition();
    return (
        mousePos.x >= x &&
        mousePos.x <= x + sizeX &&
        mousePos.y >= y &&
        mousePos.y <= y + sizeY
    );
}

function isColliding(pos1, size1, pos2, size2) {
    return (
        pos1.x < pos2.x + size2.x &&
        pos1.x + size1.x > pos2.x &&
        pos1.y < pos2.y + size2.y &&
        pos1.y + size1.y > pos2.y
    );
}

function Draw(chunks, frames) {
    fps = frames;

    DrawBackground();
    DrawChunks(chunks);
    DrawDestroyStage();
    DrawEntities();
    AfterDraw();
}

function DrawEntities() {
    entities.forEach((entity) => {
        entity.draw(ctx, camera);
    });

    if (drawHitbox) drawHitboxes();
}

function DrawBreakAndPlaceCursor(inRange = false) {
    const mouseX = input.getMousePositionOnBlockGrid().x;
    const mouseY = input.getMousePositionOnBlockGrid().y;

    ctx.strokeStyle = inRange ? "black" : "red";
    ctx.lineWidth = 1;

    ctx.strokeRect(mouseX, mouseY, BLOCK_SIZE, BLOCK_SIZE);

    if (player.inventory.selectedBlock) {
        drawImage(
            "Assets/sprites/blocks/" +
                player.inventory.selectedBlock.sprite +
                ".png",
            mouseX,
            mouseY,
            BLOCK_SIZE / 16,
            false,
            false,
            0.5
        );
    }
}

function DrawChunks(chunksMap) {
    const currentChunkX = camera.getCurrentChunkIndex(); // Get the x position of the current chunk

    for (let i = -RENDER_DISTANCE; i <= RENDER_DISTANCE; i++) {
        const chunkX = (currentChunkX + i) * CHUNK_WIDTH * BLOCK_SIZE; // Calculate the x position of the chunk to render
        // console.log(chunkX + " is " + chunksMap.has(chunkX));

        if (chunksMap.has(chunkX)) {
            const chunk = chunksMap.get(chunkX); // Retrieve the chunk from the Map using its x position
            DrawChunk(chunk, chunkX); // Draw the chunk
        }
    }
}

function DrawCamera() {
    ctx.fillStyle = "white";
    ctx.fillRect(CANVAS.width / 2 - 2, CANVAS.height / 2 - 2, 14, 14);
    ctx.fillStyle = "black";
    ctx.fillRect(CANVAS.width / 2, CANVAS.height / 2, 10, 10);
}

function DrawChunk(chunk) {
    DrawBlocks(chunk.walls, chunk.x);
    DrawBlocks(chunk.blocks, chunk.x);

    DrawLate(chunk);
}

function DrawLate(chunk) {
    if (drawingChunkBorders) DrawChunkLine(chunk);
    if (drawCamera) DrawCamera();
    if (drawHeight) DrawHeight();
    if (drawDebugMouseBlock) DrawDebugMouseBlock();
    if (drawFileSize) DrawExpectedFileSize();
    if (drawFps) DrawFps();
}

function AfterDraw() {
    if (player) {
        DrawUI();
        DrawCursor();
    }
}

function DrawUI() {
    DrawBreakAndPlaceCursor(cursorInRange);

    DrawHotbar();
    DrawInventory();
    chat.draw(ctx);
}

function DrawInventory() {
    if (!player.windowOpen) return;

    player.inventory.draw(ctx);
}

function DrawDestroyStage() {
    if (!player) return;
    if (player.breakingStage == 0 || player.breakingStage > 10) return;

    drawImage(
        "Assets/sprites/blocks/destroy_stage_" +
            (player.breakingStage - 1) +
            ".png",
        input.getMousePositionOnBlockGrid().x,
        input.getMousePositionOnBlockGrid().y,
        BLOCK_SIZE / 16,
        false
    );
}

function DrawChunkLine(chunk) {
    const chunkX = chunk.x;
    ctx.strokeStyle = "red";
    ctx.beginPath();

    ctx.moveTo(0, 0 - camera.y);
    ctx.lineTo(CANVAS.width, 0 - camera.y);

    ctx.moveTo(chunkX - camera.x, 0);
    ctx.lineTo(chunkX - camera.x, CANVAS.height);

    ctx.stroke();

    DrawChunkStats(chunk, chunkX);
}

function DrawCursor() {
    if (!player) return;

    if (player.windowOpen) {
        drawImage(
            "Assets/sprites/misc/cursor.png",
            input.getMousePosition().x,
            input.getMousePosition().y,
            1,
            false
        );
        return;
    }

    drawImage(
        "Assets/sprites/misc/crosshair.png",
        input.getMousePosition().x,
        input.getMousePosition().y,
        3,
        true,
        true
    );
}

function mouseOverPosition(x, y, sizeX, sizeY) {
    const mousePos = input.getMousePosition();

    const isOver =
        mousePos.x >= x &&
        mousePos.x <= x + sizeX &&
        mousePos.y >= y &&
        mousePos.y <= y + sizeY;

    return isOver;
}

function DrawFps() {
    ctx.fillStyle = "black";
    ctx.font = "20px Pixel";
    ctx.textAlign = "right";

    ctx.fillText(fps, CANVAS.width - 10, CANVAS.height - 10);
}

function DrawChunkStats(chunk, chunkX) {
    ctx.textAlign = "left";
    const index = chunk.x / CHUNK_WIDTH / BLOCK_SIZE;

    ctx.fillStyle = "black";
    ctx.font = "15px Pixel";

    // Base text with biome details
    let txt = `${index} - ${chunk.biome.name}\nTemp: ${Math.floor(
        worldTemperatureNoiseMap.getNoise(index, 20000)
    )}\nWetness: ${Math.floor(
        worldWetnessNoiseMap.getNoise(index, 10000)
    )}\nMountains: ${Math.floor(
        worldMountainsNoiseMap.getNoise(index, 30000)
    )}\nHeight: ${chunk.biome.heightNoise.scale * 1000} - ${
        chunk.biome.heightNoise.intensity
    }`;

    // Append "Next to" information only if previousBiome is different
    if (
        chunk.previousChunk &&
        chunk.previousChunk.biome.name !== chunk.biome.name
    ) {
        txt += `\nNext to: ${chunk.previousChunk.biome.name}`;
    }

    // Split text by lines for rendering
    const lines = txt.split("\n");

    // Render each line of text
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], chunkX - camera.x + 10, 15 + i * 15, 9999);
    }
}

function DrawExpectedFileSize() {
    ctx.fillStyle = "black";
    ctx.font = "15px Pixel";
    ctx.textAlign = "left";

    ctx.fillText(
        "File size: " + (chunks.size * CHUNK_FILE_SIZE + 5) + "kB",
        10,
        CANVAS.height - 10
    );
}

function DrawHeight() {
    ctx.beginPath();

    // Get the world position at the leftmost visible edge of the screen
    const cameraWorldX =
        camera.getWorldX() - (RENDER_DISTANCE * CHUNK_WIDTH * BLOCK_SIZE) / 2;

    // Extend the range of the loop to draw a longer line (adjust multiplier to increase length)
    const extendedRenderDistance = RENDER_DISTANCE * 2; // Extend by a factor of 2 (or any factor you prefer)

    // Loop through visible blocks plus the extended distance
    for (let x = 0; x < extendedRenderDistance * CHUNK_WIDTH; x++) {
        // Calculate the world X position of the current block
        const worldX = cameraWorldX + x * BLOCK_SIZE;

        // Get the chunk corresponding to this block position
        const chunk = chunks.get(
            Math.floor(worldX / (CHUNK_WIDTH * BLOCK_SIZE)) *
                CHUNK_WIDTH *
                BLOCK_SIZE
        );

        if (!chunk) continue; // Skip if no chunk exists at this position

        // Get the noise height for this block's position
        const noiseHeight = chunk.getHeight(
            (worldX % (CHUNK_WIDTH * BLOCK_SIZE)) / BLOCK_SIZE
        );

        // Calculate the screen Y position based on noise height
        const screenY = CANVAS.height - noiseHeight * BLOCK_SIZE;

        // Calculate the screen X position, adjusted based on camera's position
        const screenX = worldX - camera.getWorldX() + CANVAS.width / 2;

        // Move to the next point on the canvas and draw the line
        if (x === 0) {
            ctx.moveTo(screenX + 10, screenY - TERRAIN_HEIGHT - 100 - camera.y); // Move to the first block's position with offset
        } else {
            ctx.lineTo(screenX + 10, screenY - TERRAIN_HEIGHT - 100 - camera.y); // Draw a line to the next block's height
        }
    }

    // Set line style and stroke the line
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function DrawBlocks(blocks, xOffset) {
    for (let i = 0; i < blocks.length; i++) {
        for (let j = 0; j < blocks[i].length; j++) {
            // Get the block at position [i][j]
            const block = blocks[i][j];

            // j corresponds to the x position (horizontal)
            const worldX = j * BLOCK_SIZE; // Use j for x (horizontal)

            // i corresponds to the y position (vertical)
            const worldY = i * BLOCK_SIZE; // Use i for y (vertical)

            // Draw the block at the calculated 2D position
            DrawBlockAtPosition(block, worldX + xOffset, worldY);
        }
    }
}

function DrawBlockAtPosition(block, x, y) {
    block.transform.position.x = x - camera.x;
    block.transform.position.y = y - camera.y;

    block.draw(ctx);
}

function DrawDebugMouseBlock() {
    r.style.setProperty("--drawMouse", "none");

    const mouseX = input.getMousePositionOnBlockGrid().x;
    const mouseY = input.getMousePositionOnBlockGrid().y;

    const topLeftX = mouseX;
    const topLeftY = mouseY;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    // Draw the hollow square
    ctx.strokeRect(topLeftX, topLeftY, BLOCK_SIZE, BLOCK_SIZE);
}

function DrawHotbar() {
    if (!hotbar) return;

    hotbar.draw(ctx);
}

function drawText(text, x, y, size = 25, shadow = true, textAlign = "right") {
    ctx.textAlign = textAlign;

    if (shadow) {
        ctx.fillStyle = "rgb(0, 0, 0, .7)";
        ctx.font = size + "px Pixel";

        ctx.fillText(text, x + 3, y + 3);
    }

    ctx.fillStyle = "white";
    ctx.font = size + "px Pixel";

    ctx.fillText(text, x, y);
}

function drawHitboxes() {
    entities.forEach((entity) => {
        entity.drawHitbox(ctx);
    });
}

function drawImage(
    url,
    x = 0,
    y = 0,
    scale = 1,
    centerX = true,
    centerY = false,
    opacity = 1,
    sizeY = null,
    sizeX = null
) {
    const img = new Image();
    img.src = url;

    ctx.globalAlpha = opacity;

    // Determine the source width and height for cropping
    const sourceWidth = sizeX !== null ? sizeX : img.width;
    const sourceHeight = sizeY !== null ? sizeY : img.height;

    // Calculate the scaled width and height for drawing
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;

    ctx.drawImage(
        img,
        0, // Start x position in the source image (crop start)
        img.height, // Start y position in the source image (crop start)
        sourceWidth, // Width of the source to draw (crop width)
        -sourceHeight, // Height of the source to draw (crop height)
        centerX ? x - drawWidth / 2 : x, // x position on canvas
        centerY
            ? y - drawHeight / 2 + (sizeY ? (img.height - sizeY) * scale : 0)
            : y + (sizeY ? (img.height - sizeY) * scale : 0), // y position on canvas
        drawWidth, // Width on the canvas (scaled)
        drawHeight // Height on the canvas (scaled)
    );

    ctx.globalAlpha = 1;

    return {
        x: centerX ? x - (sourceWidth / 2) * scale : x,
        y: centerY ? y - (sourceWidth / 2) * scale : y,
        sizeX: drawWidth,
        sizeY: drawHeight,
    };
}
