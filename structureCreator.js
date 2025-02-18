// ----- CONFIGURATION -----
const gridRows = 16;
const gridCols = 16;
const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
const cellSize = canvas.width / gridCols;

const blockAverageColorCache = {};

ctx.imageSmoothingEnabled = false;

// Global flag to show grid lines.
let showGrid = true;

// Global flag for wall mode (false = main blocks, true = wall layer)
let wallMode = false;

// The 2D array structure for main blocks.
let structureGrid = [];
// The 2D array structure for walls.
let wallsGrid = [];
for (let r = 0; r < gridRows; r++) {
    structureGrid[r] = [];
    wallsGrid[r] = [];
    for (let c = 0; c < gridCols; c++) {
        structureGrid[r][c] = Blocks.Air;
        wallsGrid[r][c] = Blocks.Air;
    }
}

// The currently selected block from the palette.
// Can be a number (block id) or a string (e.g. "ChestLoot.Spawner").
let activeBlockId = 34;

// ----- DRAWING THE GRID -----
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw walls
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = wallsGrid[r][c];
            if (cell !== Blocks.Air) {
                if (typeof cell === "number") {
                    const block = GetBlock(cell);
                    if (block && block.sprite) {
                        const img = new Image();
                        img.src =
                            "Assets/sprites/blocks/" + block.sprite + ".png";
                        // Optionally, you might draw walls with a slight offset or different opacity.
                        ctx.drawImage(
                            img,
                            c * cellSize,
                            r * cellSize,
                            cellSize,
                            cellSize
                        );
                        ctx.globalAlpha = 0.5;
                        ctx.fillStyle = "black";
                        ctx.fillRect(
                            c * cellSize,
                            r * cellSize,
                            cellSize,
                            cellSize
                        );
                        ctx.globalAlpha = 1;
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

    // Draw main blocks.
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = structureGrid[r][c];
            if (cell !== Blocks.Air) {
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
                        ctx.globalAlpha = 0.5;
                        ctx.fillRect(
                            c * cellSize,
                            r * cellSize,
                            cellSize,
                            cellSize
                        );
                        ctx.globalAlpha = 1;
                    }
                } else if (typeof cell === "string") {
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

    // Draw grid lines if enabled.
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
        if (wallMode) {
            wallsGrid[row][col] = activeBlockId;
        } else {
            structureGrid[row][col] = activeBlockId;
        }
    } else if (currentAction === "remove") {
        if (wallMode) {
            wallsGrid[row][col] = Blocks.Air;
        } else {
            structureGrid[row][col] = Blocks.Air;
        }
    }
    drawGrid();
}

canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isPainting = true;
    if (e.button === 0) {
        currentAction = "place";
    } else if (e.button === 2) {
        currentAction = "remove";
    }
    handlePaint(e);
});

canvas.addEventListener("mousemove", (e) => {
    if (isPainting) handlePaint(e);
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
const paletteContainer = document.getElementById("palette");

if (!document.getElementById("paletteSearch")) {
    const searchBar = document.createElement("input");
    searchBar.id = "paletteSearch";
    searchBar.type = "text";
    searchBar.placeholder = "Search blocks...";
    searchBar.style.width = "100%";
    searchBar.style.padding = "5px";
    searchBar.style.marginBottom = "10px";
    paletteContainer.appendChild(searchBar);
}

const paletteTitle = document.createElement("h3");
paletteTitle.style.color = "#e8e8e8";
paletteTitle.textContent = "Blocks";
paletteContainer.appendChild(paletteTitle);

const sortedBlocks = blockTypes
    .filter((block) => block.blockId !== Blocks.Air)
    .sort((a, b) => a.name.localeCompare(b.name));

function createPaletteItem(labelText, imgSrc, value) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "palette-item";
    itemDiv.dataset.value = labelText.toLowerCase();
    const img = document.createElement("img");
    img.src = imgSrc;
    itemDiv.appendChild(img);
    const label = document.createElement("span");
    label.textContent = labelText;
    itemDiv.appendChild(label);
    itemDiv.addEventListener("click", () => {
        activeBlockId = value;
        document
            .querySelectorAll(".palette-item")
            .forEach((el) => el.classList.remove("selected"));
        itemDiv.classList.add("selected");
    });
    return itemDiv;
}

sortedBlocks.forEach((block) => {
    const imgSrc = block.sprite
        ? "Assets/sprites/blocks/" + block.sprite + ".png"
        : "Assets/sprites/misc/placeholder.png";
    const item = createPaletteItem(block.name, imgSrc, block.blockId);
    if (block.blockId === activeBlockId) item.classList.add("selected");
    paletteContainer.appendChild(item);
});

const lootTitle = document.createElement("h3");
lootTitle.style.color = "#e8e8e8";
lootTitle.textContent = "Chest Loot";
paletteContainer.appendChild(lootTitle);

for (const key in ChestLoot) {
    if (ChestLoot.hasOwnProperty(key)) {
        const lootId = "ChestLoot." + key;
        const imgSrc = "Assets/sprites/blocks/chest.png";
        const item = createPaletteItem(key, imgSrc, lootId);
        if (activeBlockId === lootId) item.classList.add("selected");
        paletteContainer.appendChild(item);
    }

    document.getElementById("paletteSearch").addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();
        document.querySelectorAll(".palette-item").forEach((item) => {
            if (item.dataset.value.indexOf(query) !== -1) {
                item.style.display = "";
            } else {
                item.style.display = "none";
            }
        });
    });
}

// ----- LOCAL STORAGE: SAVE & LOAD BUILDS -----
const BUILD_STORAGE_KEY = "savedBuilds";

function loadSavedBuilds() {
    const saved = localStorage.getItem(BUILD_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveBuildsToLocalStorage(builds) {
    localStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify(builds));
}

// Save the entire grid (both blocks and walls).
const buildNameInput = document.getElementById("buildName");
document.getElementById("saveBuildBtn").addEventListener("click", () => {
    const buildName = buildNameInput.value.trim();
    if (!buildName) return;
    const buildData = { blocks: structureGrid, walls: wallsGrid };
    const builds = loadSavedBuilds();
    builds[buildName] = buildData;
    saveBuildsToLocalStorage(builds);
    updateSavedBuildsList();
});

const buildSearchInput = document.getElementById("buildSearch");
buildSearchInput.addEventListener("input", updateSavedBuildsList);

function updateSavedBuildsList() {
    const builds = loadSavedBuilds();
    const savedBuildsContainer = document.getElementById("savedBuilds");
    savedBuildsContainer.innerHTML = "";
    const searchQuery = buildSearchInput
        ? buildSearchInput.value.trim().toLowerCase()
        : "";
    Object.keys(builds).forEach((buildName) => {
        if (
            searchQuery &&
            buildName.toLowerCase().indexOf(searchQuery) === -1
        ) {
            return;
        }
        const buildEntry = document.createElement("div");
        buildEntry.className = "build-entry";
        // Generate a preview canvas for the main blocks.
        const previewCanvas = generatePreviewCanvas({
            blocks: builds[buildName].blocks,
        });
        buildEntry.appendChild(previewCanvas);
        const label = document.createElement("span");
        label.textContent = buildName;
        buildEntry.appendChild(label);
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-build-btn";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const builds = loadSavedBuilds();
            delete builds[buildName];
            saveBuildsToLocalStorage(builds);
            updateSavedBuildsList();
        });
        buildEntry.appendChild(removeBtn);
        buildEntry.addEventListener("click", () => {
            const buildData = builds[buildName];
            structureGrid = buildData.blocks;
            if (buildData.walls) wallsGrid = buildData.walls;
            buildNameInput.value = buildName;
            drawGrid();
        });
        savedBuildsContainer.appendChild(buildEntry);
    });
}

updateSavedBuildsList();

// Global cache for computed average colors by block id.

let updateTimeout;
function scheduleSavedBuildsUpdate() {
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        updateSavedBuildsList();
    }, 200);
}

function getBlockAverageColor(block, fallbackColor = "#ffffff") {
    if (blockAverageColorCache[block.blockId]) {
        return blockAverageColorCache[block.blockId];
    }
    if (block.sprite) {
        const img = new Image();
        img.src = "Assets/sprites/blocks/" + block.sprite + ".png";
        if (img.complete) {
            const offCanvas = document.createElement("canvas");
            offCanvas.width = 1;
            offCanvas.height = 1;
            const offCtx = offCanvas.getContext("2d");
            offCtx.drawImage(img, 0, 0, 1, 1);
            const data = offCtx.getImageData(0, 0, 1, 1).data;
            const r = data[0],
                g = data[1],
                b = data[2];
            const color = `rgb(${r}, ${g}, ${b})`;
            blockAverageColorCache[block.blockId] = color;
            return color;
        } else {
            img.onload = () => {
                const offCanvas = document.createElement("canvas");
                offCanvas.width = 1;
                offCanvas.height = 1;
                const offCtx = offCanvas.getContext("2d");
                offCtx.drawImage(img, 0, 0, 1, 1);
                const data = offCtx.getImageData(0, 0, 1, 1).data;
                const r = data[0],
                    g = data[1],
                    b = data[2];
                const color = `rgb(${r}, ${g}, ${b})`;
                blockAverageColorCache[block.blockId] = color;
                scheduleSavedBuildsUpdate();
            };
            return fallbackColor;
        }
    }
    return fallbackColor;
}

function generatePreviewCanvas(
    buildData,
    previewWidth = 64,
    previewHeight = 64
) {
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = previewWidth;
    previewCanvas.height = previewHeight;
    const pctx = previewCanvas.getContext("2d");
    pctx.clearRect(0, 0, previewWidth, previewHeight);
    const blocks = buildData.blocks;
    const rows = blocks.length;
    const cols = blocks[0].length;
    const cellW = previewWidth / cols;
    const cellH = previewHeight / rows;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = blocks[r][c];
            let fillColor = "#74b3ff";
            if (typeof cell === "number") {
                const block = GetBlock(cell);
                if (block && block.name) {
                    fillColor = getBlockAverageColor(block, "#74b3ff");
                }
            } else if (typeof cell === "string") {
                fillColor = "#aa4400";
            }
            pctx.fillStyle = fillColor;
            pctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
    }
    return previewCanvas;
}

updateSavedBuildsList();

// ----- EXPORT FUNCTIONALITY -----
// Export only the bounding box (width and height) that covers the non-Air cells
// in either the main blocks grid or the walls grid.
document.getElementById("exportBtn").addEventListener("click", () => {
    let minRow = gridRows,
        maxRow = -1,
        minCol = gridCols,
        maxCol = -1;

    // Loop over every cell in both grids
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            // Check if either the main grid or the walls grid has a non-Air cell.
            if (
                structureGrid[r][c] !== Blocks.Air ||
                wallsGrid[r][c] !== Blocks.Air
            ) {
                if (r < minRow) minRow = r;
                if (r > maxRow) maxRow = r;
                if (c < minCol) minCol = c;
                if (c > maxCol) maxCol = c;
            }
        }
    }

    // If nothing was placed, exit.
    if (maxRow < minRow || maxCol < minCol) return;

    // Create trimmed arrays for both grids.
    const trimmedBlocks = [];
    const trimmedWalls = [];
    for (let r = minRow; r <= maxRow; r++) {
        trimmedBlocks.push(structureGrid[r].slice(minCol, maxCol + 1));
        trimmedWalls.push(wallsGrid[r].slice(minCol, maxCol + 1));
    }

    // Convert cell values: If number, convert using GetBlock; if string, output as is.
    const convertGrid = (grid) =>
        grid.map((row) =>
            row.map((cell) => {
                if (typeof cell === "string") {
                    return cell;
                } else {
                    const block = GetBlock(cell);
                    return block
                        ? "Blocks." + block.name.replace(/\s+/g, "")
                        : cell;
                }
            })
        );

    const trimmedNamesBlocks = convertGrid(trimmedBlocks);
    const trimmedNamesWalls = convertGrid(trimmedWalls);

    let exportData = {
        blocks: trimmedNamesBlocks,
        walls: trimmedNamesWalls,
    };

    // Convert exportData to JSON and then remove braces and quotes if needed.
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
            // alert("Blocks array copied to clipboard!");
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
            wallsGrid[r][c] = Blocks.Air;
        }
    }
    drawGrid();
});

// ----- TOGGLE GRID FUNCTIONALITY -----
document.getElementById("toggleGridBtn").addEventListener("click", () => {
    showGrid = !showGrid;
    drawGrid();
});

// ----- TOGGLE WALL MODE FUNCTIONALITY -----
// This button toggles between drawing main blocks and walls.
document.getElementById("toggleWallModeBtn").addEventListener("click", () => {
    wallMode = !wallMode;
    // Update button label
    document.getElementById("toggleWallModeBtn").textContent =
        "Wall Mode: " + (wallMode ? "ON" : "OFF");
});
