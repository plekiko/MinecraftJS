const CANVAS = document.getElementById("canvas");
const ctx = CANVAS.getContext("2d");

var r = document.querySelector(":root");

CANVAS.width = 1600;
CANVAS.height = 900;
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

let drawingChunkBorders = false;
let drawCamera = false;
let drawHeight = false;
let drawDebugMouseBlock = false;
let drawFileSize = false;
let drawFps = true;
let drawHitbox = false;
let drawCoordinates = true;

let cursorInRange = false;

let hotbar = null;

let fps;

const camera = new Camera(0, CHUNK_HEIGHT * 2);

r.style.setProperty("--drawMouse", "none");

function DrawBackground() {
    // Calculate the color stops based on time
    const dayColor = "#74B3FF"; // Daytime top color (light blue)
    const nightColor = "#000000"; // Nighttime top color (dark blue)
    const sunsetColor = "#D47147"; // Sunset bottom color
    const midnightColor = "#001848"; // Midnight bottom color

    const topColor = interpolateColor(
        nightColor,
        dayColor,
        Math.sin(time) * 0.5 + 0.5
    );
    const bottomColor = interpolateColor(
        midnightColor,
        sunsetColor,
        Math.sin(time) * 0.5 + 0.5
    );

    const gradient = ctx.createLinearGradient(0, CANVAS.height, 0, 0);
    gradient.addColorStop(0, bottomColor); // Bottom color
    gradient.addColorStop(1, topColor); // Top color

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
}

function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

function mouseOverPosition(x, y, sizeX, sizeY, world = false) {
    const mousePos = !world
        ? input.getMousePosition()
        : input.getMouseWorldPosition();

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
    if (player) {
        DrawBreakAndPlaceCursor(cursorInRange);
        DrawDestroyStage();
    }

    DrawEntities();
    AfterDraw();
}

function DrawEntities() {
    entities.forEach((entity) => {
        if (
            Math.abs(
                Vector2.XDistance(
                    new Vector2(camera.getWorldX(camera.x), 0),
                    entity.position
                )
            ) <=
            RENDER_DISTANCE * 2 * BLOCK_SIZE * CHUNK_WIDTH
        ) {
            entity.draw(ctx, camera);
        } else {
            if (entity.despawn) {
                const chunk = chunks.get(entity.myChunkX);
                if (chunk) chunk.removeEntityFromChunk(entity);

                removeEntity(entity);
            }
        }
    });

    if (drawHitbox) drawHitboxes();
}

function DrawBreakAndPlaceCursor(inRange = false) {
    const mouseX = input.getMousePositionOnBlockGrid().x;
    const mouseY = input.getMousePositionOnBlockGrid().y;

    const selectedBlock = player.inventory.selectedBlock;

    if (selectedBlock) {
        drawImage({
            url: "Assets/sprites/blocks/" + selectedBlock.sprite + ".png",
            x: mouseX - Math.floor(camera.x),
            y: mouseY - Math.floor(camera.y),
            scale: BLOCK_SIZE / 16,
            centerX: false,
            opacity: 0.5,
        });
    }

    ctx.strokeStyle = inRange ? "black" : "red";
    ctx.lineWidth = 1;

    ctx.strokeRect(
        mouseX - Math.floor(camera.x),
        mouseY - Math.floor(camera.y),
        BLOCK_SIZE,
        BLOCK_SIZE
    );
}

function DrawChunks(chunksMap) {
    const currentChunkX = camera.getCurrentChunkIndex(); // Get the x position of the current chunk

    chunks_in_render_distance.clear();

    for (let i = -RENDER_DISTANCE; i <= RENDER_DISTANCE; i++) {
        const chunkX = (currentChunkX + i) * CHUNK_WIDTH * BLOCK_SIZE; // Calculate the x position of the chunk to render
        // console.log(chunkX + " is " + chunksMap.has(chunkX));

        if (chunksMap.has(chunkX)) {
            chunks_in_render_distance.set(chunkX, chunksMap.get(chunkX));

            const chunk = chunksMap.get(chunkX);

            chunk.draw(ctx, camera);
            DrawLate(chunk);
        }
    }
}

function DrawCoordinates() {
    if (!player) return;
    drawText({
        text: `x: ${
            Math.round((player.position.x / BLOCK_SIZE) * 100) / 100
        } y: ${
            Math.round(ReverseY(player.position.y / BLOCK_SIZE) * 100) / 100
        }`,
        x: 5,
        y: 20,
        size: 20,
        shadow: false,
        textAlign: "left",
        color: "black",
    });
}

function DrawCamera() {
    ctx.fillStyle = "white";
    ctx.fillRect(CANVAS.width / 2 - 2, CANVAS.height / 2 - 2, 14, 14);
    ctx.fillStyle = "black";
    ctx.fillRect(CANVAS.width / 2, CANVAS.height / 2, 10, 10);
}

function DrawLate(chunk) {
    if (drawingChunkBorders) DrawChunkLine(chunk);
    if (drawHeight) DrawHeight();
}

function AfterDraw() {
    if (player) {
        DrawUI();
        DrawCursor();
        if (drawCoordinates) DrawCoordinates();
    }
    if (drawCamera) DrawCamera();
    if (drawDebugMouseBlock) DrawDebugMouseBlock();
    if (drawFileSize) DrawExpectedFileSize();
    if (drawFps) DrawFps();
}

function DrawUI() {
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

    const mouseX = input.getMousePositionOnBlockGrid().x;
    const mouseY = input.getMousePositionOnBlockGrid().y;

    drawImage({
        url:
            "Assets/sprites/blocks/destroy_stage_" +
            (player.breakingStage - 1) +
            ".png",
        x: mouseX - Math.floor(camera.x),
        y: mouseY - Math.floor(camera.y),
        scale: BLOCK_SIZE / 16,
        centerX: false,
    });
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
        drawImage({
            url: "Assets/sprites/misc/cursor.png",
            x: input.getMousePosition().x,
            y: input.getMousePosition().y,
            centerX: false,
        });
        return;
    }

    drawImage({
        url: "Assets/sprites/misc/crosshair.png",
        x: input.getMousePosition().x,
        y: input.getMousePosition().y,
        scale: 3,
        centerY: true,
    });
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

function DrawDebugMouseBlock() {
    r.style.setProperty("--drawMouse", "none");

    const mouseX = input.getMousePositionOnBlockGrid().x;
    const mouseY = input.getMousePositionOnBlockGrid().y;

    const topLeftX = mouseX;
    const topLeftY = mouseY;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;

    // Draw the hollow square
    ctx.strokeRect(
        topLeftX - Math.floor(camera.x),
        topLeftY - Math.floor(camera.y),
        BLOCK_SIZE,
        BLOCK_SIZE
    );

    ctx.lineWidth = 1;
}

function DrawHotbar() {
    if (!hotbar) return;

    hotbar.draw(ctx);
}

function drawText({
    text,
    x,
    y,
    size = 25,
    shadow = true,
    textAlign = "right",
    color = "white",
}) {
    ctx.textAlign = textAlign;

    if (shadow) {
        ctx.fillStyle = "rgb(0, 0, 0, .7)";
        ctx.font = size + "px Pixel";

        ctx.fillText(text, x + 3, y + 3);
    }

    ctx.fillStyle = color;
    ctx.font = size + "px Pixel";

    ctx.fillText(text, x, y);
}

function drawHitboxes() {
    entities.forEach((entity) => {
        entity.drawHitbox(ctx);
    });
}

function drawImage({
    url,
    x = 0,
    y = 0,
    scale = 1,
    centerX = true,
    centerY = false,
    opacity = 1,
    sizeY = null,
    sizeX = null,
    dark = false,
}) {
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

    if (dark) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "black";
        ctx.fillRect(
            centerX ? x - drawWidth / 2 : x,
            centerY
                ? y -
                      drawHeight / 2 +
                      (sizeY ? (img.height - sizeY) * scale : 0)
                : y + (sizeY ? (img.height - sizeY) * scale : 0),
            drawWidth,
            drawHeight
        );
    }

    ctx.globalAlpha = 1;

    return {
        x: centerX ? x - (sourceWidth / 2) * scale : x,
        y: centerY ? y - (sourceWidth / 2) * scale : y,
        sizeX: drawWidth,
        sizeY: drawHeight,
    };
}
