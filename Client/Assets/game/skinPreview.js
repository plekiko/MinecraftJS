// front-facing skin preview (used by inventory and options menu)
// Denoted by position on player (Left on player = Right in UI)

// Steve / classic (4px arms)
const SKIN_PREVIEW_PARTS = [
    { crop: { x: 4, y: 20, width: 4, height: 12 }, pos: { x: 4, y: 20 } }, // left leg
    { crop: { x: 20, y: 52, width: 4, height: 12 }, pos: { x: 8, y: 20 } }, // right leg
    { crop: { x: 20, y: 20, width: 8, height: 12 }, pos: { x: 4, y: 8 } }, // torso
    { crop: { x: 44, y: 20, width: 4, height: 12 }, pos: { x: 0, y: 8 } }, // right arm
    { crop: { x: 36, y: 52, width: 4, height: 12 }, pos: { x: 12, y: 8 } }, // left arm
    { crop: { x: 8, y: 8, width: 8, height: 8 }, pos: { x: 4, y: 0 } }, // head
];
const SKIN_PREVIEW_OVERLAY_PARTS = [
    { crop: { x: 4, y: 36, width: 4, height: 12 }, pos: { x: 4, y: 20 } }, // right leg overlay
    { crop: { x: 4, y: 52, width: 4, height: 12 }, pos: { x: 8, y: 20 } }, // left leg overlay
    { crop: { x: 20, y: 32, width: 8, height: 12 }, pos: { x: 4, y: 8 } }, // torso overlay
    { crop: { x: 44, y: 36, width: 4, height: 12 }, pos: { x: 0, y: 8 } }, // right arm overlay
    { crop: { x: 52, y: 52, width: 4, height: 12 }, pos: { x: 12, y: 8 } }, // left arm overlay
    { crop: { x: 40, y: 8, width: 8, height: 8 }, pos: { x: 4, y: 0 } }, // head overlay
];

// Alex / slim (3px arms)
const ALEX_SKIN_PREVIEW_PARTS = [
    { crop: { x: 4, y: 20, width: 4, height: 12 }, pos: { x: 4, y: 20 } }, // left leg
    { crop: { x: 20, y: 52, width: 4, height: 12 }, pos: { x: 8, y: 20 } }, // right leg
    { crop: { x: 20, y: 20, width: 8, height: 12 }, pos: { x: 4, y: 8 } }, // torso
    { crop: { x: 44, y: 20, width: 3, height: 12 }, pos: { x: 1, y: 8 } }, // right arm
    { crop: { x: 36, y: 52, width: 3, height: 12 }, pos: { x: 12, y: 8 } }, // left arm
    { crop: { x: 8, y: 8, width: 8, height: 8 }, pos: { x: 4, y: 0 } }, // head
];
const ALEX_SKIN_PREVIEW_OVERLAY_PARTS = [
    { crop: { x: 4, y: 36, width: 4, height: 12 }, pos: { x: 4, y: 20 } }, // right leg overlay
    { crop: { x: 4, y: 52, width: 4, height: 12 }, pos: { x: 8, y: 20 } }, // left leg overlay
    { crop: { x: 20, y: 32, width: 8, height: 12 }, pos: { x: 4, y: 8 } }, // torso overlay
    { crop: { x: 44, y: 36, width: 3, height: 12 }, pos: { x: 1, y: 8 } }, // right arm overlay
    { crop: { x: 52, y: 52, width: 3, height: 12 }, pos: { x: 12, y: 8 } }, // left arm overlay
    { crop: { x: 40, y: 8, width: 8, height: 8 }, pos: { x: 4, y: 0 } }, // head overlay
];

// 64x32 skins only store one arm and one leg, so the other side is mirrored
const LEGACY_SKIN_PREVIEW_PARTS = [
    { crop: { x: 4, y: 20, width: 4, height: 12 }, pos: { x: 4, y: 20 } }, // left leg
    {
        crop: { x: 4, y: 20, width: 4, height: 12 },
        pos: { x: 8, y: 20 },
        mirror: true,
    }, // right leg
    { crop: { x: 20, y: 20, width: 8, height: 12 }, pos: { x: 4, y: 8 } }, // torso
    { crop: { x: 44, y: 20, width: 4, height: 12 }, pos: { x: 0, y: 8 } }, // right arm
    {
        crop: { x: 44, y: 20, width: 4, height: 12 },
        pos: { x: 12, y: 8 },
        mirror: true,
    }, // left arm
    { crop: { x: 8, y: 8, width: 8, height: 8 }, pos: { x: 4, y: 0 } }, // head
];
// the hat is the only overlay a 64x32 skin has
const LEGACY_SKIN_PREVIEW_OVERLAY_PARTS = [
    { crop: { x: 40, y: 8, width: 8, height: 8 }, pos: { x: 4, y: 0 } }, // head overlay
];

function isLegacySkin(image) {
    const width = image?.naturalWidth || image?.width || 0;
    const height = image?.naturalHeight || image?.height || 0;
    return height > 0 && width >= height * 2;
}

function normalizeSkinModel(model) {
    return model === "alex" ? "alex" : "steve";
}

// Auto-detect Alex (slim) vs Steve (classic) by checking pixels that are only
// filled on the 4px-wide classic arms. If those regions are fully transparent,
// the skin is slim. Legacy 64x32 skins are always classic.
function detectSkinModel(image) {
    const width = image?.naturalWidth || image?.width || 0;
    const height = image?.naturalHeight || image?.height || 0;
    if (!width || !height) return "steve";
    if (isLegacySkin(image)) return "steve";

    try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0);

        // Support HD skins that are a multiple of 64x64
        const scale = width / 64;

        const hasOpaquePixel = (x, y, w, h) => {
            const data = ctx.getImageData(
                Math.round(x * scale),
                Math.round(y * scale),
                Math.max(1, Math.round(w * scale)),
                Math.max(1, Math.round(h * scale)),
            ).data;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] !== 0) return true;
            }
            return false;
        };

        // Regions present only on the classic model (right + left arm)
        const isSlim =
            !hasOpaquePixel(50, 16, 2, 4) ||
            !hasOpaquePixel(54, 20, 2, 12) ||
            !hasOpaquePixel(42, 48, 2, 4) ||
            !hasOpaquePixel(46, 52, 2, 12);

        return isSlim ? "alex" : "steve";
    } catch (err) {
        console.warn("Failed to detect skin model:", err);
        return "steve";
    }
}

function drawSkinPreview(ctx, image, baseX, baseY, scale, model = "steve") {
    if (!image?.complete) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";
    const drawParts = (parts) => {
        for (const part of parts) {
            const { crop, pos, mirror } = part;
            const dx = Math.round(baseX + pos.x * scale);
            const dy = Math.round(baseY + pos.y * scale);
            const dw = Math.round(crop.width * scale);
            const dh = Math.round(crop.height * scale);

            if (mirror) {
                ctx.save();
                ctx.translate(dx + dw, dy);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    image,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    0,
                    0,
                    dw,
                    dh,
                );
                ctx.restore();
                continue;
            }

            ctx.drawImage(
                image,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                dx,
                dy,
                dw,
                dh,
            );
        }
    };

    // Legacy 64x32 skins don't have a slim layout
    if (isLegacySkin(image)) {
        drawParts(LEGACY_SKIN_PREVIEW_PARTS);
        drawParts(LEGACY_SKIN_PREVIEW_OVERLAY_PARTS);
    } else if (normalizeSkinModel(model) === "alex") {
        drawParts(ALEX_SKIN_PREVIEW_PARTS);
        drawParts(ALEX_SKIN_PREVIEW_OVERLAY_PARTS);
    } else {
        drawParts(SKIN_PREVIEW_PARTS);
        drawParts(SKIN_PREVIEW_OVERLAY_PARTS);
    }
    ctx.restore();
}
