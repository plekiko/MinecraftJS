const randomTextElement = document.querySelector(".splash");
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

setTimeout(() => {
    PlayRandomMusic();
}, 1000);
