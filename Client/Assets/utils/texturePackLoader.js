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
            spritePaths.push(`items/${item.sprite}`);
        }
    }

    // Remove duplicates (if any)
    const uniquePaths = [...new Set(spritePaths)];

    await Promise.all(
        uniquePaths.map(async (path) => {
            try {
                const imgUrl = `Assets/sprites/${path}.png`;
                const img = new Image();
                img.src = imgUrl;

                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        vanillaTextureCache[path] = {
                            url: imgUrl,
                            width: img.width,
                            height: img.height,
                            originalWidth: img.width,
                            originalHeight: img.height,
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

                        texturePackFiles[relativePath] = {
                            url: imgUrl,
                            width: img.width,
                            height: img.height,
                            originalWidth: originalSize.width,
                            originalHeight: originalSize.height,
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
        spriteSize.width === spriteSize.originalWidth &&
        spriteSize.height === spriteSize.originalHeight
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
