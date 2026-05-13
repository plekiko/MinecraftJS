class WorldGenerator {
    constructor(world) {
        this.world = world;
        this.specialWorldProps = {};
        this.multiplayerSeedLoaded = !multiplayer;
        this.forceToBiome = null;
        this.loadingWorld = true;

        tooloud.Perlin.setSeed(this.world.seed);
    }

    printNoiseOutput(noise, count = 100) {
        let minValue = Infinity;
        let maxValue = -Infinity;

        for (let i = 0; i < count; i++) {
            const noiseValue = noise.getNoise(i, 0);
            console.log(`Mapped noise value: ${i} - ${noiseValue}`);

            if (noiseValue < minValue) minValue = noiseValue;
            if (noiseValue > maxValue) maxValue = noiseValue;
        }

        console.log("Minimum Noise Value:", minValue);
        console.log("Maximum Noise Value:", maxValue);
    }

    locateBiome(biome) {
        // Start search from player/camera center so we find the closest matching biome.
        const center =
            typeof camera !== "undefined" &&
            camera &&
            camera.getCurrentChunkIndex
                ? camera.getCurrentChunkIndex()
                : world && world.player
                  ? Math.floor(world.player.x / (CHUNK_WIDTH * BLOCK_SIZE))
                  : 0;

        const maxRadius = 10000;
        for (let r = 0; r < maxRadius; r++) {
            const indices = r === 0 ? [center] : [center + r, center - r];
            for (const idx of indices) {
                const currentBiome = this.calculateChunkBiome(idx);
                if (currentBiome === biome) return idx;
            }
        }

        return false;
    }

    loadCustomSeed(seedInput) {
        this.specialWorldProps = {};
        this.forceToBiome = null;

        seedInput = seedInput.toString().toLowerCase();

        this.world.seed = seedInput;
        tooloud.Perlin.setSeed(this.world.seed);

        switch (seedInput) {
            case "flat":
                this.specialWorldProps.flat = true;
                break;

            case "void":
                this.specialWorldProps.void = true;
                break;

            case "skyblock":
                this.specialWorldProps.void = true;
                this.specialWorldProps.skyblock = true;
                break;

            case "redstone":
                this.specialWorldProps.flat = true;
                this.specialWorldProps.noMobs = true;
                this.specialWorldProps.redstone = true;
                this.specialWorldProps.noStructures = true;
                break;

            case "desert":
                this.forceToBiome = OverworldBiomes.Desert;
                break;
            case "mountain":
                this.forceToBiome = OverworldBiomes.Mountain;
                break;
            case "forest":
                this.forceToBiome = OverworldBiomes.Forest;
                break;
            case "plains":
                this.forceToBiome = OverworldBiomes.Plains;
                break;
            case "swamp":
                this.forceToBiome = OverworldBiomes.Swamp;
                break;
            case "jungle":
            case "rainforest":
                this.forceToBiome = OverworldBiomes.RainForest;
                break;
            case "savanna":
                this.forceToBiome = OverworldBiomes.Savanna;
                break;
            case "taiga":
                this.forceToBiome = OverworldBiomes.Taiga;
                break;
            case "tundra":
                this.forceToBiome = OverworldBiomes.Tundra;
                break;
            case "seasonalforest":
            case "seasonal":
            case "seasonal forest":
                this.forceToBiome = OverworldBiomes.SeasonalForest;
                break;
            case "cherry":
            case "cherry blossom":
                this.forceToBiome = OverworldBiomes.CherryBlossom;
                break;
        }
    }

    biomesInChunkCount(count) {
        let biomeCount = {};
        const displayNames = {};

        for (let i = 0; i < count; i++) {
            const biome = this.calculateChunkBiome(i);

            // Find canonical key in AllBiomes (e.g. SeasonalForest) that maps to this biome object.
            const key =
                Object.keys(AllBiomes).find((k) => AllBiomes[k] === biome) ||
                // fallback: remove spaces from display name to match key format
                biome.name.replace(/\s+/g, "");

            displayNames[key] = biome.name;
            biomeCount[key] = (biomeCount[key] || 0) + 1;
        }

        // Print found biomes using their display names
        for (const key of Object.keys(biomeCount)) {
            const name = displayNames[key] || key;
            console.log(
                `${name}: ${((biomeCount[key] / count) * 100).toFixed(2)}%`,
            );
        }

        // All biomes not in the count — print using the Biome.display name
        for (const key in AllBiomes) {
            if (!biomeCount[key]) {
                console.log(`${AllBiomes[key].name}: 0%`);
            }
        }
    }

    logClimateSamples(count = 200, dimensionIndex = activeDimension) {
        const dimension = dimensions[dimensionIndex];
        const { temperature, wetness, mountains } = dimension.noiseMaps;

        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const toUnit = (value, noise) => {
            const min = noise.min - noise.intensity * 0.5;
            const max = noise.min + noise.intensity * 0.5;
            if (max === min) return 0.5;
            return clamp((value - min) / (max - min), 0, 1);
        };

        const stats = {
            temp: { min: Infinity, max: -Infinity, sum: 0 },
            wet: { min: Infinity, max: -Infinity, sum: 0 },
            mount: { min: Infinity, max: -Infinity, sum: 0 },
            tempUnit: { min: Infinity, max: -Infinity, sum: 0 },
            wetUnit: { min: Infinity, max: -Infinity, sum: 0 },
            mountUnit: { min: Infinity, max: -Infinity, sum: 0 },
        };

        for (let i = 0; i < count; i++) {
            const temp = temperature.getNoise(i, 20000);
            const wet = wetness.getNoise(i, 10000);
            const mount = mountains.getNoise(i, 30000);
            const tempUnit = toUnit(temp, temperature);
            const wetUnit = toUnit(wet, wetness);
            const mountUnit = toUnit(mount, mountains);

            stats.temp.min = Math.min(stats.temp.min, temp);
            stats.temp.max = Math.max(stats.temp.max, temp);
            stats.temp.sum += temp;

            stats.wet.min = Math.min(stats.wet.min, wet);
            stats.wet.max = Math.max(stats.wet.max, wet);
            stats.wet.sum += wet;

            stats.mount.min = Math.min(stats.mount.min, mount);
            stats.mount.max = Math.max(stats.mount.max, mount);
            stats.mount.sum += mount;

            stats.tempUnit.min = Math.min(stats.tempUnit.min, tempUnit);
            stats.tempUnit.max = Math.max(stats.tempUnit.max, tempUnit);
            stats.tempUnit.sum += tempUnit;

            stats.wetUnit.min = Math.min(stats.wetUnit.min, wetUnit);
            stats.wetUnit.max = Math.max(stats.wetUnit.max, wetUnit);
            stats.wetUnit.sum += wetUnit;

            stats.mountUnit.min = Math.min(stats.mountUnit.min, mountUnit);
            stats.mountUnit.max = Math.max(stats.mountUnit.max, mountUnit);
            stats.mountUnit.sum += mountUnit;
        }

        const avg = (value) => value / count;

        console.log("Climate sample stats:");
        console.log(
            `Temp raw min/max/avg: ${stats.temp.min.toFixed(2)} / ${stats.temp.max.toFixed(2)} / ${avg(stats.temp.sum).toFixed(2)}`,
        );
        console.log(
            `Wet raw min/max/avg: ${stats.wet.min.toFixed(2)} / ${stats.wet.max.toFixed(2)} / ${avg(stats.wet.sum).toFixed(2)}`,
        );
        console.log(
            `Mount raw min/max/avg: ${stats.mount.min.toFixed(2)} / ${stats.mount.max.toFixed(2)} / ${avg(stats.mount.sum).toFixed(2)}`,
        );
        console.log(
            `Temp unit min/max/avg: ${stats.tempUnit.min.toFixed(2)} / ${stats.tempUnit.max.toFixed(2)} / ${avg(stats.tempUnit.sum).toFixed(2)}`,
        );
        console.log(
            `Wet unit min/max/avg: ${stats.wetUnit.min.toFixed(2)} / ${stats.wetUnit.max.toFixed(2)} / ${avg(stats.wetUnit.sum).toFixed(2)}`,
        );
        console.log(
            `Mount unit min/max/avg: ${stats.mountUnit.min.toFixed(2)} / ${stats.mountUnit.max.toFixed(2)} / ${avg(stats.mountUnit.sum).toFixed(2)}`,
        );
    }

    regenerateWorld() {
        const newSeed = Math.floor(Math.random() * 10000);
        tooloud.Perlin.setSeed(newSeed);

        this.world.entities = [];
        this.world.entities.push(this.world.player);

        setTimeout(() => {
            this.world.player.setOnGround();
        }, 1);
    }

    async getChunkFromServer(x, dimensionIndex = activeDimension) {
        try {
            const chunkData = await server.get({
                type: "getChunk",
                message: { x: x, dimensionIndex: dimensionIndex },
            });

            return chunkData.chunk;
        } catch (error) {
            return null;
        }
    }

    async generateWorld(dimensionIndex = activeDimension) {
        if (this.loadingWorld) return;

        const dimension = dimensions[dimensionIndex];
        const currentChunkIndex = camera.getCurrentChunkIndex();

        for (
            let i = currentChunkIndex - RENDER_DISTANCE;
            i <= currentChunkIndex + RENDER_DISTANCE;
            i++
        ) {
            const chunkX = i * CHUNK_WIDTH * BLOCK_SIZE;

            let willUploadChunk = false;

            if (multiplayer) {
                if (!dimension.chunks.has(chunkX)) {
                    const chunkFromServer = await this.world.getChunkFromServer(
                        chunkX,
                        dimensionIndex,
                    );
                    if (chunkFromServer) {
                        loadChunk(chunkX, chunkFromServer, dimensionIndex);
                    } else {
                        willUploadChunk = true;
                        const oldChunkData = this.getNeighborBiomeData(
                            i,
                            currentChunkIndex,
                            dimensionIndex,
                        );
                        this.generateChunk(
                            i,
                            chunkX,
                            oldChunkData,
                            dimensionIndex,
                        );
                    }
                }
            } else if (!dimension.chunks.has(chunkX)) {
                const oldChunkData = this.getNeighborBiomeData(
                    i,
                    currentChunkIndex,
                    dimensionIndex,
                );
                this.generateChunk(i, chunkX, oldChunkData, dimensionIndex);
            } else {
                const chunk = dimension.chunks.get(chunkX);
                if (chunk.spawnTime && chunk.spawnTime <= passedTime) {
                    chunk.spawnMobs(day);
                    chunk.spawnTime = 0;
                }
            }

            if (!this.specialWorldProps.noStructures) {
                this.generateStructures(dimensionIndex);
            }

            this.postProcessChunk(
                this.world.getChunkForX(chunkX, dimensionIndex),
            );

            if (willUploadChunk) {
                this.world.uploadChunkToServer(chunkX, dimensionIndex);
            }
        }
    }

    generateStructure(structure, x, y) {
        const structureData = Structures[structure];
        if (!structureData) return;

        const originBlockX = Math.floor(x / BLOCK_SIZE) + structureData.shift.x;
        const originBlockY = Math.floor(y / BLOCK_SIZE) + structureData.shift.y;

        let structureWidth = structureData.blocks[0].length;
        let structureHeight = structureData.blocks.length;

        if (structureData.walls) {
            if (structureData.walls[0].length > structureWidth) {
                structureWidth = structureData.walls[0].length;
            }
            if (structureData.walls.length > structureHeight) {
                structureHeight = structureData.walls.length;
            }
        }

        const flip = Math.random() < 0.5;

        let chunk = null;

        for (let i = 0; i < structureWidth; i++) {
            const colIndex = flip ? structureWidth - 1 - i : i;
            for (let j = 0; j < structureHeight; j++) {
                const rowIndex = structureHeight - 1 - j;
                const blockRow = structureData.blocks[rowIndex] || [];
                const wallRow = structureData.walls?.[rowIndex] || [];

                const blockType = blockRow[colIndex] ?? Blocks.Air;
                const wallType = wallRow[colIndex] ?? Blocks.Air;

                const blockX = (originBlockX + i) * BLOCK_SIZE;
                const blockUserY = originBlockY + j;
                const blockY = this.world.userBlockYToWorld(blockUserY);

                if (!chunk) chunk = this.world.getChunkForX(blockX);

                if (blockType instanceof LootTable) {
                    this.generateChestWithLoot(
                        blockType,
                        blockX,
                        blockY,
                        chunk,
                    );
                } else if (blockType !== Blocks.Air) {
                    chunk.setBlockTypeAtPosition(blockX, blockY, blockType);
                }

                if (wallType instanceof LootTable) {
                    this.generateChestWithLoot(wallType, blockX, blockY, chunk);
                } else if (wallType !== Blocks.Air) {
                    chunk.setBlockTypeAtPosition(
                        blockX,
                        blockY,
                        wallType,
                        null,
                        true,
                    );
                }
            }
        }
    }

    generateChestWithLoot(lootTable, x, y, chunk) {
        const loot = lootTable.getRandomLoot();

        let storage = [[]];

        for (let y = 0; y < 3; y++) {
            storage[y] = [];
            for (let x = 0; x < 9; x++) {
                storage[y][x] = new InventoryItem();
            }
        }

        const newStorage = this.populateStorageWithLoot(loot, storage);

        chunk.setBlockTypeAtPosition(
            x,
            y,
            Blocks.Chest,
            new Metadata({ props: { storage: newStorage } }),
        );
    }

    populateStorageWithLoot(loot, storage) {
        for (const item of loot) {
            let placed = false;
            let attempts = 10;
            while (!placed && attempts > 0) {
                const randomSlotX = randomRange(0, storage[0].length);
                const randomSlotY = randomRange(0, storage.length);
                if (storage[randomSlotY][randomSlotX].count === 0) {
                    storage[randomSlotY][randomSlotX] = item;
                    placed = true;
                }
                attempts--;
            }
            if (!placed) {
                for (let y = 0; y < storage.length && !placed; y++) {
                    for (let x = 0; x < storage[y].length && !placed; x++) {
                        if (storage[y][x].count === 0) {
                            storage[y][x] = item;
                            placed = true;
                        }
                    }
                }
            }
        }
        return storage;
    }

    calculateChunkBiome(chunkIndex, dimensionIndex = activeDimension) {
        const dimension = dimensions[dimensionIndex];
        const { temperature, wetness, mountains } = dimension.noiseMaps;
        const temp = temperature.getNoise(chunkIndex, 20000);
        const wet = wetness.getNoise(chunkIndex, 10000);
        const mount = mountains.getNoise(chunkIndex, 30000);

        let biome = this.getBiomeForNoise(
            temp,
            wet,
            mount,
            dimension.biomeSet,
            dimension.noiseMaps,
        );

        if (this.specialWorldProps.flat)
            biome = dimension.biomeSet.Plains || biome;
        if (this.forceToBiome != null) biome = this.forceToBiome;
        if (!biome) {
            biome =
                dimension.biomeSet.Plains ||
                Object.values(dimension.biomeSet)[0];
        }

        return biome;
    }

    getNeighborBiomeData(
        currentIndex,
        cameraIndex,
        dimensionIndex = activeDimension,
    ) {
        const neighborIndex =
            currentIndex < cameraIndex ? currentIndex + 1 : currentIndex - 1;
        const neighborChunkX = neighborIndex * CHUNK_WIDTH * BLOCK_SIZE;
        const neighborBiome = this.calculateChunkBiome(
            neighborIndex,
            dimensionIndex,
        );

        return { x: neighborChunkX, biome: neighborBiome };
    }

    generateChunk(
        chunkIndex,
        chunkX,
        oldChunkData,
        dimensionIndex = activeDimension,
    ) {
        const dimension = dimensions[dimensionIndex];
        const biome = this.calculateChunkBiome(chunkIndex, dimensionIndex);

        const newChunk = new Chunk(
            world,
            chunkX,
            CHUNK_WIDTH,
            biome,
            oldChunkData,
        );
        newChunk.dimension = dimensionIndex;
        dimension.chunks.set(chunkX, newChunk);
    }

    getChunk(worldX, dimension = activeDimension) {
        return this.world.getDimensionChunks(dimension).has(worldX)
            ? this.world.getDimensionChunks(dimension).get(worldX)
            : null;
    }

    postProcessChunk(chunk) {
        if (!chunk) return;

        if (this.specialWorldProps.void) {
            chunk.applyBufferedBlocks();
            return;
        }

        if (!chunk.generated) {
            chunk.generateOres();

            if (!this.specialWorldProps.flat) {
                chunk.generateCaves();
            }

            chunk.applyBufferedBlocks();
            chunk.generateWater();

            if (!this.specialWorldProps.noMobs) chunk.spawnMobs(day);

            if (!this.specialWorldProps.flat) {
                chunk.generateTrees();
                chunk.generateGrass();
            }

            chunk.generateBedrock();

            chunk.generated = true;
        }
    }

    generateStructures(dimensionIndex = activeDimension) {
        const dimension = dimensions[dimensionIndex];
        dimension.chunks.forEach((chunk, chunkX) => {
            if (chunk.generated) {
                return;
            }

            const chunkIndex = chunkX / (CHUNK_WIDTH * BLOCK_SIZE);
            const structureNoiseValue = dimension.noiseMaps.structure.getNoise(
                chunkIndex,
                0,
            );

            if (structureNoiseValue > 10) {
                const allStructureNames = Object.keys(Structures);
                const candidates = allStructureNames.filter((name) => {
                    const structure = Structures[name];
                    return (
                        structure.biome === null ||
                        structure.biome === chunk.biome
                    );
                });

                const underground = Math.random() < 0.5;
                const filteredCandidates = candidates.filter((name) => {
                    const structure = Structures[name];
                    const correctDimension =
                        dimensionIndex === structure.dimension;
                    return (
                        structure.underground === underground &&
                        correctDimension
                    );
                });

                if (filteredCandidates.length === 0) return;

                const randomName =
                    filteredCandidates[
                        randomRange(0, filteredCandidates.length)
                    ];
                const structure = Structures[randomName];

                const structureX =
                    chunk.x + randomRange(0, CHUNK_WIDTH) * BLOCK_SIZE;

                let structureY;
                const localX = chunk.getLocalX(structureX);
                const surfaceAirY = chunk.findGroundLevel(localX, false, true);
                const surfaceGroundY = surfaceAirY - 1;

                if (structure.underground) {
                    const structureHeight = structure.blocks.length;
                    const shiftY = structure.shift?.y ?? 1;
                    const undergroundOffset = randomRange(
                        8,
                        CHUNK_HEIGHT / 2.5,
                    );
                    const maxOriginY =
                        surfaceGroundY - 2 - (structureHeight - 1);
                    let originBlockY =
                        surfaceGroundY - undergroundOffset + shiftY;
                    originBlockY = Math.min(originBlockY, maxOriginY);
                    const baseBlockY = Math.max(1, originBlockY - shiftY);
                    structureY = baseBlockY * BLOCK_SIZE;
                } else {
                    structureY = surfaceAirY * BLOCK_SIZE;
                }

                this.generateStructure(randomName, structureX, structureY);
            }
        });
    }

    fill(
        startX,
        startY,
        endX,
        endY,
        blockType,
        dimensionIndex = activeDimension,
    ) {
        const originalStartX = startX;
        const originalStartY = startY;

        if (startX > endX) {
            startX = endX;
            endX = originalStartX;
        }

        if (startY > endY) {
            startY = endY;
            endY = originalStartY;
        }

        for (let x = startX; x <= endX; x += BLOCK_SIZE) {
            for (let y = startY; y <= endY; y += BLOCK_SIZE) {
                this.world.setBlockTypeAtPosition(
                    x,
                    y,
                    blockType,
                    false,
                    dimensionIndex,
                    null,
                );
            }
        }
    }

    getBiomeForNoise(temp, wetness, mountains, biomeSet, noiseMaps) {
        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const toUnit = (value, noise) => {
            const min = noise.min - noise.intensity * 0.5;
            const max = noise.min + noise.intensity * 0.5;
            if (max === min) return 0.5;
            return clamp((value - min) / (max - min), 0, 1);
        };
        const rangeToUnit = (value, noise, fallback) => {
            if (!Number.isFinite(value)) return fallback;
            return toUnit(value, noise);
        };
        const resolveRange = (minVal, maxVal, noise) => {
            const finiteMin = Number.isFinite(minVal);
            const finiteMax = Number.isFinite(maxVal);
            const useNormalized =
                finiteMin &&
                finiteMax &&
                minVal >= 0 &&
                maxVal <= 1 &&
                minVal <= maxVal;

            if (useNormalized) {
                return { min: minVal, max: maxVal };
            }

            return {
                min: rangeToUnit(minVal, noise, 0),
                max: rangeToUnit(maxVal, noise, 1),
            };
        };
        const rangeScore = (value, min, max) => {
            const center = (min + max) / 2;
            const halfRange = Math.max(0.001, (max - min) / 2);
            return Math.abs(value - center) / halfRange;
        };
        const rangeDistance = (value, min, max) => {
            if (value < min) return min - value;
            if (value > max) return value - max;
            return 0;
        };

        const t = toUnit(temp, noiseMaps.temperature);
        const w = toUnit(wetness, noiseMaps.wetness);
        const m = toUnit(mountains, noiseMaps.mountains);

        let best = null;
        let bestScore = Infinity;

        for (const biomeName in biomeSet) {
            const b = biomeSet[biomeName];

            const tempRange = resolveRange(
                b.minTemp,
                b.maxTemp,
                noiseMaps.temperature,
            );
            const wetRange = resolveRange(
                b.minWet,
                b.maxWet,
                noiseMaps.wetness,
            );
            const mountRange = resolveRange(
                b.minMount,
                b.maxMount,
                noiseMaps.mountains,
            );

            const tempScore = rangeScore(t, tempRange.min, tempRange.max);
            const wetScore = rangeScore(w, wetRange.min, wetRange.max);
            const mountScore = rangeScore(m, mountRange.min, mountRange.max);

            const tempOut = rangeDistance(t, tempRange.min, tempRange.max);
            const wetOut = rangeDistance(w, wetRange.min, wetRange.max);
            const mountOut = rangeDistance(m, mountRange.min, mountRange.max);
            const outPenalty = tempOut + wetOut + mountOut;

            const score =
                tempScore +
                wetScore +
                mountScore * 1.2 +
                (outPenalty > 0 ? 5 + outPenalty * 10 : 0);

            if (score < bestScore) {
                bestScore = score;
                best = b;
            }
        }

        return best || biomeSet.Plains || Object.values(biomeSet)[0];
    }
}
