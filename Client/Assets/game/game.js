class Game {
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
                if (isTexturePackLoaded) {
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

    spawnPlayer(
        position = new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
        setOnGround = true,
        UUID = null,
        name = null,
        local = true
    ) {
        const newPlayer = new Player(world, {
            position: position,
            entities: world.entities,
            UUID: UUID ? UUID : uuidv4(),
            name: name ? name : "Player",
        });
        if (local) {
            world.player = newPlayer;
        }
        if (setOnGround) {
            const trySetOnGround = () => {
                if (newPlayer.getCurrentChunk()) {
                    return newPlayer.setOnGround() === true;
                }
                return false;
            };
            if (!trySetOnGround()) {
                const intervalId = setInterval(() => {
                    if (trySetOnGround()) clearInterval(intervalId);
                }, 100);
                setTimeout(() => clearInterval(intervalId), 10000);
            }
        }
        world.entities.push(newPlayer);
        if (local) hotbar = new Hotbar(newPlayer.inventory);
        return newPlayer;
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
        deltaTime = (currentFrameTime - this.lastFrameTime) / 1000;
        passedTime += deltaTime;

        await world.startGenerator();

        this.updateGame();

        draw(
            getDimensionChunks(activeDimension),
            this.calculateFPS(currentFrameTime)
        );

        this.lastFrameTime = currentFrameTime;

        if (updateDebug) updateDebug();

        input.resetKeysPressed();

        requestAnimationFrame(() => this.gameLoop());
    }

    updateGame() {
        if (!world) return;

        this.updateEntities();
        world.updateParticleEmitters();

        if (world.player) this.cursorBlockLogic();
        if (hotbar) hotbar.update();
        if (this.pauseMenu) this.pauseMenu.update();
        if (this.chat) this.chat.update();

        if (typeof handleDebugInput === "function") handleDebugInput();

        this.dayNightCycle();
    }

    async initGame() {
        world = new World();

        world.generator.loadingWorld = true;

        console.log("Initializing game...");

        // Wait for texture pack
        console.log("Waiting for texture pack...");

        await this.waitForTexturePack();

        console.log("Texture pack loaded!");

        // Load world from local storage if not multiplayer
        if (!multiplayer) {
            loadWorldFromLocalStorage();
        } else {
            while (!world.generator.multiplayerSeedLoaded) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }
        world.generator.loadingWorld = false;
    }

    dayNightCycle() {
        if (time > 7.3) {
            time = 1;
        }
        if (time > 3.5 && time < 6.5) day = false;
        else day = true;
        if (!GAMERULES.doDaylightCycle) return;
        time += deltaTime * dayNightSpeed;
    }

    updateEntities(tick = false) {
        const cameraFarX =
            camera.getWorldX(camera.x) - ENTITY_UPDATE_DISTANCE * BLOCK_SIZE;
        const cameraNearX =
            camera.getWorldX(camera.x) + ENTITY_UPDATE_DISTANCE * BLOCK_SIZE;
        world.entities.forEach((entity) => {
            if (entity === world.player) {
                camera.update(world.player);
                if (tick) entity.tickUpdate();
                else entity.update();
                return;
            }
            if (
                entity.position.x >= cameraFarX &&
                entity.position.x <= cameraNearX
            ) {
                if (typeof entity.tickUpdate === "function" && tick)
                    entity.tickUpdate();
                else entity.update();
            }
        });
    }

    updateArray(array, deltaTime) {
        array.forEach((element) => {
            element.update();
        });
    }

    cursorBlockLogic() {
        if (this.pauseMenu?.getActive()) {
            cursorInRange = false;
            if (world.player) {
                world.player.hoverBlock = null;
                world.player.hoverWall = null;
            }
            return;
        }
        const cursorDistance = Math.floor(
            Vector2.Distance(
                world.player.position,
                new Vector2(
                    input.getMousePositionOnBlockGrid().x,
                    input.getMousePositionOnBlockGrid().y
                )
            ) / BLOCK_SIZE
        );
        cursorInRange = !world.player.abilities.instaBuild
            ? cursorDistance <= INTERACT_DISTANCE
            : true;
        world.player.hoverBlock = cursorInRange
            ? world.getBlockAtWorldPosition(
                  input.getMousePositionOnBlockGrid().x,
                  input.getMousePositionOnBlockGrid().y
              )
            : null;
        world.player.hoverWall = cursorInRange
            ? world.getBlockAtWorldPosition(
                  input.getMousePositionOnBlockGrid().x,
                  input.getMousePositionOnBlockGrid().y,
                  true
              )
            : null;
    }

    animateFrame() {
        globalFrame++;
    }
}
