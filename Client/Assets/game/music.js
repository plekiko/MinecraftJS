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
    let randomSongIndex = randomRange(0, songs.length);
    let randomSongUrl = "Assets/audio/music/" + songs[randomSongIndex] + ".ogg";

    musicPlayer.src = randomSongUrl;
    const musicVol = (game.settings.musicVolume ?? 100) / 100;
    musicPlayer.volume = musicVol * 0.3;
    musicPlayer.play();

    isPlaying = true;

    musicPlayer.onended = () => {
        isPlaying = false;
        let delay =
            randomRange(musicBetweenDelay.min, musicBetweenDelay.max) * 1000;
        setTimeout(playRandomSong, delay);
    };
}

function startMusic() {
    if (isPlaying) return;

    let startDelay =
        randomRange(musicStartDelayRange.min, musicStartDelayRange.max) * 1000;
    setTimeout(playRandomSong, startDelay);
}

startMusic();
