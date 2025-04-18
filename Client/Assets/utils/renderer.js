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
    const dayColor = getDimension(activeDimension).backgroundGradient.dayColor;
    const nightColor =
        getDimension(activeDimension).backgroundGradient.nightColor;
    const sunsetColor =
        getDimension(activeDimension).backgroundGradient.sunsetColor;
    const midnightColor =
        getDimension(activeDimension).backgroundGradient.midnightColor;

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

    if (!getDimension(activeDimension).alwaysDay) {
        gradient.addColorStop(0, bottomColor); // Bottom color
        gradient.addColorStop(1, topColor); // Top color
    } else {
        gradient.addColorStop(0, sunsetColor);
        gradient.addColorStop(1, dayColor);
    }

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

    if (!isTexturePackLoaded || loadingWorld) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

        ctx.fillStyle = "white";
        ctx.font = "30px Pixel";
        ctx.textAlign = "center";

        if (!isTexturePackLoaded)
            ctx.fillText(
                "Loading texture pack...",
                CANVAS.width / 2,
                CANVAS.height / 2
            );
        else if (loadingWorld)
            ctx.fillText(
                "Loading world...",
                CANVAS.width / 2,
                CANVAS.height / 2
            );
    }
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
                const chunk = getDimensionChunks(activeDimension).get(
                    entity.myChunkX
                );
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
        const spritePath = "blocks/" + selectedBlock.sprite;

        const spriteSize = getSpriteSize(spritePath).width;

        drawImage({
            url: getSpriteUrl(spritePath),
            x: mouseX - Math.floor(camera.x),
            y: mouseY - Math.floor(camera.y),
            scale: BLOCK_SIZE / spriteSize,
            centerX: false,
            opacity: 0.5,
            sizeY: spriteSize - selectedBlock.defaultCutoff * spriteSize,
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

    const spriteSize = getSpriteSize(
        "blocks/destroy_stage_" + (player.breakingStage - 1)
    ).width;

    drawImage({
        url: getSpriteUrl("blocks/destroy_stage_" + (player.breakingStage - 1)),
        x: mouseX - Math.floor(camera.x),
        y: mouseY - Math.floor(camera.y),
        scale: BLOCK_SIZE / spriteSize,
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
            url: getSpriteUrl("misc/cursor"),
            x: input.getMousePosition().x,
            y: input.getMousePosition().y,
            centerX: false,
        });
        return;
    }

    drawImage({
        url: getSpriteUrl("gui/icons"),
        x: input.getMousePosition().x,
        y: input.getMousePosition().y,
        scale: 3,
        centerY: true,
        crop: { x: 3, y: 3, width: 9, height: 9 },
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
        getDimension(activeDimension).noiseMaps.temperature.getNoise(
            index,
            20000
        )
    )}\nWetness: ${Math.floor(
        getDimension(activeDimension).noiseMaps.wetness.getNoise(index, 10000)
    )}\nMountains: ${Math.floor(
        getDimension(activeDimension).noiseMaps.mountains.getNoise(index, 30000)
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

    // Dimension information

    txt += `\nDimension: ${getDimension(chunk.dimension).name}`;

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
        "File size: " +
            (getDimensionChunks(activeDimension).size * CHUNK_FILE_SIZE + 5) +
            "kB",
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
        const chunk = getDimensionChunks(activeDimension).get(
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
    background = null,
}) {
    // if (background) {
    //     ctx.fillStyle = background;

    //     const metrics = ctx.measureText(text);
    //     const textWidth =
    //         metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;

    //     ctx.fillRect(x - 5, y - size + 2, textWidth, size + 5);
    // }

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
    image,
    x = 0,
    y = 0,
    scale = 1,
    centerX = true,
    centerY = false,
    opacity = 1,
    sizeX = null,
    sizeY = null,
    dark = false,
    fixAnimation = false,
    frame = 0,
    crop = { x: 0, y: 0, width: 0, height: 0 },
} = {}) {
    if (!image && !url) return;

    let img = null;
    if (!image) {
        img = new Image();
        img.src = url;
    } else {
        img = image;
    }

    const shouldCrop = crop.width > 0 && crop.height > 0;
    const fullHeight = shouldCrop ? crop.height : img.height; // Full height of the base region

    // Function to handle the actual drawing
    function drawFrame() {
        ctx.globalAlpha = opacity;

        let sourceWidth, sourceHeight, sourceX, sourceY, drawWidth, drawHeight;

        if (fixAnimation) {
            // Fixed 16x16 animation mode
            sourceWidth = shouldCrop ? crop.width : 16; // Default to 16 if no crop
            sourceHeight = shouldCrop ? crop.height : 16; // Default to 16 if no crop
            sourceX = shouldCrop ? crop.x : 0; // No offset if not cropping
            sourceY = (shouldCrop ? crop.y : 0) + frame * 16; // Frame offset always applies
            drawWidth = sourceWidth * scale;
            drawHeight = sourceHeight * scale;
        } else {
            // Behavior with sizeY cropping from top
            sourceWidth =
                sizeX !== null ? sizeX : shouldCrop ? crop.width : img.width;
            sourceHeight =
                sizeY !== null ? Math.min(sizeY, fullHeight) : fullHeight; // Use sizeY, capped at full height
            sourceX = shouldCrop ? crop.x : 0; // Crop X or 0
            sourceY = shouldCrop ? crop.y : 0; // Start from top (crop.y or 0)
            drawWidth = sourceWidth * scale;
            drawHeight = sourceHeight * scale;
        }

        // Adjust position based on centering
        const drawX = centerX ? x - drawWidth / 2 : x;
        const drawY = centerY
            ? y - drawHeight / 2
            : y + (sizeY !== null ? (fullHeight - sourceHeight) * scale : 0); // Offset to align bottom

        // Draw the image
        ctx.drawImage(
            img,
            sourceX, // Source x
            sourceY, // Source y
            sourceWidth, // Source width
            sourceHeight, // Source height
            drawX, // Canvas x
            drawY, // Canvas y
            drawWidth, // Scaled width
            drawHeight // Scaled height
        );

        // Apply dark overlay if specified
        if (dark) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = "black";
            ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
        }

        ctx.globalAlpha = 1;
    }

    // Handle image loading
    if (img.complete) {
        drawFrame(); // Draw immediately if loaded
    } else {
        img.onload = () => {
            drawFrame(); // Draw once loaded
        };
    }

    // Return drawn position and size
    const drawWidthFinal =
        (sizeX !== null ? sizeX : shouldCrop ? crop.width : img.width) * scale;
    const drawHeightFinal =
        (sizeY !== null
            ? Math.min(sizeY, fullHeight)
            : shouldCrop
            ? crop.height
            : img.height) * scale;
    return {
        x: centerX ? x - drawWidthFinal / 2 : x,
        y: centerY ? y - drawHeightFinal / 2 : y,
        sizeX: drawWidthFinal,
        sizeY: drawHeightFinal,
    };
}

function drawRect({
    x,
    y,
    width,
    height,
    color = "black",
    opacity = 1,
    stroke = false,
    lineWidth = 1,
} = {}) {
    ctx.globalAlpha = opacity;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    if (stroke) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, width, height);
    }

    ctx.globalAlpha = 1;
}
