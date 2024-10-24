const CANVAS = document.getElementById("canvas");
const ctx = CANVAS.getContext("2d");

CANVAS.width = 1500;
CANVAS.height = 800;
ctx.imageSmoothingEnabled = false;

let drawingChunkBorders = true;

const camera = new Camera(0, 0);

function DrawBackground() {
    ctx.fillStyle = "aqua";

    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
}

function Draw() {
    DrawBackground();

    ctx.fillStyle = "black";
    ctx.fillRect(CANVAS.width/2, CANVAS.height/2, 10, 10);
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

function DrawChunk(chunk) {
    DrawBlocks(chunk.walls, chunk.x);
    DrawBlocks(chunk.blocks, chunk.x);

    if(drawingChunkBorders)
        DrawChunkLine(chunk);
}

function DrawChunkLine(chunk) {
    const chunkX = chunk.x;
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(chunkX - camera.x, 0);
    ctx.lineTo(chunkX - camera.x, CHUNK_HEIGHT * BLOCK_SIZE);
    ctx.stroke();

    const index = chunk.x / CHUNK_WIDTH / BLOCK_SIZE;

    // Draw Text for chunk Index
    ctx.fillStyle = "black";
    ctx.font = "20px Pixel";
    const txt = `${index} - ${chunk.biome.name}\nTemp: ${Math.round(worldTemperatureNoiseMap.getNoise(index))}`;
    var lines = txt.split('\n');

    for (var i = 0; i < lines.length; i++)
        ctx.fillText(lines[i], chunkX - camera.x + 10, 20 + i*20, 9999);
}

function DrawBlocks(blocks, xOffset) {
    for (let i = 0; i < blocks.length; i++) {
        for (let j = 0; j < blocks[i].length; j++) {
            // Get the block at position [i][j]
            const block = blocks[i][j];

            // j corresponds to the x position (horizontal)
            const worldX = j * BLOCK_SIZE;  // Use j for x (horizontal)

            // i corresponds to the y position (vertical)
            const worldY = i * BLOCK_SIZE;  // Use i for y (vertical)

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