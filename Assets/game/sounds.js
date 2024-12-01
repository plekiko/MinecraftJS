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

function playPositionalSound(origin, sound, range = 10, maxVolume = 1) {
    if (!player) {
        playSound(sound, maxVolume);
        return;
    }

    const distance = Vector2.Distance(player.position, origin);
    if (distance <= range * BLOCK_SIZE) {
        // Calculate linear volume scale
        const volume = maxVolume * (1 - distance / (range * BLOCK_SIZE));
        playSound(sound, volume);
    }
}

function playSound(sound, volume = 1) {
    const audio = new Audio("Assets/audio/sfx/" + sound);
    audio.volume = volume;
    audio.play();
}
