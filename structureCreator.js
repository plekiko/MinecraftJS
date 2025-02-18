// ----- CONFIGURATION -----
const gridRows = 16;
const gridCols = 16;
const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
const cellSize = canvas.width / gridCols;

ctx.imageSmoothingEnabled = false;

// Global flag to show grid lines.
let showGrid = true;

// The 2D array structure. Each cell holds a block id (or 0 for Air, or a string for special items).
let structureGrid = [];
for (let r = 0; r < gridRows; r++) {
    structureGrid[r] = [];
    for (let c = 0; c < gridCols; c++) {
        structureGrid[r][c] = Blocks.Air; // assuming Blocks.Air === 0
    }
}

// The currently selected block from the palette (default: Oak Planks, for example).
// This can be a number (block id) or a string (e.g. "ChestLoot.Spawner").
let activeBlockId = 34; // change this default as needed

// ----- DRAWING THE GRID -----
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw filled cells using a preview image if available.
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = structureGrid[r][c];
            if (cell !== Blocks.Air) {
                // If cell is a number, then it's a normal block.
                if (typeof cell === "number") {
                    const block = GetBlock(cell);
                    if (block && block.sprite) {
                        const img = new Image();
                        img.src =
                            "Assets/sprites/blocks/" + block.sprite + ".png";
                        ctx.drawImage(
                            img,
                            c * cellSize,
                            r * cellSize,
                            cellSize,
                            cellSize
                        );
                    } else {
                        ctx.fillStyle = "#aaa";
                        ctx.fillRect(
                            c * cellSize,
                            r * cellSize,
                            cellSize,
                            cellSize
                        );
                    }
                } else if (typeof cell === "string") {
                    // For ChestLoot (or other special string values), use a chest preview image.
                    const img = new Image();
                    img.src = "Assets/sprites/blocks/chest.png";
                    ctx.drawImage(
                        img,
                        c * cellSize,
                        r * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }

    // Optionally draw grid lines.
    if (showGrid) {
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
}

// Initial draw
drawGrid();

// ----- CONTINUOUS PAINTING INTERACTION -----
let isPainting = false;
let currentAction = null; // "place" or "remove"

function handlePaint(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const col = Math.floor(clickX / cellSize);
    const row = Math.floor(clickY / cellSize);

    if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) return;

    if (currentAction === "place") {
        structureGrid[row][col] = activeBlockId;
    } else if (currentAction === "remove") {
        structureGrid[row][col] = Blocks.Air;
    }
    drawGrid();
}

canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isPainting = true;
    // Left button (0) = place; Right button (2) = remove.
    if (e.button === 0) {
        currentAction = "place";
    } else if (e.button === 2) {
        currentAction = "remove";
    }
    handlePaint(e);
});

canvas.addEventListener("mousemove", (e) => {
    if (isPainting) {
        handlePaint(e);
    }
});

canvas.addEventListener("mouseup", () => {
    isPainting = false;
    currentAction = null;
});

canvas.addEventListener("mouseleave", () => {
    isPainting = false;
    currentAction = null;
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

// ----- PALETTE (Block Previews) -----
// Filter out Air and sort by block name alphabetically.
const sortedBlocks = blockTypes
    .filter((block) => block.blockId !== Blocks.Air)
    .sort((a, b) => a.name.localeCompare(b.name));

const paletteContainer = document.getElementById("palette");

const paletteTitle = document.createElement("h3");
paletteTitle.style.color = "#e8e8e8";
paletteTitle.textContent = "Blocks";
paletteContainer.appendChild(paletteTitle);

// First, add normal blocks.
sortedBlocks.forEach((block) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "palette-item";
    if (block.blockId === activeBlockId) itemDiv.classList.add("selected");

    const img = document.createElement("img");
    if (block.sprite) {
        img.src = "Assets/sprites/blocks/" + block.sprite + ".png";
    } else {
        img.src = "Assets/sprites/misc/placeholder.png";
    }
    itemDiv.appendChild(img);

    const label = document.createElement("span");
    label.textContent = block.name;
    itemDiv.appendChild(label);

    itemDiv.addEventListener("click", () => {
        activeBlockId = block.blockId;
        document
            .querySelectorAll(".palette-item")
            .forEach((el) => el.classList.remove("selected"));
        itemDiv.classList.add("selected");
    });

    paletteContainer.appendChild(itemDiv);
});

// Next, add ChestLoot items from the ChestLoot object.
const lootTitle = document.createElement("h3");
lootTitle.style.color = "#e8e8e8";
lootTitle.textContent = "Chest Loot";
paletteContainer.appendChild(lootTitle);

for (const key in ChestLoot) {
    if (ChestLoot.hasOwnProperty(key)) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "palette-item";

        // Set activeBlockId as a string like "ChestLoot.Spawner"
        const lootId = "ChestLoot." + key;

        if (activeBlockId === lootId) itemDiv.classList.add("selected");

        const img = document.createElement("img");
        // We'll use the chest image as the preview for ChestLoot.
        img.src = "Assets/sprites/blocks/chest.png";
        itemDiv.appendChild(img);

        const label = document.createElement("span");
        label.textContent = key;
        itemDiv.appendChild(label);

        itemDiv.addEventListener("click", () => {
            activeBlockId = lootId;
            document
                .querySelectorAll(".palette-item")
                .forEach((el) => el.classList.remove("selected"));
            itemDiv.classList.add("selected");
        });

        paletteContainer.appendChild(itemDiv);
    }
}

// ----- EXPORT FUNCTIONALITY -----
// Export only the bounding box (width and height) that covers the non-Air cells.
document.getElementById("exportBtn").addEventListener("click", () => {
    let minRow = gridRows,
        maxRow = -1,
        minCol = gridCols,
        maxCol = -1;

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

    if (maxRow < minRow || maxCol < minCol) {
        return;
    }

    const trimmed = [];
    for (let r = minRow; r <= maxRow; r++) {
        trimmed.push(structureGrid[r].slice(minCol, maxCol + 1));
    }

    // Convert cell values: If number, convert using GetBlock; if string, output as is.
    const trimmedNames = trimmed.map((row) =>
        row.map((cell) => {
            if (typeof cell === "string") {
                // Already a special string (like "ChestLoot.Spawner")
                return cell;
            } else {
                const block = GetBlock(cell);
                return block
                    ? "Blocks." + block.name.replace(/\s+/g, "")
                    : cell;
            }
        })
    );

    let exportData = {
        blocks: trimmedNames,
    };

    exportData = JSON.stringify(exportData, null, 2);

    exportData = exportData.replace(/{/g, "").replace(/}/g, "");
    exportData = exportData.replace(/"/g, "");

    document.getElementById("output").textContent = exportData;
});

// ----- COPY FUNCTIONALITY -----
document.getElementById("copyBtn").addEventListener("click", () => {
    let outputText = document.getElementById("output").textContent.trim();
    navigator.clipboard
        .writeText(outputText)
        .then(() => {
            alert("Blocks array copied to clipboard!");
        })
        .catch((err) => {
            console.error("Error copying text: ", err);
        });
});

// ----- CLEAN FUNCTIONALITY -----
document.getElementById("cleanBtn").addEventListener("click", () => {
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            structureGrid[r][c] = Blocks.Air;
        }
    }
    drawGrid();
});

// ----- TOGGLE GRID FUNCTIONALITY -----
document.getElementById("toggleGridBtn").addEventListener("click", () => {
    showGrid = !showGrid;
    drawGrid();
});
