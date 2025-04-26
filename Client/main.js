let lastFrameTime = performance.now();
let fpsDisplay = 0;

let settings = {
    sfx: true,
    music: true,
    lighting: true,
    username: "Player",
};

chat = new Chat();

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
        settings = JSON.parse(settingsString);
    }
}

loadSettings();

function ReverseY(y) {
    return CHUNK_HEIGHT - y;
}

function summonEntity(entity, position, props, sync = false, uuid = null) {
    console.log("Summoning entity:", entity, position, props, uuid);
    const UUID = uuid ? uuid : uuidv4();

    const newEntity = new entity({ UUID: UUID, position: position, ...props });
    entities.push(newEntity);

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

function SpawnPlayer(
    position = new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
    setOnGround = true,
    UUID = null,
    name = null,
    local = true
) {
    const newPlayer = new Player({
        position: position,
        entities: entities,
        UUID: UUID ? UUID : uuidv4(),
        name: name ? name : "Player",
    });

    if (local) player = newPlayer;

    setTimeout(() => {
        if (setOnGround) newPlayer.setOnGround();
    }, 1000);

    entities.push(newPlayer);

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

    await generateWorld();
    updateGame();

    Draw(
        getDimensionChunks(activeDimension),
        calculateFPS(currentFrameTime),
        deltaTime
    );

    lastFrameTime = currentFrameTime;

    requestAnimationFrame(gameLoop);
}

function updateGame() {
    updateEntities();
    if (player) cursorBlockLogic();
    if (hotbar) hotbar.update();
    if (chat) chat.update();
    camera.update(player);
    dayNightCycle();
}

async function initGame() {
    loadingWorld = true;

    console.log("Initializing game...");

    // Wait for texture pack
    console.log("Waiting for texture pack...");
    await waitForTexturePack();
    console.log("Texture pack loaded!");

    // Load world from local storage if not multiplayer
    if (!multiplayer) {
        LoadWorldFromLocalStorage();
    }

    loadingWorld = false;
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

    entities.forEach((entity) => {
        if (entity === player) {
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
    const cursorDistance = Math.floor(
        Vector2.Distance(
            player.position,
            new Vector2(
                input.getMousePositionOnBlockGrid().x,
                input.getMousePositionOnBlockGrid().y
            )
        ) / BLOCK_SIZE
    );

    cursorInRange = !player.abilities.instaBuild
        ? cursorDistance <= INTERACT_DISTANCE
        : true;

    player.hoverBlock = cursorInRange
        ? GetBlockAtWorldPosition(
              input.getMousePositionOnBlockGrid().x,
              input.getMousePositionOnBlockGrid().y
          )
        : null;
    player.hoverWall = cursorInRange
        ? GetBlockAtWorldPosition(
              input.getMousePositionOnBlockGrid().x,
              input.getMousePositionOnBlockGrid().y,
              true
          )
        : null;
}

function animateFrame() {
    globalFrame++;
}
