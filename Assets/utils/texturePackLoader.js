// Global texture pack cache
let texturePackZip = null;
let texturePackFiles = null;
let isTexturePackLoaded = false; // New boolean flag

// Load the active texture pack from localStorage
function loadTexturePack() {
    const currentPackKey =
        localStorage.getItem("currentTexturePack") || "default";
    isTexturePackLoaded = false; // Reset to false at the start of loading

    if (currentPackKey === "default") {
        texturePackZip = null;
        texturePackFiles = null;
        console.log("Using default textures.");
        isTexturePackLoaded = true; // Default textures are "loaded" immediately
        return;
    }

    const texturePackData = localStorage.getItem(
        `texturePack_${currentPackKey}`
    );
    if (texturePackData) {
        // Strip the data URL prefix if present
        const base64Data = texturePackData.startsWith(
            "data:application/x-zip-compressed;base64,"
        )
            ? texturePackData.replace(
                  "data:application/x-zip-compressed;base64,",
                  ""
              )
            : texturePackData;

        JSZip.loadAsync(base64Data, { base64: true })
            .then((zip) => {
                texturePackZip = zip;
                texturePackFiles = {};
                // Pre-cache file references
                return Promise.all(
                    Object.keys(zip.files).map((fileName) =>
                        zip.files[fileName].async("base64").then((content) => {
                            texturePackFiles[
                                fileName
                            ] = `data:image/png;base64,${content}`;
                        })
                    )
                );
            })
            .then(() => {
                console.log(
                    `Texture pack ${currentPackKey} loaded and cached.`
                );
                isTexturePackLoaded = true; // Set to true when loading completes
            })
            .catch((err) => {
                console.error(
                    `Failed to load texture pack ${currentPackKey}:`,
                    err
                );
                texturePackZip = null;
                texturePackFiles = null;
                isTexturePackLoaded = false; // Set to false on error
            });
    } else {
        console.warn(
            `No texture pack found for key: ${currentPackKey}, using default.`
        );
        texturePackZip = null;
        texturePackFiles = null;
        isTexturePackLoaded = true; // Default textures are "loaded" immediately
    }
}

// Call this when the page loads or when a new texture pack is selected
loadTexturePack();

// Global function to resolve sprite URLs (unchanged except for comments)
function getSpriteUrl(path) {
    if (texturePackZip && texturePackFiles) {
        // Adjust path to match texture pack structure (e.g., "texturePackExample/blocks/dirt.png")
        const texturePackPath = Object.keys(texturePackFiles).find((fileName) =>
            fileName.endsWith(path + ".png")
        );
        if (texturePackPath && texturePackFiles[texturePackPath]) {
            return texturePackFiles[texturePackPath].replace(
                /^.*data:/,
                "data:"
            ); // Return data URL from texture pack
        }
    }
    // Fallback to default Assets/sprites/ path
    if (isBase64(path)) return path.replace(/^.*data:/, "data:");

    return `Assets/sprites/${path}.png`;
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
        return str.includes("data:image/png;base64,");
    } catch (err) {
        return false;
    }
}
