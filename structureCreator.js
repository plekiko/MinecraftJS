// ----- CONFIGURATION -----
const gridRows = 16;
const gridCols = 16;
const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
const cellSize = canvas.width / gridCols;

// The 2D array structure. Each cell holds a block id (or 0 for Air).
let structureGrid = [];
for (let r = 0; r < gridRows; r++) {
    structureGrid[r] = [];
    for (let c = 0; c < gridCols; c++) {
        structureGrid[r][c] = Blocks.Air; // assuming Blocks.Air === 0
    }
}

// The currently selected block from the palette (default: Oak Planks, for example)
let activeBlockId = 34; // change this default as needed

// ----- DRAWING THE GRID -----
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw filled cells using a preview image if available.
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const blockId = structureGrid[r][c];
            if (blockId !== Blocks.Air) {
                const block = GetBlock(blockId);
                if (block && block.sprite) {
                    const img = new Image();
                    img.src = "Assets/sprites/blocks/" + block.sprite + ".png";
                    // Draw image centered in the cell.
                    ctx.drawImage(
                        img,
                        c * cellSize,
                        r * cellSize,
                        cellSize,
                        cellSize
                    );
                } else {
                    // fallback: fill with gray
                    ctx.fillStyle = "#aaa";
                    ctx.fillRect(
                        c * cellSize,
                        r * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    for (let r = 0; r <= gridRows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(canvas.width, r * cellSize);
        ctx.stroke();
    }
    for (let c = 0; c <= gridCols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, canvas.height);
        ctx.stroke();
    }
}

// Initial draw
drawGrid();

// ----- GRID INTERACTION -----
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const col = Math.floor(clickX / cellSize);
    const row = Math.floor(clickY / cellSize);

    // Place the active block in the clicked cell.
    structureGrid[row][col] = activeBlockId;
    drawGrid();
});

// ----- PALETTE (Block Previews) -----
const paletteContainer = document.getElementById("palette");
// Assuming blockTypes is an array of BlockType instances.
blockTypes.forEach((block) => {
    // Skip Air for preview.
    if (block.blockId === Blocks.Air) return;

    const itemDiv = document.createElement("div");
    itemDiv.className = "palette-item";
    if (block.blockId === activeBlockId) itemDiv.classList.add("selected");

    // Create an image element for the sprite.
    const img = document.createElement("img");
    if (block.sprite) {
        img.src = "Assets/sprites/blocks/" + block.sprite + ".png";
    } else {
        // If no sprite, a placeholder.
        img.src = "Assets/sprites/misc/placeholder.png";
    }
    itemDiv.appendChild(img);

    // Add block name label.
    const label = document.createElement("span");
    label.textContent = block.name;
    itemDiv.appendChild(label);

    // When clicked, update the activeBlockId.
    itemDiv.addEventListener("click", () => {
        activeBlockId = block.blockId;
        document
            .querySelectorAll(".palette-item")
            .forEach((el) => el.classList.remove("selected"));
        itemDiv.classList.add("selected");
    });

    paletteContainer.appendChild(itemDiv);
});

// ----- EXPORT FUNCTIONALITY -----

// Export only the bounding box (width and height) that covers the non-Air cells.

document.getElementById("copyBtn").addEventListener("click", () => {
    let outputText = document.getElementById("output").textContent;
    outputText = outputText.replace("{", "").replace("}", "");
    navigator.clipboard
        .writeText(outputText)
        .then(() => {
            alert("Blocks array copied to clipboard!");
        })
        .catch((err) => {
            console.error("Error copying text: ", err);
        });
});

document.getElementById("exportBtn").addEventListener("click", () => {
    let minRow = gridRows,
        maxRow = -1,
        minCol = gridCols,
        maxCol = -1;

    // Determine the bounding box of non-Air blocks.
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            if (structureGrid[r][c] !== Blocks.Air) {
                if (r < minRow) minRow = r;
                if (r > maxRow) maxRow = r;
                if (c < minCol) minCol = c;
                if (c > maxCol) maxCol = c;
            }
        }
    }

    // If no blocks are placed, alert the user.
    if (maxRow < minRow || maxCol < minCol) {
        alert("No blocks placed.");
        return;
    }

    // Create a trimmed 2D array from the bounding box.
    const trimmed = [];
    for (let r = minRow; r <= maxRow; r++) {
        trimmed.push(structureGrid[r].slice(minCol, maxCol + 1));
    }

    // Convert block ids to block names.
    const trimmedNames = trimmed.map((row) =>
        row.map((blockId) => {
            const block = GetBlock(blockId);
            return block ? "Blocks." + block.name : blockId;
        })
    );

    // Create export data that includes the trimmed structure with block names.
    const exportData = {
        blocks: trimmedNames,
    };

    document.getElementById("output").textContent = JSON.stringify(
        exportData,
        null,
        2
    );
});
