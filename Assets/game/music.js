const musicStartDelayRange = { min: 10, max: 60 };
const musicBetweenDelay = { min: 60, max: 180 };
let isPlaying = false;
let musicPlayer = new Audio();

const songs = [
    "calm1",
    "calm2",
    "calm3",
    "hal1",
    "hal2",
    "hal3",
    "hal4",
    "nuance1",
    "nuance2",
    "piano1",
    "piano2",
    "piano3",
];

function playRandomSong() {
    let randomSongIndex = RandomRange(0, songs.length);
    let randomSongUrl = "Assets/audio/music/" + songs[randomSongIndex] + ".ogg";

    musicPlayer.src = randomSongUrl;
    musicPlayer.play();

    isPlaying = true;

    musicPlayer.onended = () => {
        isPlaying = false;
        let delay =
            RandomRange(musicBetweenDelay.min, musicBetweenDelay.max) * 1000;
        setTimeout(playRandomSong, delay);
    };
}

function startMusic() {
    if (!isPlaying) {
        let startDelay =
            RandomRange(musicStartDelayRange.min, musicStartDelayRange.max) *
            1000;
        setTimeout(playRandomSong, startDelay);
    }
}

startMusic();
