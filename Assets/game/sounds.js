const Sounds = Object.freeze({
    Break_Grass: ["dig/grass1", "dig/grass2", "dig/grass3", "dig/grass4"],
    Break_Cloth: ["dig/cloth1", "dig/cloth2", "dig/cloth3", "dig/cloth4"],
    Break_Gravel: ["dig/gravel1", "dig/gravel2", "dig/gravel3", "dig/gravel4"],
    Break_Sand: ["dig/sand1", "dig/sand2", "dig/sand3", "dig/sand4"],
    Break_Snow: ["dig/snow1", "dig/snow2", "dig/snow3", "dig/snow4"],
    Break_Stone: ["dig/stone1", "dig/stone2", "dig/stone3", "dig/stone4"],
    Break_Wood: ["dig/wood1", "dig/wood2", "dig/wood3", "dig/wood4"],
    Break_Glass: ["dig/glass1", "dig/glass2", "dig/glass3"],

    Breaking_Grass: [
        "step/grass1",
        "step/grass2",
        "step/grass3",
        "step/grass4",
        "step/grass5",
        "step/grass6",
    ],
    Breaking_Cloth: [
        "step/cloth1",
        "step/cloth2",
        "step/cloth3",
        "step/cloth4",
    ],
    Breaking_Gravel: [
        "step/gravel1",
        "step/gravel2",
        "step/gravel3",
        "step/gravel4",
    ],
    Breaking_Sand: [
        "step/sand1",
        "step/sand2",
        "step/sand3",
        "step/sand4",
        "step/sand5",
    ],
    Breaking_Snow: ["step/snow1", "step/snow2", "step/snow3", "step/snow4"],
    Breaking_Stone: [
        "step/stone1",
        "step/stone2",
        "step/stone3",
        "step/stone4",
        "step/stone5",
        "step/stone6",
    ],
    Breaking_Wood: [
        "step/wood1",
        "step/wood2",
        "step/wood3",
        "step/wood4",
        "step/wood5",
        "step/wood6",
    ],

    Water_Enter: ["liquid/splash", "liquid/splash2"],

    // Mobs
    Pig_Say: ["mobs/pig/say1", "mobs/pig/say2", "mobs/pig/say3"],
    Pig_Step: [
        "mobs/pig/step1",
        "mobs/pig/step2",
        "mobs/pig/step3",
        "mobs/pig/step4",
        "mobs/pig/step5",
    ],
    Cow_Say: [
        "mobs/cow/say1",
        "mobs/cow/say2",
        "mobs/cow/say3",
        "mobs/cow/say4",
    ],
    Cow_Step: [
        "mobs/cow/step1",
        "mobs/cow/step2",
        "mobs/cow/step3",
        "mobs/cow/step4",
    ],
    Cow_Hurt: ["mobs/cow/hurt1", "mobs/cow/hurt2", "mobs/cow/hurt3"],

    Zombie_Say: ["mobs/zombie/say1", "mobs/zombie/say2", "mobs/zombie/say3"],
    Zombie_Step: [
        "mobs/zombie/step1",
        "mobs/zombie/step2",
        "mobs/zombie/step3",
        "mobs/zombie/step4",
        "mobs/zombie/step5",
    ],
    Zombie_Hurt: ["mobs/zombie/hurt1", "mobs/zombie/hurt2"],

    Sheep_Say: ["mobs/sheep/say1", "mobs/sheep/say2", "mobs/sheep/say3"],
    Sheep_Step: [
        "mobs/sheep/step1",
        "mobs/sheep/step2",
        "mobs/sheep/step3",
        "mobs/sheep/step4",
        "mobs/sheep/step5",
    ],

    // Player
    Player_Hurt: ["player/hit1", "player/hit2", "player/hit3"],
    Player_Eat: ["player/eat1", "player/eat2", "player/eat3"],

    Explosion: ["tnt/explode1", "tnt/explode2", "tnt/explode3", "tnt/explode4"],
});

// Base URL for audio files
const AUDIO_BASE_URL = "Assets/audio/sfx/";

// Cache for preloaded audio elements
const soundCache = {};

// Create AudioContext
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Global array to store currently playing positional audio objects
let playingAudio = [];

// Preload all sounds at game initialization
function preloadSounds() {
    const allSounds = Object.values(Sounds).flat();
    allSounds.forEach((sound) => {
        const url = `${AUDIO_BASE_URL}${sound}.ogg`;
        if (!soundCache[url]) {
            const audio = new Audio(url);
            audio.preload = "auto";
            audio.onerror = () => {
                console.error(`Failed to preload sound: ${url}`);
                delete soundCache[url]; // Remove failed entries
            };
            audio.oncanplaythrough = () => {
                // Ensure audio is fully loaded before marking as ready
                soundCache[url] = audio;
            };
        }
    });
}

// Call this at game startup
preloadSounds();

// Play a random sound from an array
function PlayRandomSoundFromArray({
    array,
    pathInSfx = "",
    end = ".ogg",
    volume = 1,
    positional = false,
    range = 10,
    origin = new Vector2(),
}) {
    const soundPath = array[RandomRange(0, array.length)];
    const fullPath = `${pathInSfx}${soundPath}${end}`;

    if (!positional) {
        playSound(fullPath, volume);
    } else {
        playPositionalSound(origin, fullPath, range, volume);
    }
}

// Remove an audio object from the playing list
function removeAudio(audio) {
    if (!audio || !(audio instanceof Audio)) return;
    audio.pause();
    playingAudio = playingAudio.filter((item) => item.audioElem !== audio);
}

// Play a non-positional sound with error handling
function playSound(sound, volume = 1, pitch = 1) {
    const url = `${AUDIO_BASE_URL}${sound}`;
    const cachedAudio = soundCache[url];

    if (cachedAudio) {
        // Clone the cached audio to allow multiple simultaneous plays
        const audio = cachedAudio.cloneNode();
        audio.volume = volume;
        audio.preservesPitch = false;
        audio.webkitPreservesPitch = false;
        audio.mozPreservesPitch = false;
        audio.playbackRate = pitch;

        audio.onerror = () => {
            console.error(`Error loading sound: ${url}`);
        };
        audio.play().catch((err) => {
            console.error(`Error playing sound ${url}: ${err}`);
        });
    } else {
        console.warn(`Sound not preloaded or failed to load: ${url}`);
        // Fallback: attempt to play directly
        const audio = new Audio(url);
        audio.volume = volume;
        audio.preservesPitch = false;
        audio.webkitPreservesPitch = false;
        audio.mozPreservesPitch = false;
        audio.playbackRate = pitch;
        audio.play().catch((err) => {
            console.error(`Fallback play failed for ${url}: ${err}`);
        });
    }
}

// Play a positional sound with Web Audio API
function playPositionalSound(
    origin,
    sound,
    range = 10,
    maxVolume = 1,
    pitch = 1
) {
    if (!player) {
        playSound(sound, maxVolume, pitch);
        return;
    }

    const url = `${AUDIO_BASE_URL}${sound}`;
    const cachedAudio = soundCache[url];

    let audioElem;
    if (cachedAudio) {
        audioElem = cachedAudio.cloneNode();
    } else {
        // console.warn(`Positional sound not preloaded: ${url}`);
        audioElem = new Audio(url);
    }

    audioElem.preservesPitch = false;
    audioElem.webkitPreservesPitch = false;
    audioElem.mozPreservesPitch = false;
    audioElem.playbackRate = pitch;

    const sourceNode = audioCtx.createMediaElementSource(audioElem);
    const panner = audioCtx.createStereoPanner();
    sourceNode.connect(panner);
    panner.connect(audioCtx.destination);

    const distance = Vector2.Distance(player.position, origin);
    const volume =
        distance <= range * BLOCK_SIZE
            ? maxVolume * (1 - distance / (range * BLOCK_SIZE))
            : 0;
    audioElem.volume = volume;

    const panDiff = (origin.x - player.position.x) / (range * BLOCK_SIZE);
    const panValue = Math.max(-1, Math.min(1, panDiff));
    panner.pan.value = panValue;

    const audioObj = { audioElem, origin, range, maxVolume, panner };
    playingAudio.push(audioObj);

    audioElem.addEventListener("ended", () => {
        removeAudio(audioElem);
    });
    audioElem.onerror = () => {
        // console.error(`Error with positional sound: ${url}`);
        removeAudio(audioElem);
    };

    audioElem.play().catch((err) => {
        // console.error(`Error playing positional sound ${url}: ${err}`);
    });

    return audioElem;
}

// Update positional audio in the game loop
function updatePositionalAudioVolumes() {
    if (!player) return;
    playingAudio.forEach((item) => {
        const distance = Vector2.Distance(player.position, item.origin);
        let volume =
            distance <= item.range * BLOCK_SIZE
                ? item.maxVolume * (1 - distance / (item.range * BLOCK_SIZE))
                : 0;
        item.audioElem.volume = volume;

        const panDiff =
            (item.origin.x - player.position.x) / (item.range * BLOCK_SIZE);
        const panValue = Math.max(-1, Math.min(1, panDiff));
        item.panner.pan.value = panValue;

        // Clean up if volume is 0 (out of range)
        if (volume <= 0 && !item.audioElem.paused) {
            removeAudio(item.audioElem);
        }
    });
}
