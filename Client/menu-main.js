/**
 * Title-screen entry — loads menu modules and bridges HTML onclick handlers.
 */
import * as menu from "./menu.js";
import { playButtonSound, downloadWorldSave } from "./buttonUtils.js";

const htmlApi = {
    playButtonSound,
    downloadWorldSave,
    setRandomText: menu.setRandomText,
    playGame: menu.playGame,
    multiplayerButton: menu.multiplayerButton,
    gotoOptions: menu.gotoOptions,
    playSelectedWorld: menu.playSelectedWorld,
    gotoWorldCreate: menu.gotoWorldCreate,
    uploadWorld: menu.uploadWorld,
    removeWorld: menu.removeWorld,
    downloadSelectedWorld: menu.downloadSelectedWorld,
    backToMenu: menu.backToMenu,
    uploadTexturePack: menu.uploadTexturePack,
    removeTexturePack: menu.removeTexturePack,
    downloadServer: menu.downloadServer,
    connectToServer: menu.connectToServer,
    gotoQuickConnect: menu.gotoQuickConnect,
    gotoAddServer: menu.gotoAddServer,
    removeServer: menu.removeServer,
    forceRefreshServers: menu.forceRefreshServers,
    addServer: menu.addServer,
    backToServerSelection: menu.backToServerSelection,
    cancelQuickConnect: menu.cancelQuickConnect,
    switchGameMode: menu.switchGameMode,
    switchDifficulty: menu.switchDifficulty,
    createNewWorld: menu.createNewWorld,
    backToWorldSelection: menu.backToWorldSelection,
    applySelectedSkin: menu.applySelectedSkin,
    toggleLighting: menu.toggleLighting,
    showTexturePacks: menu.showTexturePacks,
    gotoControls: menu.gotoControls,
    showSkins: menu.showSkins,
    resetControlsToDefault: menu.resetControlsToDefault,
    saveSettings: menu.saveSettings,
    updateMusicVolume: menu.updateMusicVolume,
    updateSFXVolume: menu.updateSFXVolume,
    updateWorldSeed: menu.updateWorldSeed,
    updateWorldName: menu.updateWorldName,
    updateServerName: menu.updateServerName,
    updateServerIP: menu.updateServerIP,
    updateQuickConnectIP: menu.updateQuickConnectIP,
};

Object.assign(window, htmlApi);
