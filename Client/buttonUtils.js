// Shared button utilities for menus (both title screen and all in-game menus)

// Crops center of button image for CSS to tile (used for dynamic UI scaling)
// I wanted to do this in CSS but apparently it's not possible
(function () {
    const base = new URL("Assets/sprites/menu/", document.baseURI || document.URL).href;
    const w = 192, h = 20, slice = 4;
    ["menu_button.png", "menu_button_hover.png", "menu_button_disabled.png"].forEach((file, i) => {
        const img = new Image();
        const varName = i === 0 ? "--btn-center-img" : i === 1 ? "--btn-center-img-hover" : "--btn-center-img-disabled";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d").drawImage(img, slice, 0, w, h, 0, 0, w, h);
            canvas.toBlob((blob) => {
                if (blob) document.documentElement.style.setProperty(varName, `url("${URL.createObjectURL(blob)}")`);
            }, "image/png");
        };
        img.src = base + file;
    });
})();

function playButtonSound() {
    const s = JSON.parse(localStorage.getItem("settings") || "{}");
    const sfxVol = s.sfxVolume ?? (s.sfx === false ? 0 : 100);
    if (sfxVol === 0) return;
    const audio = new Audio("Assets/audio/sfx/ui/click.ogg");
    audio.volume = (sfxVol / 100) * 0.3;
    audio.play();
}

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn");
    if (btn && !btn.disabled) playButtonSound();
});
document.addEventListener("change", (e) => {
    if (e.target.matches?.(".slider-input")) playButtonSound();
});

function downloadWorldSave(saveData, filename) {
    const blob = new Blob([saveData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.save`;
    a.click();
    URL.revokeObjectURL(url);
}
