const DIRECTIONS = ['north', 'east', 'south', 'west'];

const DIRECTION_DELTAS = {
    north: {x: 0, y: 1},
    east: {x: 1, y: 0},
    south: {x: 0, y: -1},
    west: {x: -1, y: 0},
};

const DEFAULT_OPTIONS = {
    chunkSize: 8,
    worldSeed: 0x4b1d1984,
    targetRoomDensityPercent: 50,
    rectangularCandidatePercent: 84,
    styleRegionChunks: 2,
    branchCorridorAttempts: 64,
    branchCorridorMaxLength: 5,
    questSectorQuestPercent: 100,
    questReachabilityMarginChunks: 2,
};

const BIOMES = [
    {
        id: 'stone-halls',
        title: 'Stone halls',
        weight: 28,
        theme: 'stone',
        colours: [3, 4, 5, 6],
        blockTypes: [0x03],
        blockCount: {min: 1, max: 3},
    },
    {
        id: 'wooden-wing',
        title: 'Wooden wing',
        weight: 24,
        theme: 'tree',
        colours: [4, 5, 6],
        blockTypes: [0x00],
        blockCount: {min: 2, max: 4},
    },
    {
        id: 'rock-vaults',
        title: 'Rock vaults',
        weight: 18,
        theme: 'stone',
        colours: [2, 3, 7],
        blockTypes: [0x03],
        blockCount: {min: 3, max: 5},
    },
    {
        id: 'quiet-gallery',
        title: 'Quiet gallery',
        weight: 16,
        theme: 'stone',
        colours: [1, 2, 6],
        blockTypes: [0x03],
        blockCount: {min: 0, max: 2},
    },
    {
        id: 'spike-yard',
        title: 'Spike yard',
        weight: 14,
        theme: 'stone',
        colours: [2, 5, 6],
        blockTypes: [0x05],
        blockCount: {min: 1, max: 2},
    },
];

const DEFAULT_BIOME = BIOMES[0];
const TOTAL_BIOME_WEIGHT = BIOMES.reduce((total, biome) => total + biome.weight, 0);
const QUEST_CHARM_TYPES = Array.from({length: 14}, (_, index) => ({
    id: index,
    label: `charm ${String(index + 1).padStart(2, '0')}`,
}));

const floorDiv = (value, divisor) => Math.floor(value / divisor);

const floorMod = (value, divisor) => {
    const result = value % divisor;
    return result < 0 ? result + divisor : result;
};

const coordKey = (x, y) => `${x},${y}`;

const mixHash = (hash, value) => {
    let mixed = Math.imul(hash ^ (value | 0), 0x01000193);
    mixed ^= mixed >>> 16;
    mixed = Math.imul(mixed, 0x7feb352d);
    mixed ^= mixed >>> 15;
    return mixed >>> 0;
};

const hashInts = (...values) => {
    let hash = 0x811c9dc5;
    for (const value of values) hash = mixHash(hash, value);
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x846ca68b);
    hash ^= hash >>> 16;
    return hash >>> 0;
};

const makeEmptyCells = size => (
    Array.from({length: size}, () => Array.from({length: size}, () => false))
);

const cloneExits = exits => ({
    north: exits.north || false,
    east: exits.east || false,
    south: exits.south || false,
    west: exits.west || false,
});

const exitMask = exits => (
    DIRECTIONS
        .filter(direction => exits && exits[direction])
        .map(direction => direction[0].toUpperCase())
        .join('')
);

const clampPercent = value => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
};

const positiveIntegerOr = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 1 ? Math.floor(number) : fallback;
};

const chooseRoomSizeSelector = (exits, x, y, config) => {
    const mask = exitMask(exits);
    const selector = (() => {
        if (mask === 'N' || mask === 'S' || mask === 'NS') return 1;
        if (mask === 'E' || mask === 'W' || mask === 'EW') return 2;
        return 0;
    })();
    if (selector === 0) return 0;

    const threshold = Math.round(clampPercent(config.rectangularCandidatePercent) * 100);
    const roll = hashInts(config.worldSeed, x, y, 0x51ec7) % 10000;
    if (roll >= threshold) return 0;

    return selector;
};

const OPPOSITE_DIRECTIONS = {
    north: 'south',
    east: 'west',
    south: 'north',
    west: 'east',
};

const isCentralFloorCell = (x, y) => (
    x >= 3 && x <= 4 && y >= 3 && y <= 4
);

const chooseArrayValue = (values, hash) => values[hash % values.length];

const chooseBlockCount = (biome, hash) => {
    const min = biome.blockCount.min;
    const max = biome.blockCount.max;
    if (max <= min) return min;
    return min + (hash % (max - min + 1));
};

const cloneData = value => JSON.parse(JSON.stringify(value));

const manhattanDistance = (a, b) => (
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
);

export function createKnightLoreProceduralMap(options = {}) {
    const config = {
        ...DEFAULT_OPTIONS,
        ...options,
    };
    const chunkSize = config.chunkSize;
    const interiorSpan = Math.max(1, chunkSize - 2);
    const styleRegionChunks = positiveIntegerOr(config.styleRegionChunks, DEFAULT_OPTIONS.styleRegionChunks);
    const questReachabilityMarginChunks = positiveIntegerOr(
        config.questReachabilityMarginChunks,
        DEFAULT_OPTIONS.questReachabilityMarginChunks
    );
    const chunks = new Map();
    const biomes = new Map();
    const questReachability = new Map();

    const chunkKey = (chunkX, chunkY) => `${chunkX},${chunkY}`;

    const toChunkCoord = (x, y) => ({
        chunkX: floorDiv(x, chunkSize),
        chunkY: floorDiv(y, chunkSize),
        localX: floorMod(x, chunkSize),
        localY: floorMod(y, chunkSize),
    });

    const connectorIndex = (a, b, salt) => (
        1 + (hashInts(config.worldSeed, a, b, salt) % interiorSpan)
    );

    const chooseBiome = (chunkX, chunkY) => {
        const regionX = floorDiv(chunkX, styleRegionChunks);
        const regionY = floorDiv(chunkY, styleRegionChunks);
        const key = `${regionX},${regionY}`;
        if (biomes.has(key)) return biomes.get(key);

        let roll = hashInts(config.worldSeed, regionX, regionY, 0xb10e) % TOTAL_BIOME_WEIGHT;
        const biome = BIOMES.find(candidate => {
            if (roll < candidate.weight) return true;
            roll -= candidate.weight;
            return false;
        }) || DEFAULT_BIOME;
        const result = {
            ...biome,
            region: {x: regionX, y: regionY},
        };
        biomes.set(key, result);
        return result;
    };

    const verticalEdgeConnectorY = (edgeX, chunkY) => (
        connectorIndex(edgeX, chunkY, 0x7654)
    );

    const horizontalEdgeConnectorX = (chunkX, edgeY) => (
        connectorIndex(chunkX, edgeY, 0x3456)
    );

    const mark = (cells, x, y) => {
        if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) return;
        cells[y][x] = true;
    };

    const isInsideChunk = (x, y) => (
        x >= 0 && x < chunkSize && y >= 0 && y < chunkSize
    );

    const carveLine = (cells, from, to) => {
        const dx = Math.sign(to.x - from.x);
        const dy = Math.sign(to.y - from.y);
        let x = from.x;
        let y = from.y;
        mark(cells, x, y);
        while (x !== to.x) {
            x += dx;
            mark(cells, x, y);
        }
        while (y !== to.y) {
            y += dy;
            mark(cells, x, y);
        }
    };

    const carvePath = (cells, chunkX, chunkY, from, to, salt) => {
        const horizontalFirst = (hashInts(
            config.worldSeed,
            chunkX,
            chunkY,
            from.x,
            from.y,
            to.x,
            to.y,
            salt
        ) & 1) === 0;
        const corner = horizontalFirst
            ? {x: to.x, y: from.y}
            : {x: from.x, y: to.y};
        carveLine(cells, from, corner);
        carveLine(cells, corner, to);
    };

    const countCells = cells => (
        cells.reduce((total, row) => (
            total + row.reduce((rowTotal, value) => rowTotal + (value ? 1 : 0), 0)
        ), 0)
    );

    const collectExistingCells = cells => {
        const result = [];
        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (cells[y][x]) result.push({x, y});
            }
        }
        return result;
    };

    const chooseQuestAnchorCell = (cells, chunkX, chunkY, reference, salt, preferFar) => {
        const existing = collectExistingCells(cells);
        if (!existing.length) return {x: reference.x, y: reference.y};

        const ranked = existing
            .map(cell => ({
                ...cell,
                distance: manhattanDistance(cell, reference),
                tie: hashInts(config.worldSeed, chunkX, chunkY, cell.x, cell.y, salt),
            }))
            .sort((a, b) => {
                const distanceCompare = preferFar
                    ? b.distance - a.distance
                    : a.distance - b.distance;
                return distanceCompare || a.tie - b.tie;
            });
        const poolSize = Math.max(1, Math.ceil(ranked.length / 3));
        const pool = ranked.slice(0, poolSize);
        const hash = hashInts(config.worldSeed, chunkX, chunkY, salt, pool.length);
        const chosen = pool[hash % pool.length];
        return {x: chosen.x, y: chosen.y};
    };

    const toGlobalQuestAnchor = (chunkX, chunkY, local) => ({
        x: chunkX * chunkSize + local.x,
        y: chunkY * chunkSize + local.y,
        localX: local.x,
        localY: local.y,
    });

    const createQuestSector = (chunkX, chunkY, cells, hub, biome) => {
        const questThreshold = Math.round(clampPercent(config.questSectorQuestPercent) * 100);
        const questRoll = hashInts(config.worldSeed, chunkX, chunkY, 0x9e57) % 10000;
        const hasQuest = questRoll < questThreshold;
        const sector = {
            key: coordKey(chunkX, chunkY),
            sectorX: chunkX,
            sectorY: chunkY,
            sectorSize: chunkSize,
            origin: {
                x: chunkX * chunkSize,
                y: chunkY * chunkSize,
            },
            style: {
                biome: biome.id,
                title: biome.title,
                region: biome.region,
            },
            quest: {
                exists: hasQuest,
            },
        };

        if (!hasQuest) return sector;

        const requiredCharm = chooseArrayValue(
            QUEST_CHARM_TYPES,
            hashInts(config.worldSeed, chunkX, chunkY, 0xc4a1)
        );
        const cauldronLocal = chooseQuestAnchorCell(cells, chunkX, chunkY, hub, 0xca11, false);
        const charmReference = cauldronLocal;
        let charmLocal = chooseQuestAnchorCell(cells, chunkX, chunkY, charmReference, 0xc4a2, true);

        if (charmLocal.x === cauldronLocal.x && charmLocal.y === cauldronLocal.y) {
            const alternatives = collectExistingCells(cells).filter(cell => (
                cell.x !== cauldronLocal.x || cell.y !== cauldronLocal.y
            ));
            if (alternatives.length) {
                const hash = hashInts(config.worldSeed, chunkX, chunkY, 0xc4a3);
                charmLocal = alternatives[hash % alternatives.length];
            }
        }

        mark(cells, cauldronLocal.x, cauldronLocal.y);
        mark(cells, charmLocal.x, charmLocal.y);

        sector.quest = {
            exists: true,
            requiredCharm: cloneData(requiredCharm),
            cauldron: toGlobalQuestAnchor(chunkX, chunkY, cauldronLocal),
            charm: toGlobalQuestAnchor(chunkX, chunkY, charmLocal),
            difficulty: 1 + (hashInts(config.worldSeed, chunkX, chunkY, 0xd1ff) % 4),
            placement: 'existing-connected-cells',
        };

        return sector;
    };

    const getQuestRoleForRoom = (questSector, x, y) => {
        const quest = questSector && questSector.quest;
        if (!quest || !quest.exists) return 'none';
        if (quest.cauldron.x === x && quest.cauldron.y === y) return 'cauldron';
        if (quest.charm.x === x && quest.charm.y === y) return 'charm';
        return 'none';
    };

    const getRoomQuestInfo = (questSector, x, y) => {
        const local = toChunkCoord(x, y);
        const role = getQuestRoleForRoom(questSector, x, y);
        return {
            sector: {
                key: questSector.key,
                x: questSector.sectorX,
                y: questSector.sectorY,
                size: questSector.sectorSize,
                origin: cloneData(questSector.origin),
                local: {x: local.localX, y: local.localY},
                style: cloneData(questSector.style),
            },
            role,
            quest: cloneData(questSector.quest),
        };
    };

    const makeReachabilityBounds = (from, to, marginRooms) => ({
        minX: Math.min(from.x, to.x) - marginRooms,
        maxX: Math.max(from.x, to.x) + marginRooms,
        minY: Math.min(from.y, to.y) - marginRooms,
        maxY: Math.max(from.y, to.y) + marginRooms,
    });

    const coordInBounds = (coord, bounds) => (
        coord.x >= bounds.minX &&
        coord.x <= bounds.maxX &&
        coord.y >= bounds.minY &&
        coord.y <= bounds.maxY
    );

    const rebuildPath = (parents, endKey) => {
        const path = [];
        let key = endKey;
        while (key) {
            const [x, y] = key.split(',').map(Number);
            path.push({x, y});
            key = parents.get(key);
        }
        path.reverse();
        return path;
    };

    const findReachablePath = (from, to, marginRooms) => {
        const bounds = makeReachabilityBounds(from, to, marginRooms);
        const start = {x: from.x, y: from.y};
        const goal = {x: to.x, y: to.y};
        const startKey = coordKey(start.x, start.y);
        const goalKey = coordKey(goal.x, goal.y);

        if (!coordInBounds(start, bounds) || !coordInBounds(goal, bounds)) {
            return {
                reachable: false,
                path: [],
                pathLength: null,
                visitedRooms: 0,
                searchedRooms: 0,
                bounds,
                reason: 'anchor outside search bounds',
            };
        }

        if (!roomExists(start.x, start.y) || !roomExists(goal.x, goal.y)) {
            return {
                reachable: false,
                path: [],
                pathLength: null,
                visitedRooms: 0,
                searchedRooms: 0,
                bounds,
                reason: 'missing anchor room',
            };
        }

        const queue = [start];
        const visited = new Set([startKey]);
        const parents = new Map([[startKey, null]]);
        let searchedRooms = 0;

        for (let index = 0; index < queue.length; index++) {
            const current = queue[index];
            searchedRooms++;
            const currentKey = coordKey(current.x, current.y);
            if (currentKey === goalKey) {
                const path = rebuildPath(parents, goalKey);
                return {
                    reachable: true,
                    path,
                    pathLength: path.length - 1,
                    visitedRooms: visited.size,
                    searchedRooms,
                    bounds,
                    reason: 'same bounded traversable component',
                };
            }

            for (const direction of DIRECTIONS) {
                const delta = DIRECTION_DELTAS[direction];
                const next = {
                    x: current.x + delta.x,
                    y: current.y + delta.y,
                };
                const nextKey = coordKey(next.x, next.y);
                if (visited.has(nextKey) || !coordInBounds(next, bounds)) continue;
                if (!roomExists(next.x, next.y)) continue;
                visited.add(nextKey);
                parents.set(nextKey, currentKey);
                queue.push(next);
            }
        }

        return {
            reachable: false,
            path: [],
            pathLength: null,
            visitedRooms: visited.size,
            searchedRooms,
            bounds,
            reason: 'no path inside bounded traversable graph',
        };
    };

    const getQuestReachabilityForSector = (questSector, options = {}) => {
        const marginChunks = positiveIntegerOr(options.marginChunks, questReachabilityMarginChunks);
        const cacheKey = `${questSector.key}:${marginChunks}`;
        if (questReachability.has(cacheKey)) return questReachability.get(cacheKey);

        const base = {
            sector: {
                key: questSector.key,
                x: questSector.sectorX,
                y: questSector.sectorY,
                size: questSector.sectorSize,
            },
            questExists: !!(questSector.quest && questSector.quest.exists),
            marginChunks,
            marginRooms: marginChunks * chunkSize,
            network: 'bounded-world-graph',
            worldAssumption: 'chunk edge connectors are carved to each chunk hub and shared across neighbouring chunks',
        };

        if (!base.questExists) {
            const result = {
                ...base,
                cauldronExists: false,
                charmExists: false,
                reachable: null,
                pathLength: null,
                visitedRooms: 0,
                searchedRooms: 0,
                bounds: null,
                reason: 'sector has no quest',
                pathSample: [],
            };
            questReachability.set(cacheKey, result);
            return result;
        }

        const cauldron = questSector.quest.cauldron;
        const charm = questSector.quest.charm;
        const cauldronExists = roomExists(cauldron.x, cauldron.y);
        const charmExists = roomExists(charm.x, charm.y);
        const pathResult = cauldronExists && charmExists
            ? findReachablePath(cauldron, charm, base.marginRooms)
            : {
                reachable: false,
                path: [],
                pathLength: null,
                visitedRooms: 0,
                searchedRooms: 0,
                bounds: null,
                reason: 'missing anchor room',
            };
        const path = pathResult.path || [];
        const result = {
            ...base,
            cauldronExists,
            charmExists,
            reachable: pathResult.reachable,
            pathLength: pathResult.pathLength,
            visitedRooms: pathResult.visitedRooms,
            searchedRooms: pathResult.searchedRooms,
            bounds: cloneData(pathResult.bounds),
            reason: pathResult.reason,
            pathSample: path.length <= 10
                ? cloneData(path)
                : cloneData([...path.slice(0, 5), {x: null, y: null}, ...path.slice(-5)]),
        };

        questReachability.set(cacheKey, result);
        return result;
    };

    const canExtendCorridor = (cells, x, y, direction) => {
        if (!isInsideChunk(x, y) || cells[y][x]) return false;
        const entryDirection = OPPOSITE_DIRECTIONS[direction];

        for (const neighbourDirection of DIRECTIONS) {
            const delta = DIRECTION_DELTAS[neighbourDirection];
            const nx = x + delta.x;
            const ny = y + delta.y;
            if (!isInsideChunk(nx, ny) || !cells[ny][nx]) continue;
            if (neighbourDirection !== entryDirection) return false;
        }

        return true;
    };

    const collectCorridorStarts = cells => {
        const starts = [];

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (!cells[y][x]) continue;

                for (const direction of DIRECTIONS) {
                    const delta = DIRECTION_DELTAS[direction];
                    const nx = x + delta.x;
                    const ny = y + delta.y;
                    if (canExtendCorridor(cells, nx, ny, direction)) {
                        starts.push({x, y, direction});
                    }
                }
            }
        }

        return starts;
    };

    const isForcedGlobalRoom = (x, y) => (
        Math.abs(x) + Math.abs(y) <= 1
    );

    const addForcedRooms = (cells, chunkX, chunkY) => {
        for (let localY = 0; localY < chunkSize; localY++) {
            for (let localX = 0; localX < chunkSize; localX++) {
                const globalX = chunkX * chunkSize + localX;
                const globalY = chunkY * chunkSize + localY;
                if (isForcedGlobalRoom(globalX, globalY)) {
                    mark(cells, localX, localY);
                }
            }
        }
    };

    const addCorridorBranches = (cells, chunkX, chunkY) => {
        const targetCells = Math.max(
            countCells(cells),
            Math.round(chunkSize * chunkSize * config.targetRoomDensityPercent / 100)
        );

        for (
            let attempt = 0;
            countCells(cells) < targetCells && attempt < config.branchCorridorAttempts;
            attempt++
        ) {
            const starts = collectCorridorStarts(cells);
            if (!starts.length) return;

            const hash = hashInts(config.worldSeed, chunkX, chunkY, attempt, 0xb7);
            const start = starts[hash % starts.length];
            const length = 1 + ((hash >>> 8) % config.branchCorridorMaxLength);
            const delta = DIRECTION_DELTAS[start.direction];
            let x = start.x;
            let y = start.y;

            for (let step = 0; step < length && countCells(cells) < targetCells; step++) {
                x += delta.x;
                y += delta.y;
                if (!canExtendCorridor(cells, x, y, start.direction)) break;
                mark(cells, x, y);
            }
        }
    };

    const generateChunk = (chunkX, chunkY) => {
        const cells = makeEmptyCells(chunkSize);
        const connectors = {
            west: {x: 0, y: verticalEdgeConnectorY(chunkX, chunkY)},
            east: {x: chunkSize - 1, y: verticalEdgeConnectorY(chunkX + 1, chunkY)},
            south: {x: horizontalEdgeConnectorX(chunkX, chunkY), y: 0},
            north: {x: horizontalEdgeConnectorX(chunkX, chunkY + 1), y: chunkSize - 1},
        };
        const hub = {
            x: connectorIndex(chunkX, chunkY, 0x1a2b),
            y: connectorIndex(chunkX, chunkY, 0x2b1a),
        };

        for (const connector of Object.values(connectors)) {
            carvePath(cells, chunkX, chunkY, connector, hub, 0xcafe);
        }
        addForcedRooms(cells, chunkX, chunkY);
        addCorridorBranches(cells, chunkX, chunkY);
        const biome = chooseBiome(chunkX, chunkY);
        const questSector = createQuestSector(chunkX, chunkY, cells, hub, biome);

        return {
            chunkX,
            chunkY,
            cells,
            connectors,
            hub,
            questSector,
        };
    };

    const getChunk = (chunkX, chunkY) => {
        const key = chunkKey(chunkX, chunkY);
        if (!chunks.has(key)) chunks.set(key, generateChunk(chunkX, chunkY));
        return chunks.get(key);
    };

    const roomExists = (x, y) => {
        const coord = toChunkCoord(x, y);
        const chunk = getChunk(coord.chunkX, coord.chunkY);
        return !!chunk.cells[coord.localY][coord.localX];
    };

    const getRoomExits = (x, y) => {
        if (!roomExists(x, y)) {
            return {north: false, east: false, south: false, west: false};
        }
        const exits = {};
        for (const direction of DIRECTIONS) {
            const delta = DIRECTION_DELTAS[direction];
            exits[direction] = roomExists(x + delta.x, y + delta.y) ? 'arch' : false;
        }
        return exits;
    };

    const createBlockPositions = (x, y, count, salt = 0x100) => {
        const positions = [];
        const seen = new Set();
        const protectCentralStartCells = x === 0 && y === 0;
        for (let attempt = 0; positions.length < count && attempt < count * 8 + 16; attempt++) {
            const hash = hashInts(config.worldSeed, x, y, attempt, salt);
            const px = 2 + (hash & 0x03);
            const py = 2 + ((hash >>> 3) & 0x03);
            const key = coordKey(px, py);
            if (seen.has(key) || (protectCentralStartCells && isCentralFloorCell(px, py))) continue;
            seen.add(key);
            positions.push({x: px, y: py, z: 0});
        }
        return positions;
    };

    const createBlockRuns = (x, y, selector, biome, roomHash) => {
        if (selector !== 0) return [];

        const count = chooseBlockCount(biome, roomHash >>> 4);
        if (count <= 0) return [];

        const type = chooseArrayValue(biome.blockTypes, roomHash >>> 12);
        const positions = createBlockPositions(x, y, count, 0x100 + type);
        return positions.length ? [{type, positions}] : [];
    };

    const getRoomDefinition = (x, y) => {
        const coord = toChunkCoord(x, y);
        const chunk = getChunk(coord.chunkX, coord.chunkY);
        const exists = roomExists(x, y);
        const questInfo = getRoomQuestInfo(chunk.questSector, x, y);
        const biome = isForcedGlobalRoom(x, y)
            ? {
                ...DEFAULT_BIOME,
                region: {
                    x: floorDiv(coord.chunkX, styleRegionChunks),
                    y: floorDiv(coord.chunkY, styleRegionChunks),
                },
            }
            : chooseBiome(coord.chunkX, coord.chunkY);
        const commonMeta = {
            procedural: {
                algorithm: 'chunk-connected-v4',
                exists,
                worldSeed: config.worldSeed,
                chunkSize,
                chunk: {x: coord.chunkX, y: coord.chunkY},
                local: {x: coord.localX, y: coord.localY},
                style: {
                    biome: biome.id,
                    title: biome.title,
                    region: biome.region,
                },
            },
        };
        commonMeta.quest = questInfo;

        if (!exists) {
            return {
                coord: {x, y},
                label: `missing:${coordKey(x, y)}`,
                title: `missing ${coordKey(x, y)}`,
                size: {selector: 0},
                colour: 0,
                theme: 'stone',
                exits: {north: false, east: false, south: false, west: false},
                blocks: [],
                objects: [],
                items: [],
                questRole: questInfo.role,
                questSector: questInfo.sector,
                questCharm: questInfo.quest.requiredCharm || null,
                meta: commonMeta,
            };
        }

        const hash = hashInts(config.worldSeed, x, y, 0x4b4c);
        const exits = getRoomExits(x, y);
        const selector = chooseRoomSizeSelector(exits, x, y, config);
        const theme = biome.theme;
        const colour = chooseArrayValue(biome.colours, hash >>> 1);
        const blocks = createBlockRuns(x, y, selector, biome, hash);

        return {
            coord: {x, y},
            label: `generated:${biome.id}:${coordKey(x, y)}`,
            title: `${biome.title} ${coordKey(x, y)}`,
            size: {selector},
            colour,
            theme,
            exits: cloneExits(exits),
            blocks,
            objects: [],
            items: [],
            questRole: questInfo.role,
            questSector: questInfo.sector,
            questCharm: questInfo.quest.requiredCharm || null,
            meta: commonMeta,
        };
    };

    return {
        getRoomDefinition,
        getQuestSectorAt: (x, y) => {
            const coord = toChunkCoord(x, y);
            return cloneData(getChunk(coord.chunkX, coord.chunkY).questSector);
        },
        getQuestRoomInfoAt: (x, y) => {
            const coord = toChunkCoord(x, y);
            const chunk = getChunk(coord.chunkX, coord.chunkY);
            return cloneData(getRoomQuestInfo(chunk.questSector, x, y));
        },
        getQuestReachabilityAt: (x, y, options = {}) => {
            const coord = toChunkCoord(x, y);
            const chunk = getChunk(coord.chunkX, coord.chunkY);
            return cloneData(getQuestReachabilityForSector(chunk.questSector, options));
        },
        roomExists,
        getRoomExits,
        getChunk: (chunkX, chunkY) => getChunk(chunkX, chunkY),
        stats: () => ({
            algorithm: 'chunk-connected-v4',
            worldSeed: config.worldSeed,
            chunkSize,
            targetRoomDensityPercent: config.targetRoomDensityPercent,
            rectangularCandidatePercent: config.rectangularCandidatePercent,
            styleRegionChunks,
            biomes: BIOMES.map(biome => biome.id),
            generatedBiomeRegions: biomes.size,
            branchCorridorAttempts: config.branchCorridorAttempts,
            branchCorridorMaxLength: config.branchCorridorMaxLength,
            questSectorQuestPercent: config.questSectorQuestPercent,
            questReachabilityMarginChunks,
            questCharmTypes: QUEST_CHARM_TYPES.length,
            generatedChunks: chunks.size,
            reachabilityChecks: questReachability.size,
        }),
    };
}
