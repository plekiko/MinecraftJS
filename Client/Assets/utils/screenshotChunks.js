import { runtime } from "./runtime.js";
import { BLOCK_SIZE, CHUNK_HEIGHT, CHUNK_WIDTH } from "./globals.js";
import {
    activeDimension,
    getDimension,
    getDimensionChunks,
} from "../world/dimension.js";

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}

function createGradientForDimension(ctx, width, height, dimension) {
    const dayColor = dimension.backgroundGradient.dayColor;
    const nightColor = dimension.backgroundGradient.nightColor;
    const sunsetColor = dimension.backgroundGradient.sunsetColor;
    const midnightColor = dimension.backgroundGradient.midnightColor;

    const t = Math.sin(runtime.time) * 0.5 + 0.5;
    const topColor = interpolateColor(nightColor, dayColor, t);
    const bottomColor = interpolateColor(midnightColor, sunsetColor, t);

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (!dimension.alwaysDay) {
        grad.addColorStop(0, topColor);
        grad.addColorStop(1, bottomColor);
    } else {
        grad.addColorStop(0, sunsetColor);
        grad.addColorStop(1, dayColor);
    }
    return grad;
}

export function screenshotNearestChunks(count = 10, lighting = false, filename) {
    if (!runtime.world || !runtime.world.player) {
        console.warn("No world or player available to screenshot.");
        return null;
    }

    const chunksMap = getDimensionChunks(activeDimension);
    if (!chunksMap || chunksMap.size === 0) {
        console.warn("No chunks loaded in current dimension.");
        return null;
    }

    const entries = Array.from(chunksMap.entries());
    const playerX = runtime.world.player.position.x;

    entries.sort((a, b) => {
        const ax = a[0] + (CHUNK_WIDTH * BLOCK_SIZE) / 2;
        const bx = b[0] + (CHUNK_WIDTH * BLOCK_SIZE) / 2;
        return Math.abs(ax - playerX) - Math.abs(bx - playerX);
    });

    const selected = entries.slice(0, count).map((e) => e[1]);

    let minX = Infinity;
    let maxX = -Infinity;
    for (const c of selected) {
        minX = Math.min(minX, c.x);
        maxX = Math.max(maxX, c.x + CHUNK_WIDTH * BLOCK_SIZE);
    }

    const minY = 0;
    const maxY = CHUNK_HEIGHT * BLOCK_SIZE;
    const width = Math.max(1, Math.ceil(maxX - minX));
    const height = Math.max(1, Math.ceil(maxY - minY));

    const MAX_DIM = 8000;
    const scale = Math.min(1, MAX_DIM / Math.max(width, height));

    const off = document.createElement("canvas");
    off.width = Math.ceil(width * scale);
    off.height = Math.ceil(height * scale);
    const offCtx = off.getContext("2d");
    offCtx.imageSmoothingEnabled = false;

    const dim = getDimension(activeDimension);
    offCtx.fillStyle = createGradientForDimension(
        offCtx,
        off.width,
        off.height,
        dim,
    );
    offCtx.fillRect(0, 0, off.width, off.height);

    const camera = {
        x: minX,
        y: minY,
        isInScreen(worldPos, worldSize) {
            const sx = Math.round((worldPos.x - this.x) * scale);
            const sy = Math.round((worldPos.y - this.y) * scale);
            return !(
                sx + worldSize.x * scale < 0 ||
                sx > off.width ||
                sy + worldSize.y * scale < 0 ||
                sy > off.height
            );
        },
    };

    const originalLightStates = [];
    for (const chunk of selected) {
        for (let row of chunk.blocks) {
            for (let block of row) {
                originalLightStates.push({
                    block,
                    lightLevel: block.lightLevel,
                    sunLight: block.sunLight,
                });
            }
        }
    }

    if (lighting) {
        const prevMap = runtime.world.chunks_in_render_distance;
        runtime.world.chunks_in_render_distance = new Map();
        for (const chunk of selected)
            runtime.world.chunks_in_render_distance.set(chunk.x, chunk);

        if (typeof runtime.world.globalUpdateSkyLight === "function")
            runtime.world.globalUpdateSkyLight();
        if (typeof runtime.world.globalRecalculateLight === "function")
            runtime.world.globalRecalculateLight();

        runtime.world.chunks_in_render_distance = prevMap;
    } else {
        for (const chunk of selected) {
            for (let row of chunk.blocks) {
                for (let block of row) {
                    block.lightLevel = 15;
                    block.sunLight = true;
                }
            }
        }
    }

    offCtx.save();
    offCtx.scale(scale, scale);

    for (const chunk of selected) {
        try {
            chunk.draw(offCtx, camera);
        } catch (e) {
            console.error("Error drawing chunk:", e);
        }
    }

    offCtx.restore();

    for (const s of originalLightStates) {
        s.block.lightLevel = s.lightLevel;
        s.block.sunLight = s.sunLight;
    }

    const dataUrl = off.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename || `chunks_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    return dataUrl;
}

window.screenshotNearestChunks = screenshotNearestChunks;
