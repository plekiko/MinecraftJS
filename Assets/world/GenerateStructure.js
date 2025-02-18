function GenerateStructure(structure, x, y) {
    const structureData = Structures[structure];
    if (!structureData) return;

    const structureWidth = structureData.blocks[0].length;
    const structureHeight = structureData.blocks.length;

    for (let i = 0; i < structureWidth; i++) {
        for (let j = 0; j < structureHeight; j++) {
            const blockType = structureData.blocks[j][i];

            const blockX =
                Math.floor((x + i * BLOCK_SIZE) / BLOCK_SIZE) * BLOCK_SIZE;
            const blockY = Math.floor(y + j * BLOCK_SIZE);

            const block = GetBlockAtWorldPosition(blockX, blockY, false);

            if (!block) {
                chat.message(
                    "Cannot place block here. " + blockX + " " + blockY
                );
                continue;
            }

            if (blockType instanceof LootTable) {
                GenerateChestWithLoot(blockType, blockX, blockY);
                continue;
            }

            // block.setBlockType(blockType);
            // SetBlockTypeAtPosition(blockX, blockY, blockType, false);
        }
    }
}
