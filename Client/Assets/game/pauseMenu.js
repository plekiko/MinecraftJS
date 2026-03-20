class PauseMenu {
    constructor() {
        this.container = document.querySelector("#pause-menu");
        this.pages = Array.from(
            document.querySelectorAll(".pause-menu-page[data-page]"),
        );
        this.root = document.querySelector(":root");

        this._page = 0; // 0 = closed, 1+ = current page number
        this.container.classList.remove("visible");
        this.pages.forEach((el) => el.classList.remove("active"));
    }

    get page() {
        return this._page;
    }

    set page(n) {
        this._page = n;
        this.pages.forEach((el) => {
            const num = parseInt(el.getAttribute("data-page"), 10);
            el.classList.toggle("active", num === n);
        });
    }

    setPaused(paused) {
        this._page = paused ? 1 : 0;

        if (paused) {
            this.container.classList.add("visible");
            this.page = 1;
            this.root.style.setProperty("--drawMouse", "default");
            if (world.player) {
                world.player.canMove = false;
                if (world.player.resetBreaking) world.player.resetBreaking();
            }
        } else {
            this.container.classList.remove("visible");
            this.page = 0;
            this.root.style.setProperty("--drawMouse", "none");
            if (world.player) world.player.canMove = true;
        }
    }

    setPage(n) {
        if (n < 1 || n > this.pages.length) return;
        this._page = n;
        this.page = n;
        if (n === 2 && typeof updateDebugButtonLabels === "function") {
            updateDebugButtonLabels();
        }
    }

    getActive() {
        return this._page > 0;
    }

    update() {
        if (!input.isActionPressed("pause")) return;

        if (this.getActive()) {
            if (this._page > 1) {
                this.setPage(1);
            } else {
                this.close();
            }
            return;
        }

        if (chat.inChat || (world.player && world.player.windowOpen)) return;
        if (input._pauseConsumedByUI) {
            input._pauseConsumedByUI = false;
            return;
        }

        if (world.player && !world.generator.loadingWorld) {
            this.open();
        }
    }

    open() {
        this.setPaused(true);
    }

    close() {
        this.setPaused(false);
    }
}
