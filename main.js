let lastFrameTime = performance.now();

function gameLoop() {
    const currentFrameTime = performance.now();
    const deltaTime = (currentFrameTime - lastFrameTime) / 1000;

    updateGame(deltaTime);

    Draw();
    DrawChunks(chunks);

    lastFrameTime = currentFrameTime;

    requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    camera.update(deltaTime);
}

requestAnimationFrame(gameLoop);
