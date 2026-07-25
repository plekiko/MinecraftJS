import { runtime } from "../utils/runtime.js";
import { input } from "../utils/input.js";
import { updateDebugButtonLabels } from "../../debug.js";

export class PauseMenu {
    constructor() {
        this.container = document.querySelector("#pause-menu");
        this.pages = Array.from(
            document.querySelectorAll(".pause-menu-page[data-page]"),
        );
        this.root = document.querySelector(":root");

        this._page = 0; // 0 = closed, 1+ = current page number
        this.container.classList.remove("visible");
        this.pages.forEach((el) => el.classList.remove("active"));
    }

    get page() {
        return this._page;
    }

    set page(n) {
        this._page = n;
        this.pages.forEach((el) => {
            const num = parseInt(el.getAttribute("data-page"), 10);
            el.classList.toggle("active", num === n);
        });
    }

    setPaused(paused) {
        this._page = paused ? 1 : 0;

        if (paused) {
            this.container.classList.add("visible");
            this.page = 1;
            this.root.style.setProperty("--drawMouse", "default");
            if (runtime.world.player) {
                runtime.world.player.canMove = false;
                if (runtime.world.player.resetBreaking) runtime.world.player.resetBreaking();
            }
            // update pause menu difficulty label if present
            this.updateDifficultyLabel();
        } else {
            this.container.classList.remove("visible");
            this.page = 0;
            this.root.style.setProperty("--drawMouse", "none");
            if (runtime.world.player) runtime.world.player.canMove = true;
        }
    }

    updateDifficultyLabel() {
        try {
            const btn = document.getElementById("pause-difficulty-btn");
            if (!btn) return;
            const label =
                runtime.world && runtime.world.difficulty === "peaceful" ? "Peaceful" : "Easy";
            btn.textContent = "Difficulty: " + label;
        } catch (e) {}
    }

    setPage(n) {
        if (n < 1 || n > this.pages.length) return;
        this._page = n;
        this.page = n;
        if (n === 2 && typeof updateDebugButtonLabels === "function") {
            updateDebugButtonLabels();
        }
    }

    getActive() {
        return this._page > 0;
    }

    update() {
        if (!input.isActionPressed("pause")) return;

        if (this.getActive()) {
            if (this._page > 1) {
                this.setPage(1);
            } else {
                this.close();
            }
            return;
        }

        if (runtime.game.chat.inChat || (runtime.world.player && runtime.world.player.windowOpen))
            return;
        if (input._pauseConsumedByUI) {
            input._pauseConsumedByUI = false;
            return;
        }

        if (runtime.world.player && !runtime.world.generator.loadingWorld) {
            this.open();
        }
    }

    open() {
        this.setPaused(true);
    }

    close() {
        this.setPaused(false);
    }
}

export function togglePauseDifficulty() {
    try {
        if (!runtime.world) return;
        // cycle difficulty on the world
        if (typeof runtime.world.cycleDifficulty === "function") {
            const newDiff = runtime.world.cycleDifficulty();
            // update any gamerule-dependent settings if needed
        } else if (typeof runtime.world.setDifficulty === "function") {
            const next = runtime.world.difficulty === "peaceful" ? "easy" : "peaceful";
            runtime.world.setDifficulty(next);
        }

        // update label in pause menu
        if (runtime.game && runtime.game.pauseMenu) runtime.game.pauseMenu.updateDifficultyLabel();
    } catch (e) {}
}
