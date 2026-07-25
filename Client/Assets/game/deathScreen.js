import { runtime } from "../utils/runtime.js";

export function showDeathScreen() {
    const deathScreen = document.getElementById("death-screen");
    const scoreValue = document.getElementById("death-score-value");
    const causeText = document.getElementById("death-cause");
    if (!deathScreen) return;

    if (scoreValue && runtime.world?.player) {
        scoreValue.textContent = `${runtime.world.player.score ?? 0}`;
    }

    if (causeText && runtime.world?.player) {
        causeText.textContent =
            runtime.world.player.deathCause ||
            `${runtime.world.player.name || "Player"} was killed`;
        causeText.style.display = "block";
        causeText.style.opacity = "1";
    }

    deathScreen.style.display = "flex";
    document.documentElement.style.setProperty("--drawMouse", "default");
    if (runtime.world?.player) runtime.world.player.canMove = false;
}

export function hideDeathScreen() {
    const deathScreen = document.getElementById("death-screen");
    if (!deathScreen) return;

    deathScreen.style.display = "none";
    document.documentElement.style.setProperty("--drawMouse", "none");
}

export function respawnFromDeathScreen() {
    if (!runtime.world?.player) return;

    runtime.world.player.isDead = false;
    runtime.world.player.respawn();
    hideDeathScreen();
}
