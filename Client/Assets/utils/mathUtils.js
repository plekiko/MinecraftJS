/** Pure math helpers with no game imports (avoids registry load cycles). */

export function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
