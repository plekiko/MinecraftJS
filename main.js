let lastFrameTime = performance.now();
let fpsDisplay = 0;

chat = new Chat();

// window.onbeforeunload = (e) => {
//     alert("You are about to close the game!");
//     var dialogText = "Whoops, you probably didn't mean to close the game!";
//     e.returnValue = dialogText;
//     return dialogText;
// };

// if (SPAWN_PLAYER) {
//     setTimeout(() => {
//         SpawnPlayer();
//         // summonEntity(Zombie, structuredClone(player.position));
//     }, 100);
// }

function SpawnPlayer(
    position = new Vector2(0, (CHUNK_HEIGHT / 2) * BLOCK_SIZE),
    setOnGround = true
) {
    player = new Player({
        position: position,
        entities: entities,
    });

    if (setOnGround) player.setOnGround();

    entities.push(player);

    hotbar = new Hotbar(player.inventory);
}

function ReverseY(y) {
    return CHUNK_HEIGHT - y;
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

function summonEntity(entity, position, props) {
    const newEntity = new entity({ position: position, ...props });
    entities.push(newEntity);
    return newEntity;
}

function gameLoop() {
    // Pause the game if the window is not focused
    // if (!document.hasFocus()) {
    //     requestAnimationFrame(gameLoop);
    //     return;
    // }

    const currentFrameTime = performance.now();
    deltaTime = (currentFrameTime - lastFrameTime) / 1000;
    passedTime += deltaTime;

    if (deltaTime <= 1) {
        updateGame();
    }

    Draw(chunks, calculateFPS(currentFrameTime), deltaTime);

    lastFrameTime = currentFrameTime;
    requestAnimationFrame(gameLoop);
}

function updateGame() {
    updateEntities();

    if (player) cursorBlockLogic();

    if (hotbar) hotbar.update();

    if (chat) chat.update();

    animateFrame();

    camera.update(player);

    dayNightCycle();
}

function dayNightCycle() {
    if (time > 7.3) {
        time = 1;
    }

    if (!GAMERULES.doDaylightCycle) return;

    time += deltaTime * dayNightSpeed;

    if (time > 3.5 && time < 6.5) day = false;
    else day = true;
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

requestAnimationFrame(gameLoop);
