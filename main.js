let lastFrameTime = performance.now();
let fpsDisplay = 0;

chat = new Chat();

if (SPAWN_PLAYER) {
    player = new Player({
        position: new Vector2(0, TERRAIN_HEIGHT * BLOCK_SIZE),
        entities: entities,
    });

    entities.push(player);

    hotbar = new Hotbar(player.inventory);
}

summonEntity(Pig, structuredClone(player.position));

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

function summonEntity(entity, position) {
    entities.push(new entity({ position: position }));
}

function gameLoop() {
    const currentFrameTime = performance.now();
    const deltaTime = (currentFrameTime - lastFrameTime) / 1000;

    if (deltaTime <= 1) {
        updateGame(deltaTime);
    }

    Draw(chunks, calculateFPS(currentFrameTime), deltaTime);

    lastFrameTime = currentFrameTime;
    requestAnimationFrame(gameLoop);
}

function updateBlocks(deltaTime) {
    updatingBlocks.forEach((block) => {
        block.update(deltaTime);
    });
}

function updateGame(deltaTime) {
    updateArray(entities, deltaTime);

    updateDebug();

    updateBlocks(deltaTime);

    if (player) cursorBlockLogic();

    if (hotbar) hotbar.update(deltaTime);

    if (chat) chat.update(deltaTime);

    animateFrame();

    camera.update(deltaTime, player);
}

function updateArray(array, deltaTime) {
    array.forEach((element) => {
        element.update(deltaTime);
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
