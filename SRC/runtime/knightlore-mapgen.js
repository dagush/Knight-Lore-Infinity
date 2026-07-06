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

export function createKnightLoreProceduralMap(options = {}) {
    const config = {
        ...DEFAULT_OPTIONS,
        ...options,
    };
    const chunkSize = config.chunkSize;
    const interiorSpan = Math.max(1, chunkSize - 2);
    const styleRegionChunks = positiveIntegerOr(config.styleRegionChunks, DEFAULT_OPTIONS.styleRegionChunks);
    const chunks = new Map();
    const biomes = new Map();

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

        return {
            chunkX,
            chunkY,
            cells,
            connectors,
            hub,
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
        for (let attempt = 0; positions.length < count && attempt < count * 8 + 16; attempt++) {
            const hash = hashInts(config.worldSeed, x, y, attempt, salt);
            const px = 2 + (hash & 0x03);
            const py = 2 + ((hash >>> 3) & 0x03);
            const key = coordKey(px, py);
            if (seen.has(key) || isCentralFloorCell(px, py)) continue;
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
        const exists = roomExists(x, y);
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
            meta: commonMeta,
        };
    };

    return {
        getRoomDefinition,
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
            generatedChunks: chunks.size,
        }),
    };
}
