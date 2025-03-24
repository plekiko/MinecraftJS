const randomTextElement = document.querySelector(".splash");
const menuContainer = document.querySelector(".menu-container");
const worldsContainer = document.querySelector(".world-select");
const worldContainer = document.querySelector(".world-container");
const worldSelectContainer = document.querySelector("#world-select-container");
const texturePackSelectContainer = document.querySelector(
    "#texture-pack-select-container"
);
const texturePacksContainer =
    texturePackSelectContainer.querySelector(".world-select");

const worldPlayButton = document.getElementById("play-selected-btn");
const removeWorldButton = document.getElementById("remove-world-btn");
const footer = document.querySelector(".footer");
const panorama = document.querySelector(".panorama");

let selectedWorld = null;
let selectedTexturePack = null;
let randomTexts = [];

fetch("menu_text.json")
    .then((response) => response.json())
    .then((data) => {
        randomTexts = data.random_text;
        setRandomText();
    })
    .catch((error) => {
        console.error("Error loading menu_text.json:", error);
    });

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
    const audio = new Audio("Assets/audio/sfx/ui/click.ogg");
    audio.volume = 0.3;
    audio.play();
}

function showTexturePacks() {
    buttonSound();
    menuContainer.style.display = "none";
    panorama.style.display = "none";
    footer.style.display = "none";
    texturePackSelectContainer.style.display = "flex";
    populateTexturePacks();
}

function PlayGame() {
    buttonSound();
    menuContainer.style.display = "none";
    panorama.style.display = "none";
    worldSelectContainer.style.display = "flex";
    footer.style.display = "none";
}

function PlayRandomMusic() {
    const randomTrack =
        musicTracks[Math.floor(Math.random() * musicTracks.length)];
    playMusic(randomTrack);
}

function playMusic(track) {
    const audio = new Audio(`Assets/audio/music/menu/${track}.mp3`);
    audio.volume = 0.3;
    audio.play();
    audio.addEventListener("ended", () => {
        setTimeout(() => {
            PlayRandomMusic();
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

// Texture Pack Functions
function initializeDefaultTexturePack() {
    const texturePackList =
        JSON.parse(localStorage.getItem("texturePackList")) || [];
    const defaultPackId = "default";

    // Check if default pack exists, if not, create it
    if (!texturePackList.some((pack) => pack.id === defaultPackId)) {
        const defaultPack = {
            id: defaultPackId,
            name: "Default",
            dateAdded: new Date().toLocaleString(),
        };
        texturePackList.push(defaultPack);
        localStorage.setItem(
            "texturePackList",
            JSON.stringify(texturePackList)
        );

        // Since this is the default pack, we won't store actual data
        // Game should fall back to built-in assets when using "default"
    }

    // Set default as current if no texture pack is selected
    if (!localStorage.getItem("currentTexturePack")) {
        localStorage.setItem("currentTexturePack", defaultPackId);
    }
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
        packDateElement.textContent = pack.dateAdded;
        packElement.style.display = "flex";

        // Set the preview image from icon.png
        const iconSrc = await getTexturePackIcon(pack.id);
        packImageElement.src = iconSrc;

        // Visually select the current texture pack
        if (pack.id == currentTexturePack) {
            packElement.classList.add("selected");
            selectedTexturePack = pack.id;
        }

        packElement.addEventListener("click", () => {
            selectTexturePack(pack.id, packElement);
        });
        texturePacksContainer.appendChild(packElement);
    }
}

function selectTexturePack(id, selectedElement) {
    const allPackContainers =
        texturePacksContainer.querySelectorAll(".world-container");
    allPackContainers.forEach((container) => {
        container.classList.remove("selected");
    });

    selectedElement.classList.add("selected");
    selectedTexturePack = id;

    localStorage.setItem("currentTexturePack", id);
}

// Helper function to get the icon.png from a texture pack ZIP as base64
// Helper function to get the icon.png from a texture pack ZIP as base64
async function getTexturePackIcon(packId) {
    if (packId === "default") {
        return "Assets/sprites/menu/worldPreview.png"; // Default fallback icon
    }

    const texturePackData = localStorage.getItem(`texturePack_${packId}`);
    if (!texturePackData) return "Assets/sprites/menu/worldPreview.png";

    const base64Data = texturePackData.startsWith(
        "data:application/x-zip-compressed;base64,"
    )
        ? texturePackData.replace(
              "data:application/x-zip-compressed;base64,",
              ""
          )
        : texturePackData;

    try {
        const zip = await JSZip.loadAsync(base64Data, { base64: true });
        // Search for any file ending with "icon.png"
        const iconFilePath = Object.keys(zip.files).find((fileName) =>
            fileName.endsWith("icon.png")
        );
        if (iconFilePath) {
            const iconFile = zip.file(iconFilePath);
            if (iconFile) {
                const base64 = await iconFile.async("base64");
                return `data:image/png;base64,${base64}`;
            }
        }
    } catch (err) {
        console.error(`Failed to load icon for texture pack ${packId}:`, err);
    }
    return "Assets/sprites/menu/worldPreview.png"; // Fallback if no icon or error
}

function uploadTexturePack() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const texturePackList =
                    JSON.parse(localStorage.getItem("texturePackList")) || [];
                const packId = Date.now();
                const packInfo = {
                    id: packId,
                    name: file.name.replace(".zip", ""),
                    dateAdded: new Date().toLocaleString(),
                };

                localStorage.setItem(
                    `texturePack_${packId}`,
                    event.target.result
                );
                texturePackList.push(packInfo);
                localStorage.setItem(
                    "texturePackList",
                    JSON.stringify(texturePackList)
                );

                populateTexturePacks();
            };
            reader.readAsDataURL(file);
        }
    };

    input.click();
}

function removeTexturePack() {
    if (!selectedTexturePack || selectedTexturePack === "default") return;

    const texturePackList = JSON.parse(localStorage.getItem("texturePackList"));
    if (!texturePackList) return;

    if (!confirm("Are you sure you want to delete this texture pack?")) return;

    localStorage.removeItem(`texturePack_${selectedTexturePack}`);
    localStorage.setItem(
        "texturePackList",
        JSON.stringify(
            texturePackList.filter((pack) => pack.id !== selectedTexturePack)
        )
    );

    if (localStorage.getItem("currentTexturePack") === selectedTexturePack) {
        localStorage.setItem("currentTexturePack", "default");
    }

    selectedTexturePack = null;
    populateTexturePacks();
}

function getTexturePackData(id) {
    if (id === "default") return null; // Game should use built-in assets
    return localStorage.getItem(`texturePack_${id}`);
}

function createNewWorld() {
    let worldName = "New World";
    let seed = "";
    worldName = prompt("Enter world name: ", worldName);
    seed = prompt("Enter world seed (leave empty for a random seed): ", seed);

    if (!seed) seed = Math.floor(Math.random() * 100000000);
    if (!worldName) worldName = "New World";

    localStorage.setItem(
        "selectedWorld",
        JSON.stringify({ id: Date.now(), name: worldName, seed: seed })
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
    menuContainer.style.display = "flex";
    panorama.style.display = "block";
    worldSelectContainer.style.display = "none";
    footer.style.display = "block";
    texturePackSelectContainer.style.display = "none";
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
    removeWorldButton.disabled = true;
    selectedWorld = id;
}

worldPlayButton.disabled = true;

setTimeout(() => {
    PlayRandomMusic();
}, 1000);

populateWorlds();
initializeDefaultTexturePack();
