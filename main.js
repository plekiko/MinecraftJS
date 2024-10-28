let lastFrameTime = performance.now();
let fpsDisplay = 0;

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

    updateGame(deltaTime);

    Draw(chunks, calculateFPS(currentFrameTime));

    lastFrameTime = currentFrameTime;
    requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    camera.update(deltaTime);
    animateFrame();
}

function animateFrame() {
    globalFrame++;
}

requestAnimationFrame(gameLoop);
