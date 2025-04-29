let texturePackZip = null;
let texturePackFiles = null;
let vanillaTextureCache = null;
let isTexturePackLoaded = false;

// Load vanilla textures by iterating over Blocks and Items
async function loadVanillaTextures() {
    vanillaTextureCache = {};

    // Collect sprite paths from Blocks and Items
    const spritePaths = [];

    // Loop through Blocks
    for (const blockKey in Blocks) {
        const block = GetBlock(Blocks[blockKey]);
        if (block.iconSprite) {
            spritePaths.push(`blocks/${block.iconSprite}`);
        }
    }

    // Loop through Items
    for (const itemKey in Items) {
        const item = GetItem(Items[itemKey]);
        if (item.sprite) {
            spritePaths.push(`items Recomendado por favor intenta de nuevo.`);
        }
    }

    // Loop through Entities
    for (const entityKey in Entities) {
        const entity = Entities[entityKey];
        const initEntity = new entity();
        if (initEntity.body?.sprite) {
            spritePaths.push(`entity/${initEntity.body.sprite}`);
        }
    }

    // Misc Entity Sprites
    spritePaths.push(`entity/sheep/sheep_fur`);

    // Player
    spritePaths.push(`entity/steve`);

    // All GUI elements
    spritePaths.push(`gui/icons`);
    spritePaths.push(`gui/widgets`);
    spritePaths.push(`gui/container/anvil`);
    spritePaths.push(`gui/container/beacon`);
    spritePaths.push(`gui/container/brewing_stand`);
    spritePaths.push(`gui/container/converter`);
    spritePaths.push(`gui/container/crafting_table`);
    spritePaths.push(`gui/container/dispenser`);
    spritePaths.push(`gui/container/enchanting_table`);
    spritePaths.push(`gui/container/furnace`);
    spritePaths.push(`gui/container/generic_54`);
    spritePaths.push(`gui/container/hopper`);
    spritePaths.push(`gui/container/horse`);
    spritePaths.push(`gui/container/inventory`);
    spritePaths.push(`gui/container/single_chest`);
    spritePaths.push(`gui/container/stats_icons`);
    spritePaths.push(`gui/container/villager`);

    // Particle textures
    spritePaths.push(`particle/particles`);

    // Remove duplicates (if any)
    const uniquePaths = [...new Set(spritePaths)];

    await Promise.all(
        uniquePaths.map(async (path) => {
            try {
                const imgUrl = `Assets/sprites/${path}.png`;
                const img = new Image();
                img.src = imgUrl;

                await new Promise((resolve, reject) => {
                    img.onload = async () => {
                        const averageColor = await getAverageColor(img);
                        vanillaTextureCache[path] = {
                            url: imgUrl,
                            width: img.width,
                            height: img.height,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            averageColor,
                        };
                        resolve();
                    };
                    img.onerror = () => {
                        vanillaTextureCache[path] = {
                            url: imgUrl,
                            width: 16,
                            height: 16,
                            originalWidth: 16,
                            originalHeight: 16,
                            averageColor: { r: 0, g: 0, b: 0 },
                        };
                        resolve();
                    };
                });
            } catch (err) {
                console.warn(`Failed to load vanilla texture ${path}:`, err);
                vanillaTextureCache[path] = {
                    url: `Assets/sprites/${path}.png`,
                    width: 16,
                    height: 16,
                    originalWidth: 16,
                    originalHeight: 16,
                    averageColor: { r: 0, g: 0, b: 0 },
                };
            }
        })
    );
}

// Load the active texture pack from localStorage
async function loadTexturePack() {
    const currentPackKey =
        localStorage.getItem("currentTexturePack") || "default";
    isTexturePackLoaded = false;

    // Load vanilla textures first
    await loadVanillaTextures();

    if (currentPackKey === "default") {
        texturePackZip = null;
        texturePackFiles = null;
        isTexturePackLoaded = true;
        return;
    }

    try {
        const texturePackData = await getFromLdb(
            `texturePack_${currentPackKey}`
        );
        if (!texturePackData) {
            console.warn(
                `No texture pack found for key: ${currentPackKey}, using default.`
            );
            texturePackZip = null;
            texturePackFiles = null;
            isTexturePackLoaded = true;
            localStorage.setItem("currentTexturePack", "default");
            return;
        }

        const base64Data = texturePackData.replace(
            "data:application/x-zip-compressed;base64,",
            ""
        );

        const zip = await JSZip.loadAsync(base64Data, { base64: true });
        texturePackZip = zip;
        texturePackFiles = {};

        await Promise.all(
            Object.keys(zip.files).map(async (fileName) => {
                if (!fileName.endsWith(".png")) return;

                const fileContent = await zip.files[fileName].async("base64");
                const imgUrl = `data:image/png;base64,${fileContent}`;

                const img = new Image();
                img.src = imgUrl;

                await new Promise((resolve) => {
                    img.onload = async () => {
                        const relativePath = fileName
                            .replace(/^.*assets\/minecraft\/textures\//, "")
                            .replace(/\.png$/, "");

                        const originalSize = vanillaTextureCache[
                            relativePath
                        ] || { width: 16, height: 16 };

                        const averageColor = await getAverageColor(img);

                        texturePackFiles[relativePath] = {
                            url: imgUrl,
                            width: img.width,
                            height: img.height,
                            originalWidth: originalSize.width,
                            originalHeight: originalSize.height,
                            averageColor,
                        };
                        resolve();
                    };
                });
            })
        );

        isTexturePackLoaded = true;
    } catch (err) {
        console.error(`Failed to load texture pack ${currentPackKey}:`, err);
        texturePackZip = null;
        texturePackFiles = null;
        isTexturePackLoaded = true;
        localStorage.setItem("currentTexturePack", "default");
    }
}

// Initialize both vanilla and texture pack loading
async function initializeTextures() {
    await loadTexturePack();
}

initializeTextures();

function getSpriteUrl(path, useTexturePack = true) {
    if (isBase64(path)) {
        const base64Index = path.indexOf("data:image/png;base64,");
        return path.substring(base64Index);
    }

    if (useTexturePack && texturePackFiles && texturePackFiles[path]) {
        return texturePackFiles[path].url;
    }

    if (vanillaTextureCache && vanillaTextureCache[path]) {
        return vanillaTextureCache[path].url;
    }

    return `Assets/sprites/${path}.png`;
}

function getSpriteAverageColor(path) {
    if (isBase64(path)) {
        return { r: 0, g: 0, b: 0 }; // Base64 images not cached
    }

    if (texturePackFiles && texturePackFiles[path]) {
        return texturePackFiles[path].averageColor;
    }

    if (vanillaTextureCache && vanillaTextureCache[path]) {
        return vanillaTextureCache[path].averageColor;
    }

    return { r: 0, g: 0, b: 0 }; // Default if not found
}

function getSpriteSize(path) {
    if (isBase64(path)) {
        return {
            width: 0,
            height: 0,
            originalWidth: 0,
            originalHeight: 0,
        };
    }

    if (texturePackFiles && texturePackFiles[path]) {
        const { width, height, originalWidth, originalHeight } =
            texturePackFiles[path];
        return { width, height, originalWidth, originalHeight };
    }

    if (vanillaTextureCache && vanillaTextureCache[path]) {
        const { width, height, originalWidth, originalHeight } =
            vanillaTextureCache[path];
        return { width, height, originalWidth, originalHeight };
    }

    return {
        width: 16,
        height: 16,
        originalWidth: 16,
        originalHeight: 16,
    };
}

function isEqualToOriginal(path) {
    const spriteSize = getSpriteSize(path);

    if (
        !spriteSize ||
        !spriteSize.originalWidth ||
        !spriteSize.originalHeight
    ) {
        return false;
    }

    return (
        spriteSize.width == spriteSize.originalWidth &&
        spriteSize.height == spriteSize.originalHeight
    );
}

function waitForTexturePack() {
    return new Promise((resolve) => {
        const checkLoaded = () => {
            if (isTexturePackLoaded) {
                resolve();
            } else {
                setTimeout(checkLoaded, 1);
            }
        };
        checkLoaded();
    });
}

function isBase64(str) {
    try {
        return (
            typeof str === "string" && str.includes("data:image/png;base64,")
        );
    } catch {
        return false;
    }
}

async function getAverageColor(img) {
    try {
        // Create an ImageBitmap from the image
        const bitmap = await createImageBitmap(img);
        // Create an OffscreenCanvas to draw the bitmap
        const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = offscreen.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);

        // Get pixel data
        const imageData = ctx.getImageData(
            0,
            0,
            bitmap.width,
            bitmap.height
        ).data;
        let r = 0,
            g = 0,
            b = 0,
            count = 0;

        // Iterate through pixels
        for (let i = 0; i < imageData.length; i += 4) {
            const alpha = imageData[i + 3];
            if (alpha > 0) {
                // Only count non-transparent pixels
                r += imageData[i];
                g += imageData[i + 1];
                b += imageData[i + 2];
                count++;
            }
        }

        bitmap.close(); // Clean up

        if (count === 0) {
            return "#000000"; // Default for fully transparent images
        }

        // Convert to hex
        const avgR = Math.round(r / count);
        const avgG = Math.round(g / count);
        const avgB = Math.round(b / count);
        return `#${avgR.toString(16).padStart(2, "0")}${avgG
            .toString(16)
            .padStart(2, "0")}${avgB
            .toString(16)
            .padStart(2, "0")}`.toUpperCase();
    } catch (err) {
        console.warn(`Failed to compute average color:`, err);
        return "#000000";
    }
}
