const game = new Game();
let world = null;

window.onload = async function () {
    await game.initGame().catch((error) => {
        console.error("Failed to initialize game:", error);
    });

    requestAnimationFrame(() => game.gameLoop());
};
