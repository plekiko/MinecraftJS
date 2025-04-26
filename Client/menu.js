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

let selectedWorld = null;
let selectedTexturePack = "default";
let selectedServerId = null;
let tempServerName = "New Server";
let tempServerIP = "";
let tempQuickConnectIP = "";
let randomTexts = [];

let currentSettings = {
    sfx: true,
    music: true,
    lighting: true,
    username: "Player",
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
        currentSettings.username = "Player";
    } else {
        currentSettings.username = usernameInput.value;
    }

    localStorage.setItem("settings", JSON.stringify(currentSettings));
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

    usernameInput.value = currentSettings.username;
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

            worldNameElement.textContent = world.name;
            worldDateElement.textContent = world.lastPlayed;
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

// Server Management Functions
function showServers() {
    worldSelectContainer.style.display = "none";
    texturePackSelectContainer.style.display = "none";
    serverSelectContainer.style.display = "flex";
    addServerContainer.style.display = "none";
    quickConnectContainer.style.display = "none";
    displayServers();
}

function displayServers() {
    serverListContainer.innerHTML = "";
    const servers = JSON.parse(localStorage.getItem("servers") || "[]");

    if (servers.length === 0) {
        removeServerButton.disabled = true;
        connectButton.disabled = true;
        return;
    }

    servers.forEach((server) => {
        const serverElement = worldContainer.cloneNode(true);
        const serverNameElement = serverElement.querySelector(".world-name");
        const serverIPElement = serverElement.querySelector(".world-date");

        serverNameElement.textContent = server.name;
        serverIPElement.textContent = server.ip;
        serverElement.style.display = "flex";

        serverElement.addEventListener("click", () => {
            selectServer(server.id, serverElement);
        });
        serverListContainer.appendChild(serverElement);
    });

    // Auto-select the first server if none is selected
    if (!selectedServerId && servers.length > 0) {
        const firstServerElement =
            serverListContainer.querySelector(".world-container");
        selectServer(servers[0].id, firstServerElement);
    }
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
