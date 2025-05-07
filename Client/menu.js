// window.location.href = "game.html";

const randomTextElement = document.querySelector(".splash");
const menuContainer = document.querySelector(".menu-container");
const worldsContainer = document.querySelector(".world-select");
const worldContainer = document.querySelector(".world-container");
const worldCreateContainer = document.querySelector("#world-create-container");
const worldSeedInput = document.querySelector("#world-seed-input");
const savedInText = document.querySelector("#saved-in-text");
const worldSelectContainer = document.querySelector("#world-select-container");
const removeTexturePackButton = document.getElementById("remove-texture-btn");
const gameModeButton = document.getElementById("game-mode-button");
const texturePackSelectContainer = document.querySelector(
    "#texture-pack-select-container"
);
const texturePacksContainer =
    texturePackSelectContainer.querySelector(".world-select");

const worldNameInput = document.querySelector("#world-name-input");

const worldPlayButton = document.getElementById("play-selected-btn");
const removeWorldButton = document.getElementById("remove-world-btn");
const footer = document.querySelector(".footer");
const panorama = document.querySelector(".panorama");

// Server-related elements
const serverSelectContainer = document.querySelector(
    "#server-select-container"
);
const serverListContainer = document.querySelector("#server-list");
const addServerContainer = document.querySelector("#add-server-container");
const quickConnectContainer = document.querySelector(
    "#quick-connect-container"
);
const serverNameInput = document.querySelector("#server-name-input");
const serverIPInput = document.querySelector("#server-ip-input");
const quickConnectIPInput = document.querySelector("#quick-connect-ip-input");
const removeServerButton = document.getElementById("remove-server-btn");
const quickConnectButton = document.getElementById("quick-connect-btn");
const connectButton = document.getElementById("connect-btn");

const optionsContainer = document.querySelector("#options-container");

const musicToggleButton = document.getElementById("music-toggle-btn");
const sfxToggleButton = document.getElementById("sfx-toggle-btn");
const lightingToggleButton = document.getElementById("lighting-toggle-btn");
const usernameInput = document.querySelector("#username-input");
const usernameFooter = document.querySelector("#username-footer");

let selectedWorld = null;
let selectedTexturePack = "default";
let selectedServerId = null;
let tempServerName = "New Server";
let tempServerIP = "";
let tempQuickConnectIP = "";
let randomTexts = [];

let lastPingTime = 0;
let cachedServerStatuses = [];

let currentSettings = {
    sfx: true,
    music: true,
    lighting: true,
    username: "",
};

const colorMap = {
    0: "#000000", // Black
    1: "#0000AA", // Dark Blue
    2: "#00AA00", // Dark Green
    3: "#00AAAA", // Dark Aqua
    4: "#AA0000", // Dark Red
    5: "#AA00AA", // Dark Purple
    6: "#FFAA00", // Gold
    7: "#AAAAAA", // Gray
    8: "#555555", // Dark Gray
    9: "#5555FF", // Blue
    a: "#55FF55", // Green
    b: "#55FFFF", // Aqua
    c: "#FF5555", // Red
    d: "#FF55FF", // Light Purple
    e: "#FFFF55", // Yellow
    f: "#FFFFFF", // White
};

const formatMap = {
    l: "font-weight: bold;",
    o: "font-style: italic;",
    n: "text-decoration: underline;",
    m: "text-decoration: line-through;",
    r: "", // Reset formatting
};

fetch("menu_text.json")
    .then((response) => response.json())
    .then((data) => {
        randomTexts = data.random_text;
        setRandomText();
    })
    .catch((error) => {});

function setRandomText() {
    const randomPick =
        randomTexts[Math.floor(Math.random() * randomTexts.length)];
    randomTextElement.textContent = randomPick;
}

const musicTracks = [
    "Mutation",
    "Beginning 2",
    "Floating Trees",
    "Moog City 2",
];

function buttonSound() {
    if (!currentSettings.sfx) return;

    const audio = new Audio("Assets/audio/sfx/ui/click.ogg");
    audio.volume = 0.3;
    audio.play();
}

function multiplayerButton() {
    buttonSound();

    hideMenu();

    showServers();
}

function downloadServer() {
    const link = document.createElement("a");
    link.href = "Server.zip";
    link.download = "Server.zip";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}

function toggleSFX() {
    buttonSound();

    currentSettings.sfx = !currentSettings.sfx;

    sfxToggleButton.textContent =
        "SFX - " + (currentSettings.sfx ? "On" : "Off");
}

function toggleMusic() {
    buttonSound();

    currentSettings.music = !currentSettings.music;

    if (!currentSettings.music) {
        if (music) {
            music.volume = 0;
        }
    } else {
        if (music) {
            music.volume = 0.3;
        } else {
            playRandomMusic();
        }
    }

    musicToggleButton.textContent =
        "Music - " + (currentSettings.music ? "On" : "Off");
}

function toggleLighting() {
    buttonSound();

    currentSettings.lighting = !currentSettings.lighting;

    lightingToggleButton.textContent =
        "Lighting - " + (currentSettings.lighting ? "On" : "Off");
}

function saveSettings() {
    if (!usernameInput.value) {
        if (!currentSettings.username) currentSettings.username = "Player";
    } else {
        currentSettings.username = usernameInput.value;
    }

    setUsernameFooter(currentSettings.username);

    localStorage.setItem("settings", JSON.stringify(currentSettings));
}

function setUsernameFooter(username) {
    usernameFooter.textContent = `Current Username: ${username}`;
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem("settings"));
    if (settings) {
        currentSettings = { ...currentSettings, ...settings };
    }

    sfxToggleButton.textContent =
        "SFX - " + (currentSettings.sfx ? "On" : "Off");
    musicToggleButton.textContent =
        "Music - " + (currentSettings.music ? "On" : "Off");
    lightingToggleButton.textContent =
        "Lighting - " + (currentSettings.lighting ? "On" : "Off");

    setUsernameFooter(currentSettings.username);

    usernameInput.value = "";
}

loadSettings();

function showTexturePacks() {
    buttonSound();

    hideMenu();

    texturePackSelectContainer.style.display = "flex";
    populateTexturePacks();

    if (selectedTexturePack === "default") {
        removeTexturePackButton.disabled = true;
    }
}

function playGame() {
    buttonSound();
    menuContainer.style.display = "none";
    panorama.style.display = "none";
    worldSelectContainer.style.display = "flex";
    footer.style.display = "none";
    populateWorlds();
}

function playRandomMusic() {
    if (!currentSettings.music) return;

    const randomTrack =
        musicTracks[Math.floor(Math.random() * musicTracks.length)];
    playMusic(randomTrack);
}

let music = null;

function playMusic(track) {
    music = new Audio(`Assets/audio/music/menu/${track}.mp3`);
    music.volume = 0.3;
    music.play();
    music.addEventListener("ended", () => {
        setTimeout(() => {
            playRandomMusic();
        }, 1000);
    });
}

function parseDate(dateStr) {
    const [datePart, timePart] = dateStr.split(", ");
    const [day, month, year] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
}

function populateWorlds() {
    const worlds = JSON.parse(localStorage.getItem("worlds"));
    worldsContainer.innerHTML = "";
    if (worlds) {
        worlds.sort(
            (a, b) => parseDate(b.lastPlayed) - parseDate(a.lastPlayed)
        );
        worlds.forEach((world) => {
            const worldElement = worldContainer.cloneNode(true);
            const worldNameElement = worldElement.querySelector(".world-name");
            const worldDateElement = worldElement.querySelector(".world-date");

            const actualWorld = localStorage.getItem(world.id);

            let worldSize = 0;

            if (actualWorld) {
                worldSize = (actualWorld.length / 1024).toFixed(0);
            }

            worldNameElement.textContent = world.name;
            worldDateElement.textContent =
                world.lastPlayed + ` - ${worldSize}KB`;
            worldElement.style.display = "flex";

            worldElement.addEventListener("click", () => {
                selectWorld(world.id, worldElement);
            });
            worldsContainer.appendChild(worldElement);
        });
    }
}

function initializeDefaultTexturePack() {
    const texturePackList =
        JSON.parse(localStorage.getItem("texturePackList")) || [];
    const defaultPackId = "default";

    if (!texturePackList.some((pack) => pack.id === defaultPackId)) {
        const defaultPack = {
            id: defaultPackId,
            name: "Default",
            dateAdded: new Date().toLocaleString(),
            icon: "Assets/sprites/menu/worldPreview.png",
            description: "Default Minecraft JS texture pack",
        };
        texturePackList.push(defaultPack);
        localStorage.setItem(
            "texturePackList",
            JSON.stringify(texturePackList)
        );
    }

    const currentPack =
        localStorage.getItem("currentTexturePack") || defaultPackId;
    selectedTexturePack = currentPack;
    localStorage.setItem("currentTexturePack", currentPack);
}

async function populateTexturePacks() {
    initializeDefaultTexturePack();

    const texturePackList =
        JSON.parse(localStorage.getItem("texturePackList")) || [];
    const currentTexturePack = localStorage.getItem("currentTexturePack");
    texturePacksContainer.innerHTML = "";

    for (const pack of texturePackList) {
        const packElement = worldContainer.cloneNode(true);
        const packNameElement = packElement.querySelector(".world-name");
        const packDateElement = packElement.querySelector(".world-date");
        const packImageElement = packElement.querySelector(".world-image");

        packNameElement.textContent = pack.name;
        packDateElement.textContent =
            pack.description || "No description found for this pack";
        packElement.style.display = "flex";

        packImageElement.src =
            pack.icon || "Assets/sprites/menu/worldPreview.png";

        packElement.addEventListener("click", () => {
            selectTexturePack(pack.id, packElement);
        });
        texturePacksContainer.appendChild(packElement);

        if (pack.id == currentTexturePack) {
            selectTexturePack(pack.id, packElement);
        }
    }
}

function selectTexturePack(id, selectedElement) {
    const allPackContainers =
        texturePacksContainer.querySelectorAll(".world-container");
    allPackContainers.forEach((container) => {
        container.classList.remove("selected");
    });

    if (selectedElement) {
        selectedElement.classList.add("selected");
    }
    selectedTexturePack = id;

    removeTexturePackButton.disabled = id === "default";

    localStorage.setItem("currentTexturePack", id);
}

async function getTexturePackIcon(packId) {
    if (packId === "default") {
        return "Assets/sprites/menu/worldPreview.png";
    }

    const texturePackList =
        JSON.parse(localStorage.getItem("texturePackList")) || [];
    const pack = texturePackList.find((p) => p.id === packId);
    return pack
        ? pack.icon || "Assets/sprites/menu/worldPreview.png"
        : "Assets/sprites/menu/worldPreview.png";
}

function uploadTexturePack() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip, .7z, .rar";

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const texturePackList =
                    JSON.parse(localStorage.getItem("texturePackList")) || [];
                const packId = Date.now();
                const packInfo = {
                    id: packId,
                    name: file.name.replace(".zip", ""),
                    dateAdded: new Date().toLocaleString(),
                    icon: null,
                    description: null,
                };

                const texturePackData = event.target.result;
                ldb.set(`texturePack_${packId}`, texturePackData);

                try {
                    const base64Data = texturePackData.startsWith(
                        "data:application/x-zip-compressed;base64,"
                    )
                        ? texturePackData.replace(
                              "data:application/x-zip-compressed;base64,",
                              ""
                          )
                        : texturePackData;
                    const zip = await JSZip.loadAsync(base64Data, {
                        base64: true,
                    });

                    const iconFilePath = Object.keys(zip.files).find(
                        (fileName) =>
                            fileName.endsWith("icon.png") ||
                            fileName.endsWith("pack.png")
                    );
                    if (iconFilePath) {
                        const iconFile = zip.file(iconFilePath);
                        if (iconFile) {
                            const base64 = await iconFile.async("base64");
                            packInfo.icon = `data:image/png;base64,${base64}`;
                        }
                    }

                    const mcmetaFile = zip.file("pack.mcmeta");
                    if (mcmetaFile) {
                        const mcmetaText = await mcmetaFile.async("text");
                        const mcmeta = JSON.parse(mcmetaText);
                        if (mcmeta.pack && mcmeta.pack.description) {
                            packInfo.description = mcmeta.pack.description;
                        }
                    }
                } catch (err) {
                    packInfo.icon = "Assets/sprites/menu/worldPreview.png";
                    packInfo.description = "No description available";
                }

                texturePackList.push(packInfo);
                localStorage.setItem(
                    "texturePackList",
                    JSON.stringify(texturePackList)
                );

                populateTexturePacks();
            };
            reader.readAsDataURL(file);
        } else {
            alert("No file selected.");
        }
    };

    input.click();
}

function uploadSkin() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png";

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const skinData = event.target.result;
                localStorage.setItem("playerSkin", skinData);
                alert("Skin uploaded successfully!");
            };
            reader.readAsDataURL(file);
        } else {
            alert("No file selected.");
        }
    };

    input.click();
}

function clearSkin() {
    if (confirm("Are you sure you want to remove your skin?")) {
        localStorage.removeItem("playerSkin");
        alert("Skin removed successfully!");
    }
}

async function removeTexturePack() {
    if (!selectedTexturePack || selectedTexturePack === "default") return;

    const oldSelectedPack = selectedTexturePack;

    const texturePackList = JSON.parse(localStorage.getItem("texturePackList"));
    if (!texturePackList) return;

    if (!confirm("Are you sure you want to delete this texture pack?")) return;

    localStorage.setItem(
        "texturePackList",
        JSON.stringify(
            texturePackList.filter((pack) => pack.id !== selectedTexturePack)
        )
    );

    localStorage.setItem("currentTexturePack", "default");

    selectedTexturePack = null;
    populateTexturePacks();

    removeTexturePackButton.disabled = true;
    await deleteFromLdb(`texturePack_${oldSelectedPack}`);
}

async function getTexturePackData(id) {
    if (id === "default") return null;

    try {
        const data = await getFromLdb(`texturePack_${id}`);
        return data;
    } catch (err) {
        return null;
    }
}

function gotoWorldCreate() {
    buttonSound();
    worldCreateContainer.style.display = "flex";
    menuContainer.style.display = "none";
    panorama.style.display = "none";
    worldSelectContainer.style.display = "none";
    footer.style.display = "none";
}

function createNewWorld() {
    if (!worldSeed) worldSeed = Math.floor(Math.random() * 100000000);
    if (!worldName) worldName = "New World";

    localStorage.setItem(
        "selectedWorld",
        JSON.stringify({
            id: Date.now(),
            name: worldName,
            seed: worldSeed,
            gameMode: selectedGameMode,
        })
    );

    window.location.href = "./game.html";
}

function getSavedWorld(id) {
    const worlds = JSON.parse(localStorage.getItem("worlds"));
    return worlds.find((world) => world.id === id);
}

removeWorldButton.disabled = true;
function removeWorld() {
    if (!selectedWorld) return;
    const worlds = JSON.parse(localStorage.getItem("worlds"));
    if (!worlds) return;
    if (!confirm("Are you sure you want to delete this world?")) return;

    localStorage.removeItem(selectedWorld);
    localStorage.setItem(
        "worlds",
        JSON.stringify(worlds.filter((world) => world.id !== selectedWorld))
    );

    removeWorldButton.disabled = true;
    worldPlayButton.disabled = true;
    populateWorlds();
}

function backToMenu() {
    buttonSound();
    showMenu();
}

function backToWorldSelection() {
    buttonSound();
    worldCreateContainer.style.display = "none";
    worldSelectContainer.style.display = "flex";
}

let selectedGameMode = 0;
function switchGameMode() {
    buttonSound();
    selectedGameMode = (selectedGameMode + 1) % 4;
    setGameMode(selectedGameMode);
}

function setGameMode(gamemode) {
    const gameModes = ["Survival", "Creative", "Adventure", "Spectator"];
    selectedGameMode = gamemode;
    gameModeButton.textContent = "Game Mode: " + gameModes[gamemode];
}

let worldSeed = "";
function updateWorldSeed(value) {
    if (value === "") {
        value = Math.floor(Math.random() * 100000000);
    }
    worldSeed = value;
}

let worldName = "New World";
function updateWorldName(value) {
    if (value === "") {
        value = "World";
    }
    savedInText.textContent = "Will be saved in: " + value;
    worldName = value;
}

function playSelectedWorld() {
    if (!selectedWorld) return;

    localStorage.setItem(
        "selectedWorld",
        JSON.stringify({
            id: selectedWorld,
            name: getSavedWorld(selectedWorld).name,
        })
    );

    buttonSound();
    setInterval(() => {
        window.location.href = "game.html";
    }, 500);
}

function selectWorld(id, selectedElement) {
    const allWorldContainers = document.querySelectorAll(".world-container");
    allWorldContainers.forEach((container) => {
        container.classList.remove("selected");
    });

    selectedElement.classList.add("selected");
    worldPlayButton.disabled = false;
    removeWorldButton.disabled = false;
    selectedWorld = id;
}

async function pingServer(server) {
    return new Promise((resolve) => {
        const [ip, port = "25565"] = server.ip.split(":");

        // Validate IP and port
        if (!isValidServerIp(ip) || isNaN(port) || port < 1 || port > 65535) {
            resolve({
                server,
                status: null,
                latency: null,
                error: "Invalid IP or port",
            });
            return;
        }

        const ws = new WebSocket(`ws://${ip}:${port}`);
        const startTime = Date.now();
        let latency = null;
        let status = null;

        const timeoutId = setTimeout(() => {
            if (ws.readyState !== ws.CLOSED) {
                ws.close();
                resolve({
                    server,
                    status: null,
                    latency: null,
                    error: "Timeout",
                });
            }
        }, 5000);

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    type: "status",
                    message: { requestId: Date.now() },
                })
            );
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "statusResponse") {
                    latency = Date.now() - startTime;
                    status = data.message;
                    clearTimeout(timeoutId);
                    ws.close();
                    resolve({
                        server,
                        status,
                        latency,
                        error: null,
                    });
                }
            } catch (e) {
                // Silently handle parsing errors
            }
        };

        ws.onerror = () => {
            clearTimeout(timeoutId);
            ws.close();
            resolve({
                server,
                status: null,
                latency: null,
                error: "Connection failed",
            });
        };

        ws.onclose = () => {
            clearTimeout(timeoutId);
            if (!status) {
                resolve({
                    server,
                    status: null,
                    latency: null,
                    error: "No response",
                });
            }
        };
    });
}

async function pingServerAndUpdate(server, container) {
    try {
        const result = await pingServer(server);
        if (!result || typeof result !== "object") {
            console.warn(
                `Invalid ping result for server ${server.id}:`,
                result
            );
            updateServerStatus(
                server,
                {
                    status: null,
                    latency: null,
                    error: "Ping failed",
                },
                container
            );
            return (
                result || {
                    server,
                    status: null,
                    latency: null,
                    error: "Ping failed",
                }
            );
        }
        updateServerStatus(server, result, container);
        return result;
    } catch (error) {
        console.error(`Ping error for server ${server.id}:`, error);
        updateServerStatus(
            server,
            {
                status: null,
                latency: null,
                error: "Connection failed",
            },
            container
        );
        return {
            server,
            status: null,
            latency: null,
            error: "Connection failed",
        };
    }
}

function updateServerStatus(server, result, container) {
    const { status, latency, error } = result || {
        status: null,
        latency: null,
        error: "Unknown error",
    };

    const serverElement = container.querySelector(`[data-id="${server.id}"]`);
    if (!serverElement) {
        console.warn(`Server element not found for ID ${server.id}`);
        return;
    }

    const serverNameElement = serverElement.querySelector(".world-name");
    const serverIPElement = serverElement.querySelector(".world-date");
    const serverImageElement = serverElement.querySelector(".world-image");

    const safeName = sanitizeHtml(server.name);
    const safeIp = sanitizeHtml(server.ip);

    serverNameElement.innerHTML = `${safeName} <span class="ip">(${safeIp})</span>`;

    let statusText = "";
    if (error) {
        statusText = `<span class="${
            error === "Pinging..." ? "pinging" : ""
        }">${sanitizeHtml(error)}</span>`;
        serverElement.style.opacity = error === "Pinging..." ? "0.7" : "0.5";
        serverImageElement.src = "Assets/sprites/menu/worldPreview.png";
    } else if (status) {
        statusText = `<span class="world-status">${status.onlinePlayers}/${status.maxPlayers}</span>`;
        statusText += ` - ${parseMotdToHtml(status.motd)}`;
        if (latency !== null) {
            let latencyColor =
                latency < 100
                    ? "#55FF55"
                    : latency < 200
                    ? "#FFFF55"
                    : "#FF5555";
            statusText += ` - <span class="world-status" style="color: ${latencyColor}">${latency}ms</span>`;
        }
        console.log(
            `Server ${server.id} (${server.name}) pinged successfully:`,
            status
        );
        serverElement.style.opacity = "1";
        serverImageElement.src =
            status.icon && status.icon.startsWith("data:image/")
                ? status.icon
                : "Assets/sprites/menu/worldPreview.png";
    }

    serverIPElement.innerHTML = statusText;
}

async function pingAllServers() {
    const servers = JSON.parse(localStorage.getItem("servers") || "[]");
    const results = await Promise.all(
        servers.map((server) => pingServer(server))
    );
    return results;
}

// Server Management Functions
function showServers() {
    worldSelectContainer.style.display = "none";
    texturePackSelectContainer.style.display = "none";
    serverSelectContainer.style.display = "flex";
    addServerContainer.style.display = "none";
    quickConnectContainer.style.display = "none";
    displayServers();
}

async function displayServers() {
    const servers = JSON.parse(localStorage.getItem("servers") || "[]");

    serverListContainer.innerHTML = "";
    cachedServerStatuses = []; // Clear cached statuses

    if (servers.length === 0) {
        removeServerButton.disabled = true;
        connectButton.disabled = true;
        return;
    }

    renderServers(
        servers.map((server) => ({
            server,
            status: null,
            latency: null,
            error: "Pinging...",
        }))
    );

    pingAndRenderServers();
}

async function pingAndRenderServers() {
    if (serverSelectContainer.style.display !== "flex") return;

    const now = Date.now();
    if (now - lastPingTime < 100 && cachedServerStatuses.length > 0) {
        renderServers(cachedServerStatuses);
        return;
    }

    const servers = JSON.parse(localStorage.getItem("servers") || "[]");
    cachedServerStatuses = [];

    const pingPromises = servers.map((server) =>
        pingServerAndUpdate(server, serverListContainer)
    );

    try {
        cachedServerStatuses = await Promise.all(pingPromises);
        lastPingTime = now;
    } catch (error) {
        console.error("Error during server pinging:", error);
        cachedServerStatuses = servers.map((server) => ({
            server,
            status: null,
            latency: null,
            error: "Ping failed",
        }));
        renderServers(cachedServerStatuses);
    }

    setTimeout(() => {
        pingAndRenderServers();
    }, 500);
}

function forceRefreshServers() {
    lastPingTime = 0;
    displayServers();
}

function sanitizeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function isValidServerName(name) {
    // Allow alphanumeric, spaces, and common punctuation; max length 20
    const nameRegex = /^[a-zA-Z0-9\s!@#$%^&*()-_=+[\]{}|;:,.<>?]{1,20}$/;
    return nameRegex.test(name);
}

function isValidServerIp(ip) {
    // Allow IPv4, domain names, localhost, with optional port
    const ipRegex =
        /^(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|localhost|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?::[0-9]{1,5})?$/;
    return ipRegex.test(ip);
}

function renderServers(serverStatuses) {
    serverListContainer.innerHTML = "";
    const servers = JSON.parse(localStorage.getItem("servers") || "[]");

    if (servers.length === 0) {
        removeServerButton.disabled = true;
        connectButton.disabled = true;
        return;
    }

    serverStatuses.forEach(({ server, status, latency, error }) => {
        const serverElement = worldContainer.cloneNode(true);
        const serverNameElement = serverElement.querySelector(".world-name");
        const serverIPElement = serverElement.querySelector(".world-date");
        const serverImageElement = serverElement.querySelector(".world-image");

        const safeName = sanitizeHtml(server.name);
        const safeIp = sanitizeHtml(server.ip);

        serverNameElement.innerHTML = `${safeName} <span class="ip">(${safeIp})</span>`;

        serverElement.setAttribute("data-id", server.id);

        if (server.id === selectedServerId) {
            serverElement.classList.add("selected");
        }

        let statusText = "";
        if (error) {
            statusText = `<span class="${
                error === "Pinging..." ? "pinging" : ""
            }">${sanitizeHtml(error)}</span>`;
            serverElement.style.opacity =
                error === "Pinging..." ? "0.7" : "0.5";
            serverImageElement.src = "Assets/sprites/menu/worldPreview.png";
        } else if (status) {
            statusText = `<span class="world-status">${status.onlinePlayers}/${status.maxPlayers}</span>`;
            statusText += ` - ${parseMotdToHtml(status.motd)}`;
            if (latency !== null) {
                let latencyColor =
                    latency < 100
                        ? "#55FF55"
                        : latency < 200
                        ? "#FFFF55"
                        : "#FF5555";
                statusText += ` - <span class="world-status" style="color: ${latencyColor}">${latency}ms</span>`;
            }
            serverElement.style.opacity = "1";
            serverImageElement.src = "Assets/sprites/menu/worldPreview.png";
        }

        serverIPElement.innerHTML = statusText;
        serverElement.style.display = "flex";

        serverElement.addEventListener("click", () => {
            selectServer(server.id, serverElement);
        });
        serverListContainer.appendChild(serverElement);
    });
}

function parseMotdToHtml(motd) {
    let html = "";
    let currentColor = "";
    let currentStyles = [];
    let i = 0;

    while (i < motd.length) {
        if (motd[i] === "§" && i + 1 < motd.length) {
            const code = motd[i + 1].toLowerCase();
            i += 2;
            if (colorMap[code]) {
                currentColor = `color: ${colorMap[code]};`;
            } else if (formatMap[code]) {
                if (code === "r") {
                    currentColor = "";
                    currentStyles = [];
                } else {
                    currentStyles.push(formatMap[code]);
                }
            }
            continue;
        }
        const char = sanitizeHtml(motd[i]);
        const style = currentColor + currentStyles.join("");
        html += style ? `<span style="${style}">${char}</span>` : char;
        i++;
    }

    return html;
}

function selectServer(id, selectedElement) {
    const allServerContainers =
        serverListContainer.querySelectorAll(".world-container");
    allServerContainers.forEach((container) => {
        container.classList.remove("selected");
    });

    selectedElement.classList.add("selected");
    selectedServerId = id;
    removeServerButton.disabled = false;
    connectButton.disabled = false;
}

function gotoAddServer() {
    buttonSound();
    serverSelectContainer.style.display = "none";
    addServerContainer.style.display = "flex";
    tempServerName = "New Server";
    tempServerIP = "";
    serverNameInput.value = tempServerName;
    serverIPInput.value = tempServerIP;
}

function updateServerName(value) {
    tempServerName = value || "New Server";
}

function updateServerIP(value) {
    tempServerIP = value || "";
}

function addServer() {
    if (!tempServerIP) {
        alert("Please enter a server IP.");
        return;
    }

    // Validate server name and IP
    if (!isValidServerName(tempServerName)) {
        alert(
            "Invalid server name. Use 1-20 characters (alphanumeric, spaces, or common punctuation)."
        );
        return;
    }
    if (!isValidServerIp(tempServerIP)) {
        alert(
            "Invalid server IP. Use a valid IPv4 address, domain, or localhost with optional port."
        );
        return;
    }

    const servers = JSON.parse(localStorage.getItem("servers") || "[]");
    const newServer = {
        id: Date.now(),
        name: tempServerName,
        ip: tempServerIP,
    };
    servers.push(newServer);
    localStorage.setItem("servers", JSON.stringify(servers));

    backToServerSelection();
    displayServers();
}

function removeServer() {
    if (!selectedServerId) return;

    const servers = JSON.parse(localStorage.getItem("servers") || "[]");
    if (!confirm("Are you sure you want to delete this server?")) return;

    const updatedServers = servers.filter(
        (server) => server.id !== selectedServerId
    );
    localStorage.setItem("servers", JSON.stringify(updatedServers));

    selectedServerId = null;
    removeServerButton.disabled = true;
    connectButton.disabled = true;
    displayServers();
}

function gotoQuickConnect() {
    buttonSound();
    serverSelectContainer.style.display = "none";
    quickConnectContainer.style.display = "flex";
    tempQuickConnectIP = "";
    quickConnectIPInput.value = tempQuickConnectIP;

    // If a server is selected, prefill the IP field with its IP
    if (selectedServerId) {
        const servers = JSON.parse(localStorage.getItem("servers") || "[]");
        const server = servers.find((s) => s.id === selectedServerId);
        if (server) {
            tempQuickConnectIP = server.ip;
            quickConnectIPInput.value = tempQuickConnectIP;
        }
    }
}

function updateQuickConnectIP(value) {
    tempQuickConnectIP = value || "";
}

function connectToServer() {
    if (!selectedServerId) {
        alert("Please select a server to connect to.");
        return;
    }

    const servers = JSON.parse(localStorage.getItem("servers") || "[]");
    const selectedServer = servers.find((s) => s.id === selectedServerId);
    if (!selectedServer) {
        alert("Selected server not found.");
        return;
    }

    const [ip, port = "25565"] = selectedServer.ip.split(":");
    localStorage.setItem("multiplayerIP", ip);
    localStorage.setItem("multiplayerPort", port);

    buttonSound();
    setTimeout(() => {
        window.location.href = "game.html?multiplayer=true";
    }, 500);
}

function cancelQuickConnect() {
    buttonSound();
    quickConnectContainer.style.display = "none";
    serverSelectContainer.style.display = "flex";
    displayServers();
}

function backToServerSelection() {
    buttonSound();
    addServerContainer.style.display = "none";
    serverSelectContainer.style.display = "flex";

    // Button states
    removeServerButton.disabled = true;
    connectButton.disabled = true;

    displayServers();
}

function gotoOptions() {
    buttonSound();

    hideMenu();

    optionsContainer.style.display = "flex";

    loadSettings();
}

function showMenu() {
    menuContainer.style.display = "flex";
    panorama.style.display = "block";
    worldSelectContainer.style.display = "none";
    footer.style.display = "block";
    texturePackSelectContainer.style.display = "none";
    serverSelectContainer.style.display = "none";
    addServerContainer.style.display = "none";
    quickConnectContainer.style.display = "none";
    optionsContainer.style.display = "none";
    worldCreateContainer.style.display = "none";

    // Reset selected states
    selectedWorld = null;
    selectedServerId = null;
    selectedTexturePack = null;

    // Button states
    worldPlayButton.disabled = true;
    removeWorldButton.disabled = true;
    removeServerButton.disabled = true;
    connectButton.disabled = true;
}

function hideMenu() {
    menuContainer.style.display = "none";
    panorama.style.display = "none";
    worldSelectContainer.style.display = "none";
    footer.style.display = "none";
    texturePackSelectContainer.style.display = "none";
    serverSelectContainer.style.display = "none";
    addServerContainer.style.display = "none";
    quickConnectContainer.style.display = "none";
    optionsContainer.style.display = "none";

    // Reset selected states
    selectedWorld = null;
    selectedServerId = null;
    selectedTexturePack = null;

    // Button states
    worldPlayButton.disabled = true;
    removeWorldButton.disabled = true;
    removeServerButton.disabled = true;
    connectButton.disabled = true;
}

// Initialize everything after texture pack loading
async function initialize() {
    populateWorlds();
    initializeDefaultTexturePack();
    await populateTexturePacks();
    removeTexturePackButton.disabled = selectedTexturePack === "default";
    removeServerButton.disabled = true;
    connectButton.disabled = true;
}

initialize();

setTimeout(() => {
    playRandomMusic();
}, 1000);

removeTexturePackButton.addEventListener("click", removeTexturePack);
worldPlayButton.disabled = true;
