import { ctx } from "./canvas.js";

export { ctx };

/** Shared 2D draw helper used by classes + renderer (keeps classes off the renderer cycle). */
export function drawSimpleImage({
    image,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    scale = 1,
    centerX = false,
    centerY = false,
    opacity = 1,
    crop = { x: 0, y: 0, width: 0, height: 0 },
}) {
    if (!image || !ctx) return;

    ctx.globalAlpha = opacity;

    const shouldCrop = crop.width > 0 && crop.height > 0;
    const sourceWidth = shouldCrop ? crop.width : image.width;
    const sourceHeight = shouldCrop ? crop.height : image.height;
    const sourceX = shouldCrop ? crop.x : 0;
    const sourceY = shouldCrop ? crop.y : 0;

    const drawWidth = width || sourceWidth * scale;
    const drawHeight = height || sourceHeight * scale;

    const drawX = centerX ? x - drawWidth / 2 : x;
    const drawY = centerY ? y - drawHeight / 2 : y;

    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
    );
}
