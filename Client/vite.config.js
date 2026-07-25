import { defineConfig } from "vite";
import { resolve } from "path";
import { cpSync, existsSync } from "fs";

function copyStaticAssets() {
    return {
        name: "copy-static-assets",
        closeBundle() {
            const dist = resolve(__dirname, "dist");
            const assets = resolve(__dirname, "Assets");
            if (existsSync(assets)) {
                cpSync(assets, resolve(dist, "Assets"), { recursive: true });
            }
            for (const f of ["menu.css", "style.css"]) {
                const src = resolve(__dirname, f);
                if (existsSync(src)) cpSync(src, resolve(dist, f));
            }
        },
    };
}

export default defineConfig({
    root: ".",
    publicDir: false,
    plugins: [copyStaticAssets()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                game: resolve(__dirname, "game.html"),
                structureCreator: resolve(__dirname, "structureCreator.html"),
            },
        },
    },
    server: {
        port: 3000,
        open: false,
    },
    optimizeDeps: {
        include: ["jszip"],
    },
});
