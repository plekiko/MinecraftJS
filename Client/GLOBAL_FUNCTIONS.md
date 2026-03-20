# Global Functions

## Recent removals/changes:
- Removed: double-scaling of block preview hover (camera.zoom applied twice).
- Removed: manual pixel rounding for block preview hover; now uses camera.worldToScreen for position and BLOCK_SIZE/spriteSize for scale.
- Removed: legacy overlay fillRect artifacts; now all overlays and block rendering use pixel-perfect rounding.
- Updated: drawBreakAndPlaceCursor now uses camera.worldToScreen for both preview and outline, and BLOCK_SIZE/spriteSize for scale.

Auto-generated list of top-level function declarations matching `^(async\s+)?function` at column 1.

## Assets/entities/mobs/cow.js
- createCowBody (line 73)

## Assets/entities/mobs/creeper.js
- createCreeperBody (line 118)

## Assets/entities/mobs/pig.js
- createPigBody (line 64)

## Assets/entities/mobs/sheep.js
- createSheepBody (line 130)

## Assets/entities/mobs/wither_skeleton.js
- createWitherSkeletonBody (line 96)

## Assets/entities/mobs/zombie.js
- createZombieBody (line 97)

## Assets/entities/player.js
- createPlayerBody (line 1752)

## Assets/game/item.js
- getItem (line 54)

## Assets/game/music.js
- playRandomSong (line 22)
- startMusic (line 41)

## Assets/game/skinPreview.js
- drawSkinPreview (line 20)

## Assets/game/sounds.js
- preloadSounds (line 137)
- playRandomSoundFromArray (line 160)
- removeAudio (line 179)
- playSound (line 218)
- playPositionalSound (line 265)
- playMessySound (line 331)
- stopMessySound (line 392)
- updatePositionalAudioVolumes (line 409)

## Assets/multiplayer/messageHandler.js
- applyInventoryFromSave (line 5)
- applyPlayerDataFromFile (line 46)
- processMessage (line 83)
- getChunk (line 255)
- updatePlayerState (line 269)
- iJoined (line 276)
- handleEntityRPC (line 341)

## Assets/multiplayer/server.js
- buildMultiplayerLeaveSnapshot (line 89)
- sendMultiplayerLeaveSync (line 116)

## Assets/utils/classes.js
- calculateDirection (line 41)
- arePropsEqual (line 387)
- hexToRgb (line 400)
- adjustColorBrightness (line 409)
- rgbToHex (line 421)
- randomRange (line 429)
- angleToVector (line 433)
- lerp (line 437)
- caculateDirection (line 441)
- isValidClassType (line 446)
- easeInOut (line 458)
- lerpEaseInOut (line 462)
- easeIn (line 467)
- easeOut (line 471)
- lerpEaseIn (line 475)
- lerpEaseOut (line 480)
- uuidv4 (line 485)

## Assets/utils/indexDB.js
- getFromLdb (line 58)
- deleteFromLdb (line 70)

## Assets/utils/keyBindings.js
- getKeyDisplayName (line 191)
- getActionLabel (line 195)
- loadKeyBindings (line 199)
- saveKeyBindings (line 216)

## Assets/utils/object.js
- checkCollision (line 1)
- checkCollisionUsingObjects (line 23)

## Assets/utils/renderer.js
- drawBackground (line 31)
- interpolateColor (line 66)
- hexToRgb (line 75)
- mouseOverPosition (line 84)
- isColliding (line 97)
- drawParticleEmitters (line 106)
- draw (line 112)
- drawLoadScreen (line 131)
- drawEntities (line 155)
- drawBreakAndPlaceCursor (line 183)
- drawChunks (line 216)
- drawCoordinates (line 236)
- drawCamera (line 252)
- drawLate (line 259)
- afterDraw (line 264)
- drawUI (line 276)
- drawInventory (line 282)
- drawDestroyStage (line 288)
- drawChunkLine (line 308)
- drawCursor (line 324)
- drawFps (line 347)
- drawChunkStats (line 355)
- drawExpectedFileSize (line 400)
- drawHeight (line 414)
- drawDebugMouseBlock (line 463)
- drawHotbar (line 486)
- drawText (line 492)
- drawHitboxes (line 539)
- drawSimpleImage (line 545)
- drawImage (line 590)
- drawRect (line 710)

## Assets/utils/texturePackLoader.js
- loadVanillaTextures (line 6)
- loadTexturePack (line 116)
- initializeTextures (line 204)
- getSpriteUrl (line 210)
- getSpriteAverageColor (line 227)
- getSpriteSize (line 243)
- isEqualToOriginal (line 273)
- waitForTexturePack (line 290)
- isBase64 (line 303)
- getAverageColor (line 313)

## Assets/world/block.js
- checkDissipation (line 202)
- flowDownward (line 238)
- setBlockType (line 256)
- verticalCheckAbove (line 269)
- flowSideways (line 285)
- getBlock (line 1803)

## Assets/world/dimension.js
- gotoDimension (line 159)
- getDimension (line 186)
- getDimensionChunks (line 190)

## Assets/world/explosion.js
- createExplosion (line 10)

## Assets/world/generator.js
- setSeed (line 11)
- printNoiseOutput (line 18)
- locateBiome (line 38)
- loadCustomSeed (line 52)
- biomesInChunkCount (line 117)
- regenerateWorld (line 135)
- getChunkFromServer (line 148)
- generateWorld (line 162)
- serverPlaceBlock (line 234)
- serverBreakBlock (line 259)
- uploadChunkToServer (line 286)
- generateStructure (line 302)
- generateChestWithLoot (line 370)
- populateStorageWithLoot (line 392)
- calculateChunkBiome (line 419)
- getNeighborBiomeData (line 437)
- generateChunk (line 450)
- getChunk (line 468)
- postProcessChunk (line 474)
- generateStructures (line 505)
- fill (line 562)
- worldToBlocks (line 597)
- worldToUserBlockY (line 604)
- userBlockYToWorld (line 608)
- userBlocksToWorldPosition (line 612)
- getBlockAtUserBlockPosition (line 616)
- setBlockTypeAtUserBlockPosition (line 631)
- worldToLocal (line 653)
- getChunkByIndex (line 662)
- getBiomeForNoise (line 670)
- getBlockWorldPosition (line 687)
- getBlockAtWorldPosition (line 691)
- placePortalInDimension (line 707)
- checkAdjacentBlocks (line 826)
- setBlockTypeAtPosition (line 852)
- bufferBlock (line 892)
- getChunkForX (line 920)
- getChunkXForWorldX (line 928)

## Assets/world/particleEmitter.js
- createParticleEmitter (line 125)
- removeParticleEmitter (line 165)
- createParticleEmitterAtPlayer (line 172)

## Assets/world/saving.js
- autoSave (line 7)
- saveWorld (line 25)
- saveChunk (line 141)
- loadWorldFromLocalStorage (line 186)
- loadWorld (line 223)
- loadChunk (line 372)

## Assets/world/world.js
- removeEntity (line 8)
- tick (line 35)
- updateParticleEmitters (line 56)
- globalRecalculateRedstone (line 62)
- updateBlockAfterTick (line 184)
- globalRecalculateLight (line 188)
- globalUpdateSkyLight (line 243)
- updateBlocks (line 249)
- getEntityByUUID (line 277)

## Noise/script.js
- lerp (line 18)
- interpolateColor (line 23)

## buttonUtils.js
- playButtonSound (line 42)
- downloadWorldSave (line 59)

## debug.js
- updateDebug (line 4)
- handleDebugging (line 9)
- handleDebugInput (line 13)
- updateDebugButtonLabels (line 31)
- toggleChunkBorders (line 45)
- toggleCamera (line 49)
- toggleHitbox (line 53)
- togglePrintBlock (line 57)
- toggleFileSize (line 61)
- toggleFps (line 65)
- toggleCoordinates (line 69)
- printBlockLogic (line 74)
- cameraLogic (line 96)

## main.js
- waitForTexturePack (line 14)
- loadSettings (line 27)
- summonEntity (line 44)
- spawnDrop (line 68)
- spawnPlayer (line 81)
- calculateFPS (line 119)
- gameLoop (line 133)
- updateGame (line 160)
- initGame (line 172)
- dayNightCycle (line 202)
- updateEntities (line 215)
- updateArray (line 239)
- cursorBlockLogic (line 245)
- animateFrame (line 284)

## menu.js
- setRandomText (line 109)
- multiplayerButton (line 122)
- downloadServer (line 128)
- updateMusicVolume (line 139)
- updateSFXVolume (line 148)
- toggleLighting (line 154)
- saveSettings (line 161)
- setUsernameFooter (line 173)
- loadSettings (line 177)
- showTexturePacks (line 220)
- playGame (line 231)
- playRandomMusic (line 238)
- playMusic (line 248)
- startMusicOnFirstInteraction (line 259)
- parseDate (line 272)
- populateWorlds (line 277)
- initializeDefaultTexturePack (line 314)
- populateTexturePacks (line 340)
- selectTexturePack (line 373)
- getTexturePackIcon (line 390)
- uploadTexturePack (line 403)
- uploadSkin (line 483)
- clearSkin (line 506)
- removeTexturePack (line 513)
- getTexturePackData (line 539)
- gotoWorldCreate (line 550)
- createNewWorld (line 557)
- getSavedWorld (line 574)
- downloadSelectedWorld (line 582)
- uploadWorld (line 591)
- removeWorld (line 639)
- backToMenu (line 657)
- backToWorldSelection (line 661)
- switchGameMode (line 667)
- setGameMode (line 672)
- updateWorldSeed (line 679)
- updateWorldName (line 687)
- playSelectedWorld (line 695)
- selectWorld (line 711)
- pingServer (line 724)
- pingServerAndUpdate (line 809)
- updateServerStatus (line 857)
- pingAllServers (line 912)
- showServers (line 921)
- displayServers (line 930)
- pingAndRenderServers (line 954)
- forceRefreshServers (line 985)
- sanitizeHtml (line 990)
- isValidServerName (line 999)
- isValidServerIp (line 1005)
- renderServers (line 1012)
- parseMotdToHtml (line 1073)
- selectServer (line 1104)
- gotoAddServer (line 1117)
- updateServerName (line 1126)
- updateServerIP (line 1130)
- addServer (line 1134)
- removeServer (line 1167)
- gotoQuickConnect (line 1184)
- updateQuickConnectIP (line 1201)
- connectToServer (line 1205)
- cancelQuickConnect (line 1251)
- backToServerSelection (line 1257)
- gotoOptions (line 1268)
- gotoControls (line 1315)
- isBindingDefault (line 1324)
- renderControlRow (line 1332)
- renderControlsList (line 1367)
- startRebind (line 1388)
- cancelRebind (line 1488)
- resetControlsToDefault (line 1500)
- showMenu (line 1511)
- hideMenu (line 1536)
- initialize (line 1560)

## structureCreator.js
- initializeGrids (line 23)
- drawGrid (line 71)
- handlePaint (line 193)
- createPaletteItem (line 269)
- loadSavedBuilds (line 337)
- saveBuildsToLocalStorage (line 342)
- updateSavedBuildsList (line 360)
- scheduleSavedBuildsUpdate (line 426)
- getBlockAverageColor (line 433)
- generatePreviewCanvas (line 474)

Total functions: 275
