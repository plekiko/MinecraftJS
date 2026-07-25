/**
 * Boot overlay for media.zip download/extract progress.
 * Styles live in boot.css (linked from HTML).
 */
export function createBootLoader() {
    let el = document.getElementById("media-boot");
    if (!el) {
        el = document.createElement("div");
        el.id = "media-boot";
        el.innerHTML = `
            <div class="media-boot-inner">
                <div class="media-boot-title">Loading resources...</div>
                <div class="media-boot-bar"><div class="media-boot-fill"></div></div>
                <div class="media-boot-pct">0%</div>
            </div>
        `;
        document.body.appendChild(el);
    }

    const fill = el.querySelector(".media-boot-fill");
    const pct = el.querySelector(".media-boot-pct");
    const title = el.querySelector(".media-boot-title");
    if (title && !title.textContent.trim()) {
        title.textContent = "Loading resources...";
    }

    return {
        setProgress(value) {
            const p = Math.max(0, Math.min(1, Number(value) || 0));
            const label = `${Math.round(p * 100)}%`;
            if (fill) fill.style.width = label;
            if (pct) pct.textContent = label;
        },
        hide() {
            el.classList.add("media-boot-hidden");
        },
        show() {
            el.classList.remove("media-boot-hidden");
        },
    };
}
