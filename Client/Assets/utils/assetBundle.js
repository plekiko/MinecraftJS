import JSZip from "jszip";

/** @type {Map<string, string> | null} */
let packedUrls = null;
let loadPromise = null;

const MIME_BY_EXT = {
    png: "image/png",
    webp: "image/webp",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    ogg: "audio/ogg",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    otf: "font/otf",
    ttf: "font/ttf",
    woff: "font/woff",
    woff2: "font/woff2",
    json: "application/json",
    txt: "text/plain",
};

function mimeForPath(path) {
    const ext = path.split(".").pop()?.toLowerCase();
    return (ext && MIME_BY_EXT[ext]) || "";
}

/** Normalize to zip keys like `Assets/sprites/foo.png`. */
export function normalizeAssetKey(path) {
    if (typeof path !== "string") return path;
    let key = path.trim();
    if (key.startsWith("/")) key = key.slice(1);
    return key.replaceAll("\\", "/");
}

export function isMediaPacked() {
    return packedUrls !== null;
}

/**
 * Resolve a logical media path to a URL the browser can load.
 * Dev: returns the loose filesystem path. Prod: blob URL from media.zip.
 */
export function resolveAssetUrl(path) {
    if (typeof path !== "string" || !path) return path;
    if (
        path.startsWith("blob:") ||
        path.startsWith("data:") ||
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    const key = normalizeAssetKey(path);
    if (packedUrls?.has(key)) {
        return packedUrls.get(key);
    }
    return key;
}

async function readResponseWithProgress(response, onProgress) {
    const total = Number(response.headers.get("Content-Length")) || 0;
    if (!response.body || !total) {
        const buf = await response.arrayBuffer();
        onProgress?.(0.45);
        return buf;
    }

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        onProgress?.(Math.min(0.45, (received / total) * 0.45));
    }

    const out = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out.buffer;
}

/**
 * In production, fetch and unzip media.zip into blob URLs.
 * In dev, no-op (loose Assets/ files are served by Vite).
 */
export async function loadMediaBundle({ onProgress } = {}) {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        if (import.meta.env.DEV) {
            onProgress?.(1);
            return;
        }

        onProgress?.(0);
        const base = import.meta.env.BASE_URL || "/";
        const url = base.endsWith("/")
            ? `${base}media.zip`
            : `${base}/media.zip`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `Failed to load media.zip (${response.status} ${response.statusText})`,
            );
        }

        const buffer = await readResponseWithProgress(response, onProgress);
        onProgress?.(0.5);

        const zip = await JSZip.loadAsync(buffer);
        const entries = Object.values(zip.files).filter((f) => !f.dir);
        const urls = new Map();
        let done = 0;

        await Promise.all(
            entries.map(async (entry) => {
                const key = normalizeAssetKey(entry.name);
                // arraybuffer + explicit MIME: HTMLAudioElement is picky about
                // empty-typed blobs from JSZip's async("blob").
                const data = await entry.async("arraybuffer");
                if (!data.byteLength) return;
                const mime = mimeForPath(key) || "application/octet-stream";
                const blob = new Blob([data], { type: mime });
                urls.set(key, URL.createObjectURL(blob));
                done++;
                onProgress?.(0.5 + (done / entries.length) * 0.5);
            }),
        );

        packedUrls = urls;
        onProgress?.(1);
    })();

    return loadPromise;
}

/** Rewrite DOM media refs and inject CSS overrides that still use Assets/ paths. */
export function applyPackedMediaStyles() {
    if (!packedUrls) return;

    const cssRules = [];

    const setBg = (selector, assetPath) => {
        const url = packedUrls.get(normalizeAssetKey(assetPath));
        if (url) cssRules.push(`${selector}{background-image:url("${url}")}`);
    };

    setBg("body", "Assets/sprites/misc/End_Poem_background.webp");
    setBg(".background", "Assets/sprites/blocks/dirt.png");
    setBg(".world-create-background", "Assets/sprites/blocks/dirt.png");
    setBg("#media-boot", "Assets/sprites/blocks/dirt.png");
    for (let i = 0; i < 6; i++) {
        setBg(
            `.face${i}`,
            `Assets/sprites/menu/background/panorama_${i}.png`,
        );
    }

    const btn = packedUrls.get(
        normalizeAssetKey("Assets/sprites/menu/menu_button.png"),
    );
    const btnHover = packedUrls.get(
        normalizeAssetKey("Assets/sprites/menu/menu_button_hover.png"),
    );
    const btnDisabled = packedUrls.get(
        normalizeAssetKey("Assets/sprites/menu/menu_button_disabled.png"),
    );
    if (btn) {
        cssRules.push(`.btn{--btn-img:url("${btn}")}`);
        cssRules.push(
            `.btn{border-image:url("${btn}") 0 4 0 4 / 0 var(--btn-edge) stretch}`,
        );
    }
    if (btnHover) {
        cssRules.push(`.btn:hover{--btn-img:url("${btnHover}")}`);
        cssRules.push(
            `.btn:hover{border-image:url("${btnHover}") 0 4 0 4 / 0 var(--btn-edge) stretch}`,
        );
    }
    if (btnDisabled) {
        cssRules.push(
            `.btn:disabled,.btn.disabled{--btn-img:url("${btnDisabled}")}`,
        );
    }

    const fontUrl = packedUrls.get(
        normalizeAssetKey(
            "Assets/fonts/minecraft-font/MinecraftRegular-Bmg3.otf",
        ),
    );
    if (fontUrl) {
        cssRules.push(
            `@font-face{font-family:"Pixel";src:url("${fontUrl}")}`,
        );
    }

    if (cssRules.length) {
        const style = document.createElement("style");
        style.setAttribute("data-packed-media", "true");
        style.textContent = cssRules.join("\n");
        document.head.appendChild(style);
    }

    document.querySelectorAll("img[src], source[src]").forEach((el) => {
        const src = el.getAttribute("src");
        if (src && normalizeAssetKey(src).startsWith("Assets/")) {
            el.setAttribute("src", resolveAssetUrl(src));
        }
    });

    document.querySelectorAll('link[rel="icon"]').forEach((el) => {
        const href = el.getAttribute("href");
        if (href && normalizeAssetKey(href).startsWith("Assets/")) {
            el.setAttribute("href", resolveAssetUrl(href));
        }
    });
}
