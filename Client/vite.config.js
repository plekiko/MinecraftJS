import { defineConfig } from "vite";
import { resolve, join, relative } from "path";
import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
    readdirSync,
    statSync,
    cpSync,
} from "fs";
import JSZip from "jszip";

const MEDIA_DIRS = ["sprites", "audio", "fonts"];

function walkFiles(dir, files = []) {
    if (!existsSync(dir)) return files;
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walkFiles(full, files);
        else files.push(full);
    }
    return files;
}

function countFiles(dir) {
    return walkFiles(dir).length;
}

function packMediaZip() {
    return {
        name: "pack-media-zip",
        async closeBundle() {
            const dist = resolve(__dirname, "dist");
            const assetsRoot = resolve(__dirname, "Assets");
            mkdirSync(dist, { recursive: true });

            const zip = new JSZip();
            let fileCount = 0;

            for (const sub of MEDIA_DIRS) {
                const dir = join(assetsRoot, sub);
                if (!existsSync(dir)) continue;
                for (const full of walkFiles(dir)) {
                    const zipPath = join(
                        "Assets",
                        relative(assetsRoot, full)
                    ).replaceAll("\\", "/");
                    zip.file(zipPath, readFileSync(full));
                    fileCount++;
                }
            }

            const zipBuf = await zip.generateAsync({
                type: "nodebuffer",
                compression: "DEFLATE",
                compressionOptions: { level: 6 },
            });
            writeFileSync(join(dist, "media.zip"), zipBuf);
            console.log(
                `[pack-media-zip] Wrote media.zip (${fileCount} files, ${(
                    zipBuf.length /
                    1024 /
                    1024
                ).toFixed(1)} MB)`
            );

            const menuText = resolve(__dirname, "menu_text.json");
            if (existsSync(menuText)) {
                cpSync(menuText, join(dist, "menu_text.json"));
            }

            const distFileCount = countFiles(dist);
            console.log(`[pack-media-zip] dist file count: ${distFileCount}`);
            if (distFileCount >= 1000) {
                throw new Error(
                    `dist has ${distFileCount} files (itch.io limit is ~1000). Reduce loose assets.`
                );
            }
        },
    };
}

export default defineConfig({
    root: ".",
    publicDir: false,
    base: "./",
    plugins: [packMediaZip()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        // Avoid clashing with source `Assets/` — this is only hashed JS/CSS/images
        assetsDir: "bundle",
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
