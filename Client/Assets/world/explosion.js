/**
 * Creates an explosion at the given position.
 * @param {Vector2} position - World position (x, y) of the explosion center
 * @param {Object} options - Explosion parameters (default is TNT-size)
 * @param {number} [options.radius=4*BLOCK_SIZE] - Explosion radius
 * @param {number} [options.damage=15] - Max entity damage
 * @param {number} [options.power=20] - Block destruction power (propagation)
 * @param {Entity} [options.excludeEntity=null] - Entity to exclude from damage
 */
function createExplosion(
    position,
    {
        radius = 4 * BLOCK_SIZE,
        damage = 15,
        power = 20,
        excludeEntity = null,
        destroyTerrain = true,
    } = {},
) {
    playRandomSoundFromArray({
        array: Sounds.Explosion,
        positional: true,
        origin: position,
    });

    // Damage and knockback entities in range
    for (const entity of world.entities) {
        if (entity === excludeEntity || entity.invulnerable) continue;

        const distance = Vector2.Distance(position, entity.position);
        if (distance > radius) continue;

        const damageFactor = 1 - distance / radius;
        const appliedDamage = Math.max(0, Math.round(damage * damageFactor));
        if (typeof entity.hit === "function") entity.hit(appliedDamage);

        if (entity.type === EntityTypes.Drop) {
            removeEntity(entity);
            continue;
        }

        const knockbackFactor = (1 - distance / radius) / 5;
        const knockbackForce = Math.max(
            0,
            power * BLOCK_SIZE * knockbackFactor,
        );
        entity.knockBack(position.x, knockbackForce);
    }

    if (!destroyTerrain) return;

    // Destroy blocks in radius (flood-fill with power decay)
    const startX = Math.floor(position.x / BLOCK_SIZE);
    const startY = Math.floor(position.y / BLOCK_SIZE);
    const visited = new Set();
    const queue = [[startX, startY, power]];

    while (queue.length > 0) {
        const [x, y, remainingPower] = queue.shift();

        const worldX = x * BLOCK_SIZE;
        const worldY = y * BLOCK_SIZE;
        const distance = Math.sqrt(
            Math.pow(worldX - position.x, 2) + Math.pow(worldY - position.y, 2),
        );

        if (distance > radius || remainingPower <= 0) continue;

        const key = `${x},${y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const block = world.getBlockAtWorldPosition(worldX, worldY);
        if (!block) continue;

        const blockDef = getBlock(block.blockType);
        if (!blockDef) continue;

        const resistance = blockDef.hardness || 0;
        const powerThreshold = resistance + 1;

        if (remainingPower >= powerThreshold) {
            if (blockDef.hardness >= 0) {
                if (blockDef.specialType === SpecialType.TNT) {
                    block.explode(true);
                } else {
                    block.breakBlock(blockDef.dropWithoutTool);
                    setBlockType(block, Blocks.Air);
                }
            }

            const reducedPower = remainingPower - 1 - resistance * 0.3;
            if (reducedPower > 0) {
                queue.push([x, y - 1, reducedPower]);
                queue.push([x, y + 1, reducedPower]);
                queue.push([x - 1, y, reducedPower]);
                queue.push([x + 1, y, reducedPower]);
            }
        }
    }
}
