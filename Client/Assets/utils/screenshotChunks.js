// Screenshot nearest chunks utility
(function () {
    function createGradientForDimension(ctx, width, height, dimension) {
        const dayColor = dimension.backgroundGradient.dayColor;
        const nightColor = dimension.backgroundGradient.nightColor;
        const sunsetColor = dimension.backgroundGradient.sunsetColor;
        const midnightColor = dimension.backgroundGradient.midnightColor;

        // simple static blend based on time variable if available
        const t = typeof time !== "undefined" ? Math.sin(time) * 0.5 + 0.5 : 1;
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

    function screenshotNearestChunks(count = 10, lighting = false, filename) {
        if (!world || !world.player) {
            console.warn("No world or player available to screenshot.");
            return null;
        }

        const chunksMap = getDimensionChunks(activeDimension);
        if (!chunksMap || chunksMap.size === 0) {
            console.warn("No chunks loaded in current dimension.");
            return null;
        }

        const entries = Array.from(chunksMap.entries());

        const playerX = world.player.position.x;

        entries.sort((a, b) => {
            const ax = a[0] + (CHUNK_WIDTH * BLOCK_SIZE) / 2;
            const bx = b[0] + (CHUNK_WIDTH * BLOCK_SIZE) / 2;
            return Math.abs(ax - playerX) - Math.abs(bx - playerX);
        });

        const selected = entries.slice(0, count).map((e) => e[1]);

        // compute bounds
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

        // Limit canvas size to avoid extremely large screenshots
        const MAX_DIM = 8000;
        const scale = Math.min(1, MAX_DIM / Math.max(width, height));

        const off = document.createElement("canvas");
        off.width = Math.ceil(width * scale);
        off.height = Math.ceil(height * scale);
        const offCtx = off.getContext("2d");
        offCtx.imageSmoothingEnabled = false;

        // Fill background gradient
        const dim = getDimension(activeDimension);
        offCtx.fillStyle = createGradientForDimension(
            offCtx,
            off.width,
            off.height,
            dim,
        );
        offCtx.fillRect(0, 0, off.width, off.height);

        // Build a minimal camera for offscreen rendering
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

        // Optionally calculate lighting for selected chunks
        // Snapshot original light values so we can restore them after rendering
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
            // Temporarily set world's render-distance map to only these chunks so light calc is constrained
            const prevMap = world.chunks_in_render_distance;
            world.chunks_in_render_distance = new Map();
            for (const chunk of selected)
                world.chunks_in_render_distance.set(chunk.x, chunk);

            // Run sky light and propagate light sources
            if (typeof world.globalUpdateSkyLight === "function")
                world.globalUpdateSkyLight();
            if (typeof world.globalRecalculateLight === "function")
                world.globalRecalculateLight();

            // restore previous map after calculation (we keep modified light levels on blocks but world map restored)
            world.chunks_in_render_distance = prevMap;
        } else {
            // Ensure no lighting effects: set all selected blocks to maximum light
            for (const chunk of selected) {
                for (let row of chunk.blocks) {
                    for (let block of row) {
                        block.lightLevel = 15;
                        block.sunLight = true;
                    }
                }
            }
        }

        // Draw selected chunks into the offscreen canvas using a scaled context
        offCtx.save();
        // scale so drawing coordinates remain in world pixels
        offCtx.scale(scale, scale);

        for (const chunk of selected) {
            try {
                chunk.draw(offCtx, camera);
            } catch (e) {
                console.error("Error drawing chunk:", e);
            }
        }

        offCtx.restore();

        // restore original light states
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

    // expose globally
    window.screenshotNearestChunks = screenshotNearestChunks;
})();
