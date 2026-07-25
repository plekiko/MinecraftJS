import {
    applyPackedMediaStyles,
    loadMediaBundle,
} from "./Assets/utils/assetBundle.js";
import { createBootLoader } from "./bootLoader.js";

const boot = createBootLoader();
await loadMediaBundle({ onProgress: (p) => boot.setProgress(p) });
applyPackedMediaStyles();
await import("./structureCreator.js");
boot.hide();
