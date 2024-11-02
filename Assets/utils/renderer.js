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

function Draw(chunks, frames) {
    fps = frames;

    DrawBackground();
    DrawChunks(chunks);
    DrawEntities();
    AfterDraw();
}

function DrawEntities() {
    entities.forEach((entity) => {
        entity.draw(ctx, camera);
    });
}

function DrawBreakAndPlaceCursor(inRange = false) {
    const mouseX = input.getMousePositionOnBlockGrid().x;
    const mouseY = input.getMousePositionOnBlockGrid().y;

    const topLeftX = mouseX;
    const topLeftY = mouseY;

    ctx.strokeStyle = inRange ? "black" : "red";
    ctx.lineWidth = 1;

    ctx.strokeRect(topLeftX, topLeftY, BLOCK_SIZE, BLOCK_SIZE);
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
        if (player.windowOpen) DrawCursor();
    }
}

function DrawUI() {
    DrawBreakAndPlaceCursor(cursorInRange);
    DrawDestroyStage();
    DrawHotbar();
    DrawInventory();
    DrawInventoryHoldItem();
    DrawInventoryHoverTitle();
    chat.draw(ctx);
}

function DrawInventory() {
    if (!player.windowOpen) return;

    // Black Background
    ctx.fillStyle = "rgb(0, 0, 0, .6)";
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    const inventoryUI = drawImage(
        "Assets/sprites/gui/inventory.png",
        CANVAS.width / 2,
        CANVAS.height / 6,
        3.5
    );

    DrawInventoryItems(inventoryUI);
}

function DrawInventoryItems(inventoryUI) {
    for (let y = 0; y < player.inventory.items.length; y++) {
        for (let x = 0; x < player.inventory.items[y].length; x++) {
            DrawInventorySlot(player.inventory.items[y][x]);
        }
    }

    DrawCraftingSlots(inventoryUI);
}

function DrawCraftingSlots(inventoryUI) {
    for (let y = 0; y < player.inventory.craftingSlots.length; y++) {
        for (let x = 0; x < player.inventory.craftingSlots[y].length; x++) {
            DrawInventorySlot(player.inventory.craftingSlots[y][x]);
        }
    }

    // Draw Output
    const outputSlot = player.inventory.craftingOutputSlot;
    DrawInventorySlot(outputSlot);
}

function DrawInventorySlot(slot) {
    const item = slot.item;

    if (item.count <= 0) return;
    if (!item.blockId && item.itemId === null) return;

    const slotX = slot.position.x;
    const slotY = slot.position.y;

    const spritePath =
        "Assets/sprites/" +
        (item.blockId
            ? "blocks/" + GetBlock(item.blockId).sprite
            : "items/" + GetItem(item.itemId).sprite) +
        ".png";

    // Draw the sprite
    drawImage(spritePath, slotX, slotY, 3, false);

    if (item.count <= 1) return;

    // Draw the count
    drawText(item.count, slotX + 55, slotY + 50, 30);
}

function DrawDestroyStage() {
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

function DrawInventoryHoldItem() {
    if (!player.windowOpen) return;
    const holdingItem = player.inventory.holdingItem;
    if (!holdingItem) return;
    const mousePos = input.getMousePosition();

    let image = null;

    const spritePath =
        "Assets/sprites/" +
        (holdingItem.blockId
            ? "blocks/" + GetBlock(holdingItem.blockId).sprite
            : "items/" + GetItem(holdingItem.itemId).sprite) +
        ".png";

    image = drawImage(spritePath, mousePos.x, mousePos.y, 2.5, false);

    if (holdingItem.count <= 1) return;

    drawText(
        holdingItem.count,
        image.x + image.sizeX + 5,
        image.y + image.sizeY + 3
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
    drawImage(
        "Assets/sprites/misc/cursor.png",
        input.getMousePosition().x,
        input.getMousePosition().y,
        1,
        false
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

function DrawInventoryHoverTitle() {
    if (!player.windowOpen) return;
    if (!player.inventory.hoverItem) return;
    if (
        !player.inventory.hoverItem.blockId &&
        player.inventory.hoverItem.itemId == null
    )
        return;

    const mousePos = input.getMousePosition();

    const hoverInventoryItem = player.inventory.hoverItem;

    let title = hoverInventoryItem.blockId
        ? GetBlock(hoverInventoryItem.blockId).name
        : GetItem(hoverInventoryItem.itemId).name;

    drawText(title, mousePos.x + 20, mousePos.y - 5, 25, true, "left");
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

function drawImage(url, x = 0, y = 0, scale = 1, center = true) {
    img = new Image();
    img.src = url;
    ctx.drawImage(
        img,
        center ? x - (img.width / 2) * scale : x,
        y,
        img.width * scale,
        img.height * scale
    );

    return {
        x: center ? x - (img.width / 2) * scale : x,
        y: y,
        sizeX: img.width * scale,
        sizeY: img.height * scale,
    };
}
