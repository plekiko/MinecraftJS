let lastFrameTime = performance.now();
let fpsDisplay = 0;

chat = new Chat();

if (SPAWN_PLAYER) {
    setTimeout(() => {
        player = new Player({
            position: new Vector2(0, 0),
            entities: entities,
        });

        player.setOnGround();

        entities.push(player);

        hotbar = new Hotbar(player.inventory);
        summonEntity(Cow, structuredClone(player.position));
    }, 100);
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
    entities.push(new entity({ position: position, ...props }));
}

function gameLoop() {
    const currentFrameTime = performance.now();
    deltaTime = (currentFrameTime - lastFrameTime) / 1000;

    if (deltaTime <= 1) {
        updateGame();
    }

    Draw(chunks, calculateFPS(currentFrameTime), deltaTime);

    lastFrameTime = currentFrameTime;
    requestAnimationFrame(gameLoop);
}

function updateBlocks() {
    updatingBlocks.forEach((block) => {
        block.update();
    });
}

function updateGame() {
    updateEntities();

    updateBlocks();

    if (player) cursorBlockLogic();

    if (hotbar) hotbar.update();

    if (chat) chat.update();

    animateFrame();

    camera.update(player);
}

function updateEntities() {
    if (!player) {
        updateArray(entities, deltaTime);
        return;
    }

    const playerFarX = player.position.x + ENTITY_UPDATE_DISTANCE * BLOCK_SIZE;
    const playerNearX = player.position.x - ENTITY_UPDATE_DISTANCE * BLOCK_SIZE;

    entities.forEach((entity) => {
        if (entity === player) {
            entity.update();
            return;
        }
        if (
            entity.position.x >= playerNearX &&
            entity.position.x <= playerFarX
        ) {
            entity.update();
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
                input.getMousePositionOnBlockGrid().x + Math.floor(camera.x),
                input.getMousePositionOnBlockGrid().y + Math.floor(camera.y)
            )
        ) / BLOCK_SIZE
    );

    cursorInRange = !player.abilities.instaBuild
        ? cursorDistance <= INTERACT_DISTANCE
        : true;

    player.hoverBlock = cursorInRange
        ? GetBlockAtWorldPosition(
              input.getMousePositionOnBlockGrid().x + Math.floor(camera.x),
              input.getMousePositionOnBlockGrid().y + Math.floor(camera.y),
              false
          )
        : null;
}

function animateFrame() {
    globalFrame++;
}

requestAnimationFrame(gameLoop);
