// front-facing skin preview (used by inventory and options menu)
// Denoted by position on player (Left on player = Right in UI)
const SKIN_PREVIEW_PARTS = [
    { crop: { x: 4, y: 20, width: 4, height: 12 }, pos: { x: 4, y: 20 } },   // left leg
    { crop: { x: 20, y: 52, width: 4, height: 12 }, pos: { x: 8, y: 20 } },   // right leg
    { crop: { x: 20, y: 20, width: 8, height: 12 }, pos: { x: 4, y: 8 } },   // torso
    { crop: { x: 44, y: 20, width: 4, height: 12 }, pos: { x: 0, y: 8 } },   // right arm
    { crop: { x: 36, y: 52, width: 4, height: 12 }, pos: { x: 12, y: 8 } },  // left arm
    { crop: { x: 8, y: 8, width: 8, height: 8 }, pos: { x: 4, y: 0 } },      // head
];
const SKIN_PREVIEW_OVERLAY_PARTS = [
    { crop: { x: 4, y: 36, width: 4, height: 12 }, pos: { x: 4, y: 20 } },   // right leg overlay
    { crop: { x: 4, y: 52, width: 4, height: 12 }, pos: { x: 8, y: 20 } },   // left leg overlay
    { crop: { x: 20, y: 32, width: 8, height: 12 }, pos: { x: 4, y: 8 } },   // torso overlay
    { crop: { x: 44, y: 36, width: 4, height: 12 }, pos: { x: 0, y: 8 } },   // right arm overlay
    { crop: { x: 52, y: 52, width: 4, height: 12 }, pos: { x: 12, y: 8 } },  // left arm overlay
    { crop: { x: 40, y: 8, width: 8, height: 8 }, pos: { x: 4, y: 0 } },     // head overlay
];

function drawSkinPreview(ctx, image, baseX, baseY, scale) {
    if (!image?.complete) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";
    const drawParts = (parts) => {
        for (const part of parts) {
            const { crop, pos } = part;
            const dx = Math.round(baseX + pos.x * scale);
            const dy = Math.round(baseY + pos.y * scale);
            const dw = Math.round(crop.width * scale);
            const dh = Math.round(crop.height * scale);
            ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, dx, dy, dw, dh);
        }
    };
    drawParts(SKIN_PREVIEW_PARTS);
    drawParts(SKIN_PREVIEW_OVERLAY_PARTS);
    ctx.restore();
}
