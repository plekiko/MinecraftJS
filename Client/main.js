import { runtime } from "./Assets/utils/runtime.js";
import { Game } from "./Assets/game/game.js";
import { drawLoadScreen } from "./Assets/utils/renderer.js";

runtime.game = new Game();
runtime.world = null;

drawLoadScreen();

// Don't use window.onload — game-main awaits media.zip first, so the load
// event has usually already fired by the time this module runs.
await runtime.game.initGame().catch((error) => {
    console.error("Failed to initialize game:", error);
});

requestAnimationFrame(() => runtime.game.gameLoop());
