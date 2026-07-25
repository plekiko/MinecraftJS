import { runtime } from "../utils/runtime.js";
import { Chat } from "./chat.js";
import { PauseMenu } from "./pauseMenu.js";
import { Vector2 } from "../utils/classes.js";
import { BLOCK_SIZE, INTERACT_DISTANCE, multiplayer } from "../utils/globals.js";
import { input } from "../utils/input.js";
import { draw } from "../utils/renderer.js";
import { activeDimension, getDimensionChunks } from "../world/dimension.js";
import { loadWorldFromLocalStorage } from "../world/saving.js";
import { World } from "../world/world.js";
import { handleDebugInput, updateDebug } from "../../debug.js";

export class Game {
    constructor() {
        this.lastFrameTime = performance.now();
        this.fpsDisplay = 0;
        this.settings = {
            musicVolume: 100,
            sfxVolume: 100,
            lighting: true,
            username: "Player",
        };
        this.chat = new Chat();
        this.pauseMenu = new PauseMenu();
    }

    waitForTexturePack() {
        return new Promise((resolve) => {
            const checkLoaded = () => {
                if (runtime.isTexturePackLoaded) {
                    resolve();
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
    }

    loadSettings() {
        const settingsString = localStorage.getItem("settings");
        if (settingsString) {
            const loaded = JSON.parse(settingsString);
            this.settings.lighting = loaded.lighting !== false;
            this.settings.username = loaded.username || "Player";
            this.settings.musicVolume =
                loaded.musicVolume ?? (loaded.music === false ? 0 : 100);
            this.settings.sfxVolume =
                loaded.sfxVolume ?? (loaded.sfx === false ? 0 : 100);
        }
    }

    calculateFPS(currentFrameTime) {
        if (!this._lastUpdate) this._lastUpdate = currentFrameTime;
        if (!this._frameCount) this._frameCount = 0;
        this._frameCount++;
        if (currentFrameTime - this._lastUpdate >= 1000) {
            this.fpsDisplay = this._frameCount;
            this._frameCount = 0;
            this._lastUpdate = currentFrameTime;
        }
        return this.fpsDisplay;
    }

    async gameLoop() {
        const currentFrameTime = performance.now();
        runtime.deltaTime = (currentFrameTime - this.lastFrameTime) / 1000;
        runtime.passedTime += runtime.deltaTime;

        await runtime.world.startGenerator();

        this.updateGame();

        draw(
            getDimensionChunks(activeDimension),
            this.calculateFPS(currentFrameTime),
        );

        this.lastFrameTime = currentFrameTime;

        if (updateDebug) updateDebug();

        input.resetKeysPressed();

        requestAnimationFrame(() => this.gameLoop());
    }

    updateGame() {
        if (!runtime.world) return;

        runtime.world.updateEntities();
        runtime.world.updateParticleEmitters();

        if (runtime.world.player) this.cursorBlockLogic();
        if (runtime.hotbar) runtime.hotbar.update();
        if (this.pauseMenu) this.pauseMenu.update();
        if (this.chat) this.chat.update();

        if (typeof handleDebugInput === "function") handleDebugInput();
    }

    async initGame() {
        runtime.world = new World();
        
        console.log("Initializing game...");

        // Wait for texture pack
        console.log("Waiting for texture pack...");

        await this.waitForTexturePack();

        console.log("Texture pack loaded!");

        // Load world from local storage if not multiplayer
        if (!multiplayer) {
            loadWorldFromLocalStorage();
        } else {
            while (!runtime.world.generator.multiplayerSeedLoaded) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }
        runtime.world.generator.loadingWorld = false;
    }

    updateArray(array, deltaTime) {
        array.forEach((element) => {
            element.update();
        });
    }

    cursorBlockLogic() {
        if (this.pauseMenu?.getActive()) {
            runtime.cursorInRange = false;
            if (runtime.world.player) {
                runtime.world.player.hoverBlock = null;
                runtime.world.player.hoverWall = null;
            }
            return;
        }
        const cursorDistance = Math.floor(
            Vector2.Distance(
                runtime.world.player.position,
                new Vector2(
                    input.getMousePositionOnBlockGrid().x,
                    input.getMousePositionOnBlockGrid().y,
                ),
            ) / BLOCK_SIZE,
        );
        runtime.cursorInRange = !runtime.world.player.abilities.instaBuild
            ? cursorDistance <= INTERACT_DISTANCE
            : true;
        runtime.world.player.hoverBlock = runtime.cursorInRange
            ? runtime.world.getBlockAtWorldPosition(
                  input.getMousePositionOnBlockGrid().x,
                  input.getMousePositionOnBlockGrid().y,
              )
            : null;
        runtime.world.player.hoverWall = runtime.cursorInRange
            ? runtime.world.getBlockAtWorldPosition(
                  input.getMousePositionOnBlockGrid().x,
                  input.getMousePositionOnBlockGrid().y,
                  true,
              )
            : null;
    }

    animateFrame() {
        runtime.globalFrame++;
    }
}
