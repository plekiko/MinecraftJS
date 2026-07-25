/** Pure math helpers with no game imports. */

export function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
