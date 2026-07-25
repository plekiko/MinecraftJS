/**
 * Game page entry — load media pack, then the full client module graph.
 */
import {
    applyPackedMediaStyles,
    loadMediaBundle,
} from "./Assets/utils/assetBundle.js";
import { createBootLoader } from "./bootLoader.js";

const boot = createBootLoader();
await loadMediaBundle({ onProgress: (p) => boot.setProgress(p) });
applyPackedMediaStyles();

await Promise.all([
    import("./Assets/entities/entities.js"),
    import("./Assets/entities/TNT.js"),
    import("./Assets/game/inventoryItem.js"),
    import("./Assets/world/trees.js"),
    import("./Assets/world/dimension.js"),
    import("./Assets/multiplayer/messageHandler.js"),
    import("./Assets/multiplayer/server.js"),
    import("./Assets/utils/screenshotChunks.js"),
]);

const { initializeTextures } = await import(
    "./Assets/utils/texturePackLoader.js"
);
await initializeTextures();

const { initButtonCenterImages } = await import("./buttonUtils.js");
initButtonCenterImages();

const {
    toggleChunkBorders,
    toggleCamera,
    toggleHitbox,
    togglePrintBlock,
    toggleFileSize,
    toggleFps,
    toggleCoordinates,
} = await import("./debug.js");
const { togglePauseDifficulty } = await import("./Assets/game/pauseMenu.js");
const { respawnFromDeathScreen } = await import(
    "./Assets/game/deathScreen.js"
);
const { saveWorld } = await import("./Assets/world/saving.js");
const { runtime } = await import("./Assets/utils/runtime.js");

await import("./main.js");

Object.defineProperty(window, "game", {
    get: () => runtime.game,
    configurable: true,
});

Object.assign(window, {
    toggleChunkBorders,
    toggleCamera,
    toggleHitbox,
    togglePrintBlock,
    toggleFileSize,
    toggleFps,
    toggleCoordinates,
    togglePauseDifficulty,
    respawnFromDeathScreen,
    saveWorld,
});

boot.hide();
