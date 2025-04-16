let texturePackZip = null;
let texturePackFiles = null;
let isTexturePackLoaded = false; // New boolean flag

// Load the active texture pack from localStorage
async function loadTexturePack() {
    const currentPackKey =
        localStorage.getItem("currentTexturePack") || "default";
    isTexturePackLoaded = false;

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
                        // Normalize path to use for lookups (remove prefix + .png)
                        const relativePath = fileName
                            .replace(/^.*assets\/minecraft\/textures\//, "")
                            .replace(/\.png$/, "");

                        const originalSize = await getDefaultSpriteSize(
                            relativePath
                        );

                        // console.log(
                        //     `Loaded texture: ${relativePath} (${img.width}x${img.height}) original (${originalSize.width}x${originalSize.height})`
                        // );

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

loadTexturePack(); // Load texture pack immediately on script load

async function getDefaultSpriteSize(fileName) {
    if (!fileName) return { width: 16, height: 16 };

    return new Promise((resolve) => {
        const path = `Assets/sprites/${fileName.replace(/^\/?/, "")}.png`;
        const img = new Image();
        img.src = path;

        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            resolve({ width: 16, height: 16 });
        };
    });
}

function getSpriteUrl(path, useTexturePack = true) {
    if (isBase64(path)) {
        const base64Index = path.indexOf("data:image/png;base64,");
        return path.substring(base64Index);
    }

    if (texturePackFiles && texturePackFiles[path] && useTexturePack) {
        return texturePackFiles[path].url;
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

    if (texturePackZip && texturePackFiles && texturePackFiles[path]) {
        const { width, height, originalWidth, originalHeight } =
            texturePackFiles[path];
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

    let useTexturePack = true;

    if (
        spriteSize.width !== spriteSize.originalWidth ||
        spriteSize.height !== spriteSize.originalHeight
    )
        useTexturePack = false;

    return useTexturePack;
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
