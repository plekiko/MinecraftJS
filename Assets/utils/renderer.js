const CANVAS = document.getElementById("canvas");
const ctx = CANVAS.getContext("2d");

var r = document.querySelector(":root");

CANVAS.width = 1600;
CANVAS.height = 900;
ctx.imageSmoothingEnabled = false;

let drawingChunkBorders = true;
let drawCamera = false;
let drawHeight = false;
let drawDebugMouseBlock = true;

const camera = new Camera(0, 0);

function DrawBackground() {
    ctx.fillStyle = "aqua";

    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
}

function Draw() {
    DrawBackground();
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
    else r.style.setProperty("--drawMouse", "default");
}

function DrawChunkLine(chunk) {
    const chunkX = chunk.x;
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(chunkX - camera.x, 0);
    ctx.lineTo(chunkX - camera.x, CANVAS.height);
    ctx.stroke();

    DrawChunkStats(chunk, chunkX);
}

function DrawChunkStats(chunk, chunkX) {
    const index = chunk.x / CHUNK_WIDTH / BLOCK_SIZE;

    ctx.fillStyle = "black";
    ctx.font = "15px Pixel";
    const txt = `${index} - ${chunk.biome.name}\nTemp: ${Math.floor(
        worldTemperatureNoiseMap.getNoise(index, 2000)
    )}\nWetness: ${Math.floor(worldWetnessNoiseMap.getNoise(index, 1000))}`;
    var lines = txt.split("\n");

    for (var i = 0; i < lines.length; i++)
        ctx.fillText(lines[i], chunkX - camera.x + 10, 15 + i * 15, 9999);
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
            ctx.moveTo(screenX + 10, screenY + 650 - camera.y); // Move to the first block's position with offset
        } else {
            ctx.lineTo(screenX + 10, screenY + 650 - camera.y); // Draw a line to the next block's height
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
