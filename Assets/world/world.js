let entities = [];

let player;

function removeEntity(entity) {
    if (entity.myChunkX !== null) {
        chunks.get(entity.myChunkX).removeEntityFromChunk(entity);
    }

    const index = entities.indexOf(entity);

    entities.splice(index, 1);
}
