/** DOM canvas handles (no Camera — avoids import cycles with input). */
export const CANVAS = document.getElementById("canvas");
export const ctx = CANVAS ? CANVAS.getContext("2d") : null;
export var r = document.querySelector(":root");

if (CANVAS && ctx) {
    CANVAS.width = 1600;
    CANVAS.height = 900;
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
}

if (r) {
    r.style.setProperty("--drawMouse", "none");
}
