import { randomUUID } from 'crypto';

export function uuidv4() {
    return randomUUID();
}

export function Vector2(x = 0, y = 0) {
    return { x, y };
}

export function RandomRange(min, max) {
    return Math.random() * (max - min) + min;
}
