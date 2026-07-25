import { runtime } from "../utils/runtime.js";
import { Vector2, randomRange, uuidv4 } from "../utils/classes.js";
import { BLOCK_SIZE } from "../utils/globals.js";
import { isMediaPacked, resolveAssetUrl } from "../utils/assetBundle.js";
import { Sounds } from "@minecraftjs/shared/sounds.js";
export { Sounds };

// Base URL for audio files
export const AUDIO_BASE_URL = "Assets/audio/sfx/";

// Cache for preloaded audio elements
export const soundCache = {};

// Create AudioContext
export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Global array to store currently playing positional audio objects
export let playingAudio = [];
export let messySounds = [];

function createPreloadedAudio(url, mime = "audio/ogg") {
    const audio = new Audio();
    audio.preload = "auto";
    // <source type> helps browsers decode blob: URLs
    if (url.startsWith("blob:") || url.startsWith("data:")) {
        const source = document.createElement("source");
        source.src = url;
        source.type = mime;
        audio.appendChild(source);
    } else {
        audio.src = url;
    }
    return audio;
}

// Preload all sounds at game initialization
export function preloadSounds() {
    const allSounds = Object.values(Sounds).flat();
    allSounds.forEach((sound) => {
        const logical = `${AUDIO_BASE_URL}${sound}.ogg`;
        const url = resolveAssetUrl(logical);
        if (soundCache[url]) return;

        // Packed build: skip paths that never made it into media.zip
        if (
            isMediaPacked() &&
            !url.startsWith("blob:") &&
            !url.startsWith("data:")
        ) {
            console.warn(`Sound missing from media pack: ${logical}`);
            return;
        }

        const audio = createPreloadedAudio(url, "audio/ogg");
        soundCache[url] = audio;
        audio.onerror = () => {
            console.warn(`Failed to preload sound: ${logical}`);
            delete soundCache[url];
        };
        audio.load();
    });
}

// Call this at game startup (after media.zip is unpacked in production)
preloadSounds();

// Play a random sound from an array
export function playRandomSoundFromArray({
    array,
    pathInSfx = "",
    end = ".ogg",
    volume = 1,
    positional = false,
    range = 10,
    origin = new Vector2(),
}) {
    const soundPath = array[randomRange(0, array.length)];
    const fullPath = `${pathInSfx}${soundPath}${end}`;

    if (!positional) {
        playSound(fullPath, volume);
    } else {
        playPositionalSound(origin, fullPath, range, volume);
    }
}

export function removeAudio(audio) {
    if (!audio || !(audio instanceof Audio)) return;

    const index = playingAudio.findIndex((item) => item.audioElem === audio);
    if (index !== -1) {
        const audioObj = playingAudio[index];

        // Disconnect and clean up audio graph
        if (audioObj.sourceNode) {
            try {
                audioObj.sourceNode.disconnect();
            } catch (e) {}
            audioObj.sourceNode = null;
        }

        if (audioObj.panner) {
            try {
                audioObj.panner.disconnect();
            } catch (e) {}
            audioObj.panner = null;
        }

        // Remove from active list
        playingAudio.splice(index, 1);
    }

    // Stop playback and release element
    try {
        audio.pause();
        audio.src = "";
        audio.load(); // releases media element resources
    } catch (e) {}

    // Remove event listeners to prevent leaks
    audio.onended = null;
    audio.onerror = null;
}

// Play a non-positional sound with error handling
export function playSound(sound, volume = 1, pitch = 1, loop = false) {
    const sfxMultiplier = (runtime.game.settings.sfxVolume ?? 100) / 100;
    volume = volume * sfxMultiplier;

    const url = resolveAssetUrl(`${AUDIO_BASE_URL}${sound}`);
    const cachedAudio = soundCache[url];

    if (cachedAudio) {
        // Clone the cached audio to allow multiple simultaneous plays
        const audio = cachedAudio.cloneNode(true);
        audio.volume = volume;
        audio.preservesPitch = false;
        audio.webkitPreservesPitch = false;
        audio.mozPreservesPitch = false;
        audio.playbackRate = pitch;

        audio.loop = loop;

        audio.onerror = () => {
            console.error(`Error loading sound: ${url}`);
        };
        audio.play().catch((err) => {
            console.error(`Error playing sound ${url}: ${err}`);
        });

        return audio;
    } else {
        console.warn(`Sound not preloaded or failed to load: ${url}`);
        // Fallback: attempt to play directly
        const audio = createPreloadedAudio(url, "audio/ogg");
        audio.volume = volume;
        audio.preservesPitch = false;
        audio.webkitPreservesPitch = false;
        audio.mozPreservesPitch = false;
        audio.playbackRate = pitch;

        audio.loop = loop;

        audio.play().catch((err) => {
            console.error(`Fallback play failed for ${url}: ${err}`);
        });

        return audio;
    }
}

// Play a positional sound with Web Audio API
export function playPositionalSound(
    origin,
    sound,
    range = 10,
    maxVolume = 1,
    pitch = 1,
    loop = false,
) {
    const sfxMultiplier = (runtime.game.settings.sfxVolume ?? 100) / 100;
    maxVolume = maxVolume * sfxMultiplier;

    if (!runtime.world.player) {
        playSound(sound, maxVolume, pitch);
        return;
    }

    const url = resolveAssetUrl(`${AUDIO_BASE_URL}${sound}`);
    const cachedAudio = soundCache[url];

    let audioElem;
    if (cachedAudio) {
        audioElem = cachedAudio.cloneNode(true);
    } else {
        // console.warn(`Positional sound not preloaded: ${url}`);
        audioElem = createPreloadedAudio(url, "audio/ogg");
    }

    audioElem.preservesPitch = false;
    audioElem.webkitPreservesPitch = false;
    audioElem.mozPreservesPitch = false;
    audioElem.playbackRate = pitch;
    audioElem.loop = loop;

    const sourceNode = audioCtx.createMediaElementSource(audioElem);
    const panner = audioCtx.createStereoPanner();
    sourceNode.connect(panner);
    panner.connect(audioCtx.destination);

    const distance = Vector2.Distance(runtime.world.player.position, origin);
    const volume =
        distance <= range * BLOCK_SIZE
            ? maxVolume * (1 - distance / (range * BLOCK_SIZE))
            : 0;
    audioElem.volume = volume;

    const panDiff = (origin.x - runtime.world.player.position.x) / (range * BLOCK_SIZE);
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

export function playMessySound(
    origin,
    sound,
    range = 10,
    maxVolume = 1,
    messyRange = new Vector2(1, 4),
) {
    const sfxMultiplier = (runtime.game.settings.sfxVolume ?? 100) / 100;
    maxVolume = maxVolume * sfxMultiplier;

    // A positional sound that plays every messyRange seconds, only if the player is within range
    // Tracks the sound instance and allows stopping via stopMessySound

    // Validate input
    if (!origin || !sound || !messyRange) {
        return null;
    }

    // Create a unique ID for the messy sound instance
    const soundId = uuidv4();

    // Function to play the sound and schedule the next play
    const playAndSchedule = () => {
        // Check if player is within range
        if (
            runtime.world.player &&
            Vector2.Distance(runtime.world.player.position, origin) <=
                range * BLOCK_SIZE
        ) {
            const pitch = randomRange(0.5, 1.5); // Randomize pitch for each play
            playPositionalSound(origin, sound, range, maxVolume, pitch, false);
        }

        // Schedule the next play with a new random interval
        const interval = randomRange(messyRange.x, messyRange.y) * 1000;
        const timeoutId = setTimeout(playAndSchedule, interval);

        // Update the timeout ID in the messySounds array
        const soundInstance = messySounds.find((s) => s.soundId === soundId);
        if (soundInstance) {
            soundInstance.timeoutId = timeoutId;
        }
    };

    // Initial play
    playAndSchedule();

    // Store the messy sound instance
    const soundInstance = {
        soundId,
        origin: new Vector2(origin.x, origin.y), // Copy to avoid reference issues
        sound,
        range,
        maxVolume,
        messyRange: new Vector2(messyRange.x, messyRange.y),
        timeoutId: null, // Will be set by playAndSchedule
    };
    messySounds.push(soundInstance);

    return soundId; // Return ID for stopping specific sounds
}

export function stopMessySound(soundId) {
    // Stops a specific messy sound by soundId
    if (!soundId) {
        console.warn(`No soundId provided to stopMessySound`);
        return;
    }

    const soundInstance = messySounds.find((s) => s.soundId === soundId);
    if (soundInstance) {
        clearTimeout(soundInstance.timeoutId);
        messySounds = messySounds.filter((s) => s.soundId !== soundId);
    } else {
        console.warn(`No messy sound found with ID ${soundId}`);
    }
}

// Update positional audio in the game loop
export function updatePositionalAudioVolumes() {
    if (!runtime.world.player) return;
    playingAudio.forEach((item) => {
        const distance = Vector2.Distance(runtime.world.player.position, item.origin);
        let volume =
            distance <= item.range * BLOCK_SIZE
                ? item.maxVolume * (1 - distance / (item.range * BLOCK_SIZE))
                : 0;
        item.audioElem.volume = volume;

        const panDiff =
            (item.origin.x - runtime.world.player.position.x) /
            (item.range * BLOCK_SIZE);
        const panValue = Math.max(-1, Math.min(1, panDiff));
        item.panner.pan.value = panValue;

        // Clean up if volume is 0 (out of range)
        if (volume <= 0 && !item.audioElem.paused) {
            removeAudio(item.audioElem);
        }
    });
}
