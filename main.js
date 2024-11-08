let lastFrameTime = performance.now();
let fpsDisplay = 0;

chat = new Chat();

if (SPAWN_PLAYER) {
    player = new Player({
        position: new Vector2(0, TERRAIN_HEIGHT * BLOCK_SIZE),
    });

    entities.push(player);

    hotbar = new Hotbar(player.inventory);
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

function gameLoop() {
    const currentFrameTime = performance.now();
    const deltaTime = (currentFrameTime - lastFrameTime) / 1000;

    if (document.hasFocus()) {
        updateGame(deltaTime);
    }
    Draw(chunks, calculateFPS(currentFrameTime));

    lastFrameTime = currentFrameTime;
    requestAnimationFrame(gameLoop);
}

function updateBlocks(deltaTime) {
    updatingBlocks.forEach((block) => {
        block.update(deltaTime);
    });
}

function updateGame(deltaTime) {
    entities.forEach((entity) => {
        entity.update(deltaTime);
    });

    updateDebug();

    updateBlocks(deltaTime);

    if (player) cursorBlockLogic();

    if (hotbar) hotbar.update(deltaTime);

    if (chat) chat.update(deltaTime);

    animateFrame();

    camera.update(deltaTime, player);
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
