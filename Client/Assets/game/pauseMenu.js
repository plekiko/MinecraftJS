class PauseMenu {
    constructor() {
        this.active = false;
        this.element = document.querySelector("#pause-menu");
        this.root = document.querySelector(":root"); // for releasing the cursor

        this.element.style.display = "none";
    }

    setPaused(paused) {
        this.active = paused;

        if (paused) {
            this.element.style.display = "flex";
            this.root.style.setProperty("--drawMouse", "default");
            if (player) {
                player.canMove = false;
                if (player.resetBreaking) player.resetBreaking();
            }
        } else {
            this.element.style.display = "none";
            this.root.style.setProperty("--drawMouse", "none");
            if (player) player.canMove = true;
        }
    }

    update() {
        if (!input.isKeyPressed("Escape")) return;

        if (this.active) {
            this.close();
            return;
        }

        if (chat.inChat || (player && player.windowOpen)) return;

        if (player && !loadingWorld) {
            this.open();
        }
    }

    // not totally necessary but nice semantically
    open() {
        this.setPaused(true);
    }
    close() {
        this.setPaused(false);
    }
}
