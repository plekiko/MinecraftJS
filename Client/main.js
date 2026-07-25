import { runtime } from "./Assets/utils/runtime.js";
import { Game } from "./Assets/game/game.js";
import { drawLoadScreen } from "./Assets/utils/renderer.js";

runtime.game = new Game();
runtime.world = null;

drawLoadScreen();

window.onload = async function () {
    await runtime.game.initGame().catch((error) => {
        console.error("Failed to initialize game:", error);
    });

    requestAnimationFrame(() => runtime.game.gameLoop());
};
