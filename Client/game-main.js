/**
 * Game page entry — loads the full client module graph and exposes HTML onclick APIs.
 */
import { runtime } from "./Assets/utils/runtime.js";
import "./Assets/entities/entities.js";
import "./Assets/entities/TNT.js";
import "./Assets/game/inventoryItem.js";
import "./Assets/world/trees.js";
import "./Assets/world/dimension.js";
import "./Assets/utils/texturePackLoader.js";
import "./Assets/multiplayer/messageHandler.js";
import "./Assets/multiplayer/server.js";
import "./Assets/utils/screenshotChunks.js";
import {
    toggleChunkBorders,
    toggleCamera,
    toggleHitbox,
    togglePrintBlock,
    toggleFileSize,
    toggleFps,
    toggleCoordinates,
} from "./debug.js";
import { togglePauseDifficulty } from "./Assets/game/pauseMenu.js";
import { respawnFromDeathScreen } from "./Assets/game/deathScreen.js";
import { saveWorld } from "./Assets/world/saving.js";
import "./main.js";

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
