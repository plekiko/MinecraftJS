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

    // Player
    Player_Hurt: ["player/hit1", "player/hit2", "player/hit3"],
    Player_Eat: ["player/eat1", "player/eat2", "player/eat3"],
});

function PlayRandomSoundFromArray({
    array,
    pathInSfx = "",
    end = ".ogg",
    volume = 1,
    positional = false,
    range = 10,
    origin = new Vector2(),
}) {
    if (!positional)
        playSound(
            pathInSfx + array[RandomRange(0, array.length)] + end,
            volume
        );
    else
        playPositionalSound(
            origin,
            pathInSfx + array[RandomRange(0, array.length)] + end,
            range,
            volume
        );
}

// Create (or reuse) an AudioContext.
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Global array to store currently playing audio objects.
let playingAudio = [];

function removeAudio(audio) {
    if (!audio) return;
    if (!(audio instanceof Audio)) return;
    audio.pause();
    playingAudio = playingAudio.filter((item) => item.audio !== audio);
}

// A fallback for non-positional sounds with pitch support.
function playSound(sound, volume = 1, pitch = 1) {
    const audio = new Audio("Assets/audio/sfx/" + sound);
    audio.volume = volume;

    // Disable pitch preservation so that playbackRate changes the pitch
    audio.preservesPitch = false; // Standard (if supported)
    audio.webkitPreservesPitch = false; // WebKit-specific
    audio.mozPreservesPitch = false; // Firefox-specific

    // Set the playbackRate (this changes both pitch and duration if pitch is not preserved)
    audio.playbackRate = pitch;
    audio.play();
}

// Play a positional sound using the Web Audio API with panning and pitch.
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

    // Create an Audio element.
    const audioElem = new Audio("Assets/audio/sfx/" + sound);
    // Set the pitch (playback rate) on the audio element.
    audioElem.preservesPitch = false; // Standard (if supported)
    audioElem.webkitPreservesPitch = false; // WebKit-specific
    audioElem.mozPreservesPitch = false; // Firefox-specific

    audioElem.playbackRate = pitch;

    // Create a MediaElementAudioSourceNode from the audio element.
    const sourceNode = audioCtx.createMediaElementSource(audioElem);

    // Create a StereoPannerNode.
    const panner = audioCtx.createStereoPanner();

    // Connect the nodes: source -> panner -> destination.
    sourceNode.connect(panner);
    panner.connect(audioCtx.destination);

    // Calculate distance and volume.
    const distance = Vector2.Distance(player.position, origin);
    const volume =
        distance <= range * BLOCK_SIZE
            ? maxVolume * (1 - distance / (range * BLOCK_SIZE))
            : 0;
    // Set the volume on the audio element.
    audioElem.volume = volume;

    // Calculate pan value.
    const panDiff = (origin.x - player.position.x) / (range * BLOCK_SIZE);
    const panValue = Math.max(-1, Math.min(1, panDiff));
    panner.pan.value = panValue;

    // Store this audio object for later updates.
    const audioObj = { audioElem, origin, range, maxVolume, panner };
    playingAudio.push(audioObj);

    audioElem.addEventListener("ended", () => {
        playingAudio = playingAudio.filter(
            (item) => item.audioElem !== audioElem
        );
    });

    // Start playing.
    audioElem.play();

    return audioElem;
}

// This function can be called in your game loop to update volumes and panning
// in case the player moves.
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
    });
}
