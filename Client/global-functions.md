# Global Functions by File

## buttonUtils.js

-   playButtonSound
-   downloadWorldSave

## debug.js

-   updateDebug
-   handleDebugging
-   handleDebugInput
-   updateDebugButtonLabels
-   toggleChunkBorders
-   toggleCamera
-   toggleHitbox
-   togglePrintBlock
-   toggleFileSize
-   toggleFps
-   toggleCoordinates
-   printBlockLogic
-   cameraLogic

## Assets/multiplayer/server.js

-   buildMultiplayerLeaveSnapshot
-   sendMultiplayerLeaveSync
-   window.leaveGameToTitle

## Assets/multiplayer/messageHandler.js

-   applyInventoryFromSave
-   applyPlayerDataFromFile
-   processMessage
-   updatePlayerState
-   handleEntityRPC

## Assets/world/block.js

-   checkDissipation
-   flowDownward
-   verticalCheckAbove
-   flowSideways
-   getBlock

## Assets/world/dimension.js

-   gotoDimension
-   getDimension
-   getDimensionChunks

## Assets/world/particleEmitter.js

-   createParticleEmitter
-   removeParticleEmitter
-   createParticleEmitterAtPlayer

## Assets/world/saving.js

-   autoSave
-   saveWorld
-   saveChunk
-   loadWorldFromLocalStorage

## Assets/utils/texturePackLoader.js

-   getSpriteUrl
-   getSpriteAverageColor
-   getSpriteSize
-   isEqualToOriginal
-   waitForTexturePack
-   isBase64

## Assets/utils/renderer.js

-   drawBackground
-   interpolateColor
-   hexToRgb
-   mouseOverPosition
-   isColliding
-   drawParticleEmitters
-   draw
-   drawLoadScreen
-   drawEntities
-   drawBreakAndPlaceCursor
-   drawChunks
-   drawCoordinates
-   drawCamera
-   drawLate
-   afterDraw
-   drawUI
-   drawInventory
-   drawDestroyStage
-   drawChunkLine
-   drawCursor
-   drawFps
-   drawChunkStats
-   drawExpectedFileSize
-   drawHeight
-   drawDebugMouseBlock
-   drawHotbar
-   drawText
-   drawHitboxes
-   drawSimpleImage
-   drawImage
-   drawRect

## Assets/utils/classes.js

-   calculateDirection
-   arePropsEqual
-   hexToRgb
-   adjustColorBrightness
-   rgbToHex
-   randomRange
-   angleToVector
-   lerp
-   caculateDirection
-   isValidClassType
-   easeInOut
-   lerpEaseInOut
-   easeIn
-   easeOut
-   lerpEaseIn
-   lerpEaseOut
-   uuidv4

## Assets/utils/keyBindings.js

-   getKeyDisplayName
-   getActionLabel
-   loadKeyBindings
-   saveKeyBindings

## Assets/utils/object.js

-   checkCollision
-   checkCollisionUsingObjects

## Assets/utils/indexDB.js

-   getFromLdb
-   deleteFromLdb

## Assets/game/music.js

-   playRandomSong
-   startMusic

## Assets/game/sounds.js

-   preloadSounds
-   playRandomSoundFromArray
-   removeAudio
-   playSound
-   playPositionalSound
-   playMessySound
-   stopMessySound
-   updatePositionalAudioVolumes

## Assets/game/skinPreview.js

-   drawSkinPreview

## Assets/game/item.js

-   getItem
