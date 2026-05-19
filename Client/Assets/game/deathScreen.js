function showDeathScreen() {
    const deathScreen = document.getElementById("death-screen");
    const scoreValue = document.getElementById("death-score-value");
    const causeText = document.getElementById("death-cause");
    if (!deathScreen) return;

    if (scoreValue && world?.player) {
        scoreValue.textContent = `${world.player.score ?? 0}`;
    }

    if (causeText && world?.player) {
        causeText.textContent =
            world.player.deathCause ||
            `${world.player.name || "Player"} was killed`;
        causeText.style.display = "block";
        causeText.style.opacity = "1";
    }

    deathScreen.style.display = "flex";
    document.documentElement.style.setProperty("--drawMouse", "default");
    if (world?.player) world.player.canMove = false;
}

function hideDeathScreen() {
    const deathScreen = document.getElementById("death-screen");
    if (!deathScreen) return;

    deathScreen.style.display = "none";
    document.documentElement.style.setProperty("--drawMouse", "none");
}

function respawnFromDeathScreen() {
    if (!world?.player) return;

    world.player.isDead = false;
    world.player.respawn();
    hideDeathScreen();
}
