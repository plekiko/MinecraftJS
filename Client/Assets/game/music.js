import { runtime } from "../utils/runtime.js";
import { randomRange } from "../utils/classes.js";
import { resolveAssetUrl } from "../utils/assetBundle.js";

export const musicStartDelayRange = { min: 10, max: 60 };
export const musicBetweenDelay = { min: 60, max: 180 };

export let isPlaying = false;
export let musicPlayer = new Audio();

export const songs = [
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

export function playRandomSong() {
    let randomSongIndex = randomRange(0, songs.length);
    let randomSongUrl = resolveAssetUrl(
        "Assets/audio/music/" + songs[randomSongIndex] + ".ogg",
    );

    musicPlayer.src = randomSongUrl;
    const musicVol = (runtime.game.settings.musicVolume ?? 100) / 100;
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

export function startMusic() {
    if (isPlaying) return;

    let startDelay =
        randomRange(musicStartDelayRange.min, musicStartDelayRange.max) * 1000;
    setTimeout(playRandomSong, startDelay);
}

startMusic();
