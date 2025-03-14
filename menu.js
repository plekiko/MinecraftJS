const randomTextElement = document.querySelector(".splash");
const menuContainer = document.querySelector(".menu-container");
const worldsContainer = document.querySelector(".world-select");
const worldContainer = document.querySelector(".world-container");
const worldSelectContainer = document.querySelector(".world-select-container");
const worldPlayButton = document.getElementById("play-selected-btn");
const removeWorldButton = document.getElementById("remove-world-btn");
const footer = document.querySelector(".footer");

const panorama = document.querySelector(".panorama");

let selectedWorld = null;

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

// Helper function to parse dates in the format "dd-mm-yyyy, hh:mm:ss"
function parseDate(dateStr) {
    const [datePart, timePart] = dateStr.split(", ");
    const [day, month, year] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    // Note: Month in JavaScript's Date is 0-indexed, so subtract 1.
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
    // Remove the 'selected' class from all world containers
    const allWorldContainers = document.querySelectorAll(".world-container");
    allWorldContainers.forEach((container) => {
        container.classList.remove("selected");
    });

    selectedElement.classList.add("selected");

    worldPlayButton.disabled = false;
    removeWorldButton.disabled = false;

    selectedWorld = id;
}
worldPlayButton.disabled = true;

setTimeout(() => {
    PlayRandomMusic();
}, 1000);

populateWorlds();
