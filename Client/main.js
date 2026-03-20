let lastFrameTime = performance.now();
let fpsDisplay = 0;

world = new World();

let settings = {
    musicVolume: 100,
    sfxVolume: 100,
    lighting: true,
    username: "Player",
};

chat = new Chat();
pauseMenu = new PauseMenu();

function waitForTexturePack() {
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

function loadSettings() {
    // load using local storage
    const settingsString = localStorage.getItem("settings");

    if (settingsString) {
        const loaded = JSON.parse(settingsString);
        settings.lighting = loaded.lighting !== false;
        settings.username = loaded.username || "Player";
        settings.musicVolume =
            loaded.musicVolume ?? (loaded.music === false ? 0 : 100);
        settings.sfxVolume =
            loaded.sfxVolume ?? (loaded.sfx === false ? 0 : 100);
    }
}

loadSettings();

function summonEntity(entity, position, props, sync = false, uuid = null) {
    // console.log("Summoning entity:", entity, position, props, uuid);
    const UUID = uuid ? uuid : uuidv4();

    const newEntity = new entity(world, {
        UUID: UUID,
        position: position,
        ...props,
    });
    newEntity.dimension = activeDimension;

    world.entities.push(newEntity);

    if (sync) {
        server.send({
            type: "summonEntity",
            message: {
                entity: newEntity.name,
                props: props,
                position: position,
                UUID: UUID,
            },
        });
    }

    return newEntity;
}

function spawnDrop(position, props) {
    const uuid = uuidv4();
    const drop = summonEntity(Drop, position, props, false, uuid);
    if (multiplayer) {
        server.send({
            type: "summonDrop",
            message: { UUID: uuid, position: position, props: props },
            sender: world.player?.UUID,
        });
    }
    return drop;
}

function spawnPlayer(
    position = new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
    setOnGround = true,
    UUID = null,
    name = null,
    local = true,
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

function calculateFPS(currentFrameTime) {
    if (!calculateFPS.lastUpdate) calculateFPS.lastUpdate = currentFrameTime;
    if (!calculateFPS.frameCount) calculateFPS.frameCount = 0;

    calculateFPS.frameCount++;
    if (currentFrameTime - calculateFPS.lastUpdate >= 1000) {
        fpsDisplay = calculateFPS.frameCount;
        calculateFPS.frameCount = 0;
        calculateFPS.lastUpdate = currentFrameTime;
    }

    return fpsDisplay;
}

async function gameLoop() {
    const currentFrameTime = performance.now();
    deltaTime = (currentFrameTime - lastFrameTime) / 1000;
    passedTime += deltaTime;

    // if (!document.hasFocus()) {
    //     lastFrameTime = currentFrameTime;
    //     requestAnimationFrame(gameLoop);
    //     return;
    // }

    await world.startGenerator();
    updateGame();

    draw(
        getDimensionChunks(activeDimension),
        calculateFPS(currentFrameTime),
        deltaTime,
    );

    lastFrameTime = currentFrameTime;

    input.resetKeysPressed();

    requestAnimationFrame(gameLoop);
}

function updateGame() {
    updateEntities();
    world.updateParticleEmitters();

    if (world.player) cursorBlockLogic();
    if (hotbar) hotbar.update();
    if (pauseMenu) pauseMenu.update();
    if (chat) chat.update();
    if (typeof handleDebugInput === "function") handleDebugInput();
    dayNightCycle();
}

async function initGame() {
    world.generator.loadingWorld = true;

    console.log("Initializing game...");

    // Wait for texture pack
    console.log("Waiting for texture pack...");
    await waitForTexturePack();
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

requestAnimationFrame(gameLoop);

window.onload = function () {
    initGame().catch((error) => {
        console.error("Failed to initialize game:", error);
    });
};

function dayNightCycle() {
    if (time > 7.3) {
        time = 1;
    }

    if (time > 3.5 && time < 6.5) day = false;
    else day = true;

    if (!GAMERULES.doDaylightCycle) return;

    time += deltaTime * dayNightSpeed;
}

function updateEntities(tick = false) {
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

function updateArray(array, deltaTime) {
    array.forEach((element) => {
        element.update();
    });
}

function cursorBlockLogic() {
    if (pauseMenu?.getActive()) {
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
                input.getMousePositionOnBlockGrid().y,
            ),
        ) / BLOCK_SIZE,
    );

    cursorInRange = !world.player.abilities.instaBuild
        ? cursorDistance <= INTERACT_DISTANCE
        : true;

    world.player.hoverBlock = cursorInRange
        ? world.getBlockAtWorldPosition(
              input.getMousePositionOnBlockGrid().x,
              input.getMousePositionOnBlockGrid().y,
          )
        : null;
    world.player.hoverWall = cursorInRange
        ? world.getBlockAtWorldPosition(
              input.getMousePositionOnBlockGrid().x,
              input.getMousePositionOnBlockGrid().y,
              true,
          )
        : null;
}

function animateFrame() {
    globalFrame++;
}
