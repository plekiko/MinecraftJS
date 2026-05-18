// Lightweight bootstrap loader to sequentially load existing non-module scripts
(function () {
    const scripts = [
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
        "node_modules/tooloud/dist/tooloud.min.js",

        "Assets/utils/indexDB.js",

        "Assets/utils/globals.js",
        "Assets/utils/keyBindings.js",
        "Assets/utils/input.js",
        "Assets/utils/classes.js",
        "Assets/game/camera.js",
        "Assets/utils/object.js",
        "Assets/game/sounds.js",
        "Assets/game/music.js",
        "Assets/game/lootTable.js",
        "Assets/game/item.js",
        "Assets/game/items.js",
        "Assets/world/block.js",
        "Assets/world/blocks.js",

        "Assets/world/particle.js",
        "Assets/world/particleEmitter.js",

        "Assets/world/chestLoot.js",
        "Assets/world/trees.js",
        "Assets/utils/noise.js",
        "Assets/world/biome.js",
        "Assets/world/dimension.js",
        "Assets/world/structure.js",
        "Assets/world/structures.js",
        "Assets/world/chunk.js",
        "Assets/game/inventoryItem.js",
        "Assets/game/recipe.js",
        "Assets/game/recipes.js",
        "Assets/game/skinPreview.js",
        "Assets/game/inventory.js",
        "Assets/game/hotbar.js",
        "Assets/utils/renderer.js",
        "Assets/world/generator.js",
        "Assets/world/world.js",
        "Assets/world/saving.js",
        "Assets/game/body.js",
        "Assets/game/entity.js",
        "Assets/entities/drop.js",
        "Assets/entities/mob.js",
        "Assets/entities/projectile.js",

        "Assets/entities/projectiles/snowBall.js",

        "Assets/entities/mobs/pig.js",
        "Assets/entities/mobs/cow.js",
        "Assets/entities/mobs/sheep.js",
        "Assets/entities/mobs/zombie.js",
        "Assets/entities/mobs/creeper.js",
        "Assets/entities/mobs/wither_skeleton.js",

        "Assets/entities/fallingBlock.js",
        "Assets/entities/TNT.js",
        "Assets/entities/entities.js",

        "Assets/entities/player.js",
        "Assets/game/chat.js",
        "Assets/game/pauseMenu.js",
        "Assets/game/game.js",
        "main.js",
        "debug.js",

        "buttonUtils.js",
        "Assets/utils/texturePackLoader.js",

        "Assets/multiplayer/messageHandler.js",
        "Assets/multiplayer/server.js",

        "Assets/utils/screenshotChunks.js",
    ];

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const el = document.createElement("script");
            el.src = src;
            el.defer = false;
            el.async = false;
            el.onload = () => resolve(src);
            el.onerror = (ev) => reject(new Error("Failed to load " + src));
            document.body.appendChild(el);
        });
    }

    async function loadAll() {
        for (const s of scripts) {
            try {
                await loadScript(s);
            } catch (err) {
                console.error(err);
                throw err;
            }
        }
    }

    // Kick off loading after DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
            loadAll().catch(() => {}),
        );
    } else {
        loadAll().catch(() => {});
    }
})();
