import { createKnightLoreProceduralMap } from './knightlore-mapgen.js';

export function createKnightLoreInfinity(JSSpeccyImpl = window.JSSpeccy) {
    let emu = null;
    const KL_DIAGNOSTICS_BUILD = 'stage7-balanced-rectangles-20260704-1';
    const KL_URL_PARAMS = new URLSearchParams(window.location.search);
    const KL_MAP_FORMAT = 'knight-lore-infinity-logical-map-v1';
    const KL_STAGE45_MAP_URL = KL_URL_PARAMS.get('map');
    const KL_STAGE7_SLIDING_CROSS_ENABLED =
        KL_URL_PARAMS.get('stage7sliding') === '1' ||
        KL_URL_PARAMS.get('stage7') === '1';
    const KL_STAGE5_STATIC_MAP_URL = KL_STAGE7_SLIDING_CROSS_ENABLED ? null : (KL_URL_PARAMS.get('stage5staticmap') ||
        (KL_URL_PARAMS.get('stage5static3x3') === '1'
            ? 'maps/knight-lore-3x3-static-map.json'
            : null));
    let renderStage4LogicalMapNow = null;
    let logicalMapLoadStatus = {
        attempted: false,
        done: true,
        message: 'Using built-in authored rooms plus deterministic generation.',
    };
    const KL_STAGE5_FORCE_ROOM_PARAM = (() => {
        const raw = KL_URL_PARAMS.get('stage5force');
        if (raw === null) return {present: false, value: null, raw: null, error: null};

        const text = raw.trim();
        if (!/^0x[0-9a-f]{1,2}$/i.test(text)) {
            return {
                present: true,
                value: null,
                raw,
                error: `Invalid stage5force value "${raw}". Use a hex byte such as 0x78, 0x88, or 0x98.`,
            };
        }

        return {
            present: true,
            value: Number.parseInt(text.slice(2), 16),
            raw,
            error: null,
        };
    })();

    const KL_STAGE1 = {
        workStart: 0x5ba0,
        workEnd: 0x6108,
        staticStart: 0x6248,
        staticEnd: 0x6bd1,
        roomSizeTable: 0x6248,
        locationStart: 0x6251,
        locationEnd: 0x6bd1,
        rows: [
            ['sampler', 'Sampler'],
            ['frame', 'Frame boundary'],
            ['currentRoom', 'Current location 0x5C10'],
            ['secondaryRoom', 'Observed 0x5C30'],
            ['playerBody', 'Player body XYZ'],
            ['playerHead', 'Player head XYZ'],
            ['slotFlags', 'Slot +12 flags'],
            ['workRoom', '0x5BAB..0x5BAE room fields'],
            ['locationFormat', '0x6251 locations format'],
            ['entry', 'Location table entry'],
            ['entryHeader', 'Location header'],
            ['backgrounds', 'Background ids'],
            ['blockGroups', 'Block/count groups'],
            ['blockPositions', 'Packed block positions'],
            ['attrCompare', 'Attribute compare'],
            ['sizeCompare', 'Size selector compare'],
            ['stage5StaticMap', 'Stage 5 static map injection'],
            ['stage5Recenter', 'Stage 5 room-id force test'],
            ['stage7Sliding', 'Stage 7 sliding cross'],
            ['transition', 'Latest room transition'],
            ['timing', 'frameCompleted timing'],
        ],
    };

    const KL_STAGE2 = {
        centerRoom: 0x88,
        startLocationsAddr: 0xd1e2,
        startLocationsOriginal: [0x2f, 0x44, 0xb3, 0x8f],
        startLocationsPatched: [0x88, 0x88, 0x88, 0x88],
        cleanRoomPatches: [
            {addr: 0x6fae, length: 17, label: 'wizard background'},
            {addr: 0x6fbf, length: 17, label: 'cauldron background'},
            {addr: 0xb8c8, length: 18, label: 'cauldron bubbles'},
        ],
        crossRooms: [
            {role: 'center', id: 0x88},
            {role: 'west', id: 0x87},
            {role: 'east', id: 0x89},
            {role: 'south', id: 0x78},
            {role: 'north', id: 0x98},
        ],
    };

    const KL_STAGE7_SLIDING_CROSS = {
        enabled: KL_STAGE7_SLIDING_CROSS_ENABLED,
        centerRoom: KL_STAGE2.centerRoom,
        currentRoomAddr: 0x5c10,
        slotStart: 0x5c08,
        slotEnd: KL_STAGE1.workEnd,
        slotSize: 0x20,
        slotRoomOffset: 0x08,
        physicalCross: [
            {role: 'center', id: 0x88, offset: {x: 0, y: 0}},
            {role: 'west', id: 0x87, offset: {x: -1, y: 0}},
            {role: 'east', id: 0x89, offset: {x: 1, y: 0}},
            {role: 'south', id: 0x78, offset: {x: 0, y: -1}},
            {role: 'north', id: 0x98, offset: {x: 0, y: 1}},
        ],
        directionDeltas: {
            north: {x: 0, y: 1},
            east: {x: 1, y: 0},
            south: {x: 0, y: -1},
            west: {x: -1, y: 0},
        },
    };

    const KL_STAGE3_ONE_ROOM_INJECTION_TEST = {
        enabled: KL_URL_PARAMS.get('stage3test') === '1',
        targetRoom: 0x88,
        entryAddr: 0x67bb,
        originalEntryBytes: [
            0x88, 0x13, 0x06,
            0x00, 0x01, 0x02, 0x03, 0x12, 0x13, 0x0c, 0xff,
            0x07, 0x32, 0x29, 0x35, 0x2e, 0x16, 0x0d, 0x11, 0x0a,
        ],
        testEntryBytes: [
            // Square 64x64x128 center room for manual 5-cross traversal.
            // Four stone arches keep all cardinal exits usable; 0x12/0x13
            // are null fillers after the room-clean patch and preserve size.
            0x88, 0x13, 0x06,
            0x00, 0x01, 0x02, 0x03, 0x12, 0x13, 0x0c, 0xff,
            0x1f, 0x32, 0x29, 0x35, 0x2e, 0x16, 0x0d, 0x11, 0x0a,
        ],
    };

    const KL_STAGE4 = {
        coordinateConvention: 'north is y + 1; south is y - 1',
        compileProbeRoom: 0x88,
        sampleQueries: [
            {label: 'origin', x: 0, y: 0},
            {label: 'east neighbour', x: 1, y: 0},
            {label: 'exit criterion', x: 12, y: -4},
        ],
    };

    const KL_STAGE5_ROOM_ID_FORCE_TEST = {
        enabled: KL_STAGE5_FORCE_ROOM_PARAM.present ||
            KL_URL_PARAMS.get('stage5test') === '1' ||
            KL_URL_PARAMS.get('stage5roomid') === '1',
        centerRoom: KL_STAGE2.centerRoom,
        forceRoom: KL_STAGE5_FORCE_ROOM_PARAM.value === null
            ? KL_STAGE2.centerRoom
            : KL_STAGE5_FORCE_ROOM_PARAM.value,
        configError: KL_STAGE5_FORCE_ROOM_PARAM.error,
        currentRoomAddr: 0x5c10,
    };

    const KL_STAGE4_AUTHORED_ROOMS = [
        {
            label: '0x88',
            coord: {x: 0, y: 0},
            title: 'authored origin cross',
            size: {selector: 0},
            colour: 6,
            theme: 'stone',
            exits: {north: 'arch', east: 'arch', south: 'arch', west: 'arch'},
            blocks: [
                {
                    type: 0x03,
                    positions: [
                        {x: 2, y: 3, z: 0},
                        {x: 5, y: 3, z: 0},
                        {x: 2, y: 4, z: 0},
                        {x: 5, y: 4, z: 0},
                    ],
                },
            ],
            objects: [],
            items: [],
        },
    ];

    const KL_BACKGROUND_NAMES = [
        'arch north', 'arch east', 'arch south', 'arch west',
        'tree arch north', 'tree arch east', 'tree arch south', 'tree arch west',
        'portcullis north', 'portcullis east', 'portcullis south', 'portcullis west',
        'wall size 1', 'wall size 2', 'wall size 3', 'tree room size 1',
        'tree filler west', 'tree filler north', 'wizard', 'cauldron',
        'high arch east', 'high arch south', 'high arch east base', 'high arch south base',
    ];

    const KL_BLOCK_NAMES = [
        'block', 'fire unused', 'ball up/down', 'rock',
        'gargoyle', 'spike block', 'pushable chest', 'pushable table',
        'guard east/west', 'ghost', 'fire north/south', 'block high',
        'ball up/down offset xy', 'guard square patrol', 'block moving east/west', 'block moving north/south',
        'movable block', 'spike block high', 'spike ball fall', 'spike ball high fall',
        'fire east/west', 'dropping block', 'collapsing block', 'ball bouncing',
        'ball up/down', 'spell repels player', 'portcullis up/down', 'portcullis up/down',
        'ball up/down offset x',
    ];

    const KL_SIZE_SELECTORS = {
        0: {selector: 0, x: 64, y: 64, z: 128, wallId: 0x0c, allowedExits: ['north', 'east', 'south', 'west']},
        1: {selector: 1, x: 32, y: 64, z: 128, wallId: 0x0e, allowedExits: ['north', 'south']},
        2: {selector: 2, x: 64, y: 32, z: 128, wallId: 0x0d, allowedExits: ['east', 'west']},
    };

    const KL_STONE_ARCH_IDS = {
        north: 0x00,
        east: 0x01,
        south: 0x02,
        west: 0x03,
    };

    const KL_TREE_ARCH_IDS = {
        north: 0x04,
        east: 0x05,
        south: 0x06,
        west: 0x07,
    };

    const KL_DIRECTIONS = ['north', 'east', 'south', 'west'];
    const KL_OPPOSITE_DIRECTIONS = {
        north: 'south',
        east: 'west',
        south: 'north',
        west: 'east',
    };
    const KL_DIRECTION_DELTAS = {
        north: {x: 0, y: 1},
        east: {x: 1, y: 0},
        south: {x: 0, y: -1},
        west: {x: -1, y: 0},
    };
    const KL_ARCH_IDS_BY_DIRECTION = {
        north: [KL_STONE_ARCH_IDS.north, KL_TREE_ARCH_IDS.north],
        east: [KL_STONE_ARCH_IDS.east, KL_TREE_ARCH_IDS.east],
        south: [KL_STONE_ARCH_IDS.south, KL_TREE_ARCH_IDS.south],
        west: [KL_STONE_ARCH_IDS.west, KL_TREE_ARCH_IDS.west],
    };
    const KL_ALL_CARDINAL_ARCH_IDS = new Set(
        Object.values(KL_ARCH_IDS_BY_DIRECTION).flat()
    );
    const KL_SIZE_WALL_IDS = new Set(
        Object.values(KL_SIZE_SELECTORS).map(selector => selector.wallId)
    );
    const KL_TREE_FILLER_IDS = new Set([0x0f, 0x10, 0x11]);
    const KL_TREE_SQUARE_BACKGROUNDS_BY_EXIT_MASK = {
        ES: [0x05, 0x06, 0x0f, 0x10, 0x11],
        ESW: [0x05, 0x06, 0x07, 0x0f, 0x11],
        EW: [0x05, 0x07, 0x0f, 0x11],
        NE: [0x04, 0x05, 0x0f, 0x10],
        NES: [0x04, 0x05, 0x06, 0x0f, 0x10],
        NESW: [0x04, 0x05, 0x06, 0x07, 0x0f],
        NEW: [0x04, 0x05, 0x07, 0x0f],
        NS: [0x04, 0x06, 0x0f, 0x10],
        NSW: [0x04, 0x06, 0x07, 0x0f],
        NW: [0x04, 0x07, 0x0f],
        SW: [0x06, 0x07, 0x0f, 0x11],
    };

    const cloneData = value => JSON.parse(JSON.stringify(value));
    const logicalCoordKey = (x, y) => `${x},${y}`;
    const normalizeLabel = value => String(value).trim();
    const sameCoord = (a, b) => a && b && a.x === b.x && a.y === b.y;
    const getCoord = coord => {
        const x = Number(coord.x);
        const y = Number(coord.y);
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
            throw new Error(`Logical coordinates must be integers; received (${coord.x}, ${coord.y}).`);
        }
        return {x, y};
    };

    const normalizeExits = exits => {
        const result = {};
        for (const direction of KL_DIRECTIONS) {
            result[direction] = exits && exits[direction] ? exits[direction] : false;
        }
        return result;
    };

    const normalizeBlockRuns = blocks => (
        (blocks || []).map(block => ({
            type: Number(block.type),
            positions: (block.positions || []).map(position => ({
                x: Number(position.x),
                y: Number(position.y),
                z: Number(position.z),
            })),
        })).filter(block => block.positions.length)
    );

    const getExitMask = exits => (
        KL_DIRECTIONS
            .filter(direction => exits && exits[direction])
            .map(direction => direction[0].toUpperCase())
            .join('')
    );

    const buildStoneBackgroundsWithExits = (room, exits) => {
        const selectorInfo = KL_SIZE_SELECTORS[room.size.selector];
        if (!selectorInfo) return [];
        return [
            ...KL_DIRECTIONS
                .filter(direction => exits && exits[direction])
                .map(direction => KL_STONE_ARCH_IDS[direction]),
            selectorInfo.wallId,
        ];
    };

    const buildTreeSquareBackgroundsWithExits = (room, exits) => {
        if (room.size.selector !== 0) return null;

        const mask = getExitMask(exits);
        const baseBackgrounds = KL_TREE_SQUARE_BACKGROUNDS_BY_EXIT_MASK[mask];
        if (!baseBackgrounds) return null;

        const specialBackgrounds = (room.backgrounds || []).filter(value => (
            !KL_ALL_CARDINAL_ARCH_IDS.has(value) &&
            !KL_TREE_FILLER_IDS.has(value) &&
            !KL_SIZE_WALL_IDS.has(value)
        ));

        return [...baseBackgrounds, ...specialBackgrounds];
    };

    const buildBackgrounds = room => {
        if (Array.isArray(room.backgrounds)) return [...room.backgrounds];

        const selectorInfo = KL_SIZE_SELECTORS[room.size.selector];
        if (!selectorInfo) return [];

        const exits = room.exits || {};
        const theme = room.theme || 'stone';
        if (theme === 'tree') {
            const treeBackgrounds = buildTreeSquareBackgroundsWithExits(room, exits);
            if (treeBackgrounds) return treeBackgrounds;
        }

        return buildStoneBackgroundsWithExits(room, exits);
    };

    const roomAllowsExit = (room, direction) => {
        const selectorInfo = KL_SIZE_SELECTORS[room.size.selector];
        return !!(selectorInfo && selectorInfo.allowedExits.includes(direction));
    };

    const chooseArchIdForRoom = (room, direction) => {
        const [stoneId, treeId] = KL_ARCH_IDS_BY_DIRECTION[direction];
        if (room.backgrounds && room.backgrounds.includes(treeId)) return treeId;
        if (room.theme === 'tree') return treeId;
        const hasTreeArchitecture = (room.backgrounds || []).some(value => (
            value >= 0x04 && value <= 0x07
        ));
        return hasTreeArchitecture ? treeId : stoneId;
    };

    const buildBackgroundsWithExits = (room, exits) => {
        const hasTreeArchitecture = room.theme === 'tree' || (room.backgrounds || []).some(value => (
            (value >= 0x04 && value <= 0x07) || KL_TREE_FILLER_IDS.has(value)
        ));
        if (hasTreeArchitecture) {
            const treeBackgrounds = buildTreeSquareBackgroundsWithExits(room, exits);
            if (treeBackgrounds) return treeBackgrounds;

            const specialBackgrounds = (room.backgrounds || []).filter(value => (
                !KL_ALL_CARDINAL_ARCH_IDS.has(value) &&
                !KL_TREE_FILLER_IDS.has(value) &&
                !KL_SIZE_WALL_IDS.has(value)
            ));
            return [...buildStoneBackgroundsWithExits(room, exits), ...specialBackgrounds];
        }

        const nonArchBackgrounds = (room.backgrounds || [])
            .filter(value => !KL_ALL_CARDINAL_ARCH_IDS.has(value));
        const archBackgrounds = KL_DIRECTIONS
            .filter(direction => exits[direction])
            .map(direction => chooseArchIdForRoom(room, direction));
        return [...archBackgrounds, ...nonArchBackgrounds];
    };

    const normalizeLogicalRoomDefinition = (definition, source) => {
        const coord = getCoord(definition.coord);
        const selector = definition.size && definition.size.selector !== undefined
            ? Number(definition.size.selector)
            : 0;
        const selectorInfo = KL_SIZE_SELECTORS[selector];
        const fallbackLabel = definition.originalRoomHex ||
            (definition.originalRoomId !== undefined ? `0x${Number(definition.originalRoomId).toString(16).toUpperCase().padStart(2, '0')}` : null) ||
            `${source}:${logicalCoordKey(coord.x, coord.y)}`;
        const label = normalizeLabel(definition.label !== undefined ? definition.label : fallbackLabel);
        const room = {
            key: logicalCoordKey(coord.x, coord.y),
            coord,
            label,
            title: definition.title || label,
            aliases: Array.from(new Set(
                (definition.aliases || [])
                    .map(normalizeLabel)
                    .filter(alias => alias && alias !== label)
            )),
            source,
            size: {
                selector,
                x: selectorInfo ? selectorInfo.x : null,
                y: selectorInfo ? selectorInfo.y : null,
                z: selectorInfo ? selectorInfo.z : null,
            },
            colour: definition.colour !== undefined ? Number(definition.colour) : 6,
            theme: definition.theme || 'stone',
            exits: normalizeExits(definition.exits),
            backgrounds: null,
            blocks: normalizeBlockRuns(definition.blocks),
            objects: cloneData(definition.objects || []),
            items: cloneData(definition.items || []),
            originalRoomId: definition.originalRoomId !== undefined ? Number(definition.originalRoomId) : null,
            meta: cloneData(definition.meta || {}),
        };

        room.backgrounds = buildBackgrounds({
            ...room,
            backgrounds: definition.backgrounds,
        });

        return room;
    };

    const validateLogicalRoom = room => {
        const errors = [];
        const selectorInfo = KL_SIZE_SELECTORS[room.size.selector];
        if (!room.label) errors.push('Room label must be a non-empty string.');
        if (!Number.isInteger(room.size.selector) || !selectorInfo) errors.push(`Unsupported size selector ${room.size.selector}.`);
        if (!Number.isInteger(room.colour) || room.colour < 0 || room.colour > 7) errors.push(`Invalid colour ${room.colour}.`);
        if (!room.backgrounds.length) errors.push('Room must have at least one background id.');
        for (const background of room.backgrounds) {
            if (!Number.isInteger(background) || background < 0 || background > 0xff) {
                errors.push(`Invalid background id ${background}.`);
            }
        }

        if (selectorInfo) {
            for (const direction of KL_DIRECTIONS) {
                if (room.exits[direction] && !selectorInfo.allowedExits.includes(direction)) {
                    errors.push(`Exit ${direction} is not valid for size selector ${room.size.selector}.`);
                }
            }
        }

        for (const block of room.blocks) {
            if (!Number.isInteger(block.type) || block.type < 0 || block.type > 0x1f) {
                errors.push(`Invalid block type ${block.type}.`);
            }
            for (const position of block.positions) {
                if (
                    !Number.isInteger(position.x) || position.x < 0 || position.x > 7 ||
                    !Number.isInteger(position.y) || position.y < 0 || position.y > 7 ||
                    !Number.isInteger(position.z) || position.z < 0 || position.z > 3
                ) {
                    errors.push(`Invalid block position ${JSON.stringify(position)}.`);
                }
            }
        }

        return errors;
    };

    const compileBlockRuns = blocks => {
        const bytes = [];
        for (const block of blocks) {
            for (let index = 0; index < block.positions.length; index += 8) {
                const chunk = block.positions.slice(index, index + 8);
                bytes.push((block.type << 3) | (chunk.length - 1));
                for (const position of chunk) {
                    bytes.push((position.z << 6) | (position.y << 3) | position.x);
                }
            }
        }
        return bytes;
    };

    const compileLogicalRoomToLocationEntry = (room, physicalRoomId = KL_STAGE2.centerRoom) => {
        const errors = validateLogicalRoom(room);
        if (errors.length) {
            return {
                valid: false,
                errors,
                physicalRoomId,
                bytes: [],
                payload: [],
                entrySize: 0,
            };
        }

        const blockBytes = compileBlockRuns(room.blocks);
        const header = (room.size.selector << 3) | (room.colour & 0x07);
        const payload = blockBytes.length
            ? [header, ...room.backgrounds, 0xff, ...blockBytes]
            : [header, ...room.backgrounds];
        const entrySize = payload.length + 1;
        const bytes = [physicalRoomId & 0xff, entrySize, ...payload];

        return {
            valid: entrySize <= 0xff,
            errors: entrySize <= 0xff ? [] : [`Location entry is too large: ${entrySize} bytes.`],
            physicalRoomId: physicalRoomId & 0xff,
            entrySize,
            payload,
            bytes,
            backgroundCount: room.backgrounds.length,
            blockByteCount: blockBytes.length,
        };
    };

    function createKnightLoreLogicalMap(authoredRooms = []) {
        const authored = new Map();
        const generated = new Map();
        const persistent = new Map();
        const labels = new Map();
        const proceduralMap = createKnightLoreProceduralMap();
        let activeDocument = {
            format: KL_MAP_FORMAT,
            title: 'Built-in Stage 4 seed',
            sourceUrl: null,
        };

        const ensurePersistentState = room => {
            if (!persistent.has(room.key)) {
                persistent.set(room.key, {
                    coord: cloneData(room.coord),
                    visited: false,
                    revision: 0,
                    objects: cloneData(room.objects),
                    items: cloneData(room.items),
                });
            }
            return persistent.get(room.key);
        };

        const getRoomAt = (x, y) => {
            const coord = getCoord({x, y});
            const key = logicalCoordKey(coord.x, coord.y);
            let definition = authored.get(key);
            let source = 'authored';

            if (!definition) {
                source = 'generated';
                if (!generated.has(key)) {
                    generated.set(key, proceduralMap.getRoomDefinition(coord.x, coord.y));
                }
                definition = generated.get(key);
            }

            const room = normalizeLogicalRoomDefinition(definition, source);
            room.state = ensurePersistentState(room);
            return room;
        };

        const loadAuthoredRooms = rooms => {
            const staged = [];
            const stagedLabels = new Map(labels);
            const stagedCoords = new Set();

            const unregisterLabels = definition => {
                if (!definition) return;
                const previous = normalizeLogicalRoomDefinition(definition, 'authored');
                stagedLabels.delete(previous.label);
                for (const alias of previous.aliases) stagedLabels.delete(alias);
            };

            const registerLabel = (label, coord) => {
                const existing = stagedLabels.get(label);
                if (existing && !sameCoord(existing, coord)) {
                    throw new Error(`Duplicate room label or alias "${label}" for coordinates ${logicalCoordKey(existing.x, existing.y)} and ${logicalCoordKey(coord.x, coord.y)}.`);
                }
                stagedLabels.set(label, cloneData(coord));
            };

            for (const room of rooms || []) {
                const coord = getCoord(room.coord);
                const key = logicalCoordKey(coord.x, coord.y);
                if (stagedCoords.has(key)) {
                    throw new Error(`Duplicate room coordinate ${key} in map JSON.`);
                }
                stagedCoords.add(key);

                const previous = authored.get(key);
                const copy = cloneData(room);
                const normalized = normalizeLogicalRoomDefinition(copy, 'authored');
                const errors = validateLogicalRoom(normalized);
                if (errors.length) {
                    throw new Error(`Invalid room ${normalized.label} at ${key}: ${errors.join('; ')}`);
                }

                unregisterLabels(previous);
                registerLabel(normalized.label, coord);
                for (const alias of normalized.aliases) registerLabel(alias, coord);
                staged.push({key, coord, copy});
            }

            labels.clear();
            for (const [label, coord] of stagedLabels.entries()) {
                labels.set(label, coord);
            }

            for (const {key, copy} of staged) {
                authored.set(key, copy);
                generated.delete(key);
            }
        };

        const loadMapDocument = (document, options = {}) => {
            const rooms = Array.isArray(document) ? document : document.rooms;
            if (!Array.isArray(rooms)) {
                throw new Error('Map JSON must be an array of rooms or an object with a rooms array.');
            }

            const replace = options.replace !== false;
            const previousAuthored = new Map(authored);
            const previousGenerated = new Map(generated);
            const previousPersistent = new Map(persistent);
            const previousLabels = new Map(labels);
            const previousDocument = activeDocument;

            activeDocument = {
                format: Array.isArray(document) ? 'rooms-array' : (document.format || 'unknown'),
                title: Array.isArray(document) ? 'Anonymous rooms array' : (document.title || document.label || 'Untitled logical map'),
                sourceUrl: options.sourceUrl || null,
            };

            try {
                if (replace) {
                    authored.clear();
                    labels.clear();
                    generated.clear();
                    persistent.clear();
                }
                loadAuthoredRooms(rooms);
            } catch (err) {
                authored.clear();
                generated.clear();
                persistent.clear();
                labels.clear();
                for (const [key, value] of previousAuthored.entries()) authored.set(key, value);
                for (const [key, value] of previousGenerated.entries()) generated.set(key, value);
                for (const [key, value] of previousPersistent.entries()) persistent.set(key, value);
                for (const [key, value] of previousLabels.entries()) labels.set(key, value);
                activeDocument = previousDocument;
                throw err;
            }

            return {
                ...activeDocument,
                loadedRooms: rooms.length,
            };
        };

        const getRoomByLabel = label => {
            const coord = labels.get(String(label));
            return coord ? getRoomAt(coord.x, coord.y) : null;
        };

        loadAuthoredRooms(authoredRooms);

        return {
            getRoomAt,
            getRoomByLabel,
            compileRoomAt: (x, y, physicalRoomId = KL_STAGE2.centerRoom) => (
                compileLogicalRoomToLocationEntry(getRoomAt(x, y), physicalRoomId)
            ),
            compileRoom: compileLogicalRoomToLocationEntry,
            loadAuthoredRooms,
            loadMapDocument,
            getPersistentState: (x, y) => ensurePersistentState(getRoomAt(x, y)),
            markVisited: (x, y) => {
                const state = ensurePersistentState(getRoomAt(x, y));
                state.visited = true;
                state.revision++;
                return state;
            },
            stats: () => ({
                activeDocument: cloneData(activeDocument),
                authoredRooms: authored.size,
                generatedRooms: generated.size,
                persistentRooms: persistent.size,
                labels: labels.size,
                procedural: proceduralMap.stats(),
            }),
        };
    }

    const logicalMap = createKnightLoreLogicalMap(KL_STAGE4_AUTHORED_ROOMS);

    const loadLogicalMapDocument = (document, options = {}) => {
        const result = logicalMap.loadMapDocument(document, options);
        logicalMapLoadStatus = {
            attempted: true,
            done: true,
            message: `Loaded JSON map "${result.title}" with ${result.loadedRooms} authored rooms.`,
        };
        if (renderStage4LogicalMapNow) renderStage4LogicalMapNow();
        return result;
    };

    const loadLogicalMapFromUrl = async url => {
        logicalMapLoadStatus = {
            attempted: true,
            done: false,
            message: `Loading JSON map from ${url}.`,
        };
        if (renderStage4LogicalMapNow) renderStage4LogicalMapNow();

        try {
            if (typeof fetch !== 'function') {
                throw new Error('fetch is not available in this environment.');
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} while loading ${url}.`);
            }
            const document = await response.json();
            return loadLogicalMapDocument(document, {
                replace: true,
                sourceUrl: url,
            });
        } catch (err) {
            logicalMapLoadStatus = {
                attempted: true,
                done: false,
                message: `Failed to load JSON map from ${url}: ${err.message || err}.`,
            };
            if (renderStage4LogicalMapNow) renderStage4LogicalMapNow();
            throw err;
        }
    };

    const parsePhysicalRoomId = definition => {
        if (definition.originalRoomId !== undefined) {
            const value = Number(definition.originalRoomId);
            if (Number.isInteger(value) && value >= 0 && value <= 0xff) return value;
        }

        if (typeof definition.label === 'string' && /^0x[0-9a-f]{1,2}$/i.test(definition.label)) {
            return Number.parseInt(definition.label.slice(2), 16);
        }

        return null;
    };

    const compileStaticMapDocumentToLocationTable = document => {
        const rooms = Array.isArray(document) ? document : document.rooms;
        if (!Array.isArray(rooms) || !rooms.length) {
            throw new Error('Static map JSON must contain a non-empty rooms array.');
        }

        const tempMap = createKnightLoreLogicalMap([]);
        tempMap.loadMapDocument(document, {replace: true});

        const bytes = [];
        const roomSummaries = [];
        for (const definition of rooms) {
            const physicalRoomId = parsePhysicalRoomId(definition);
            if (physicalRoomId === null) {
                throw new Error(`Room "${definition.label || '(unlabelled)'}" needs originalRoomId or a 0xNN label for static table injection.`);
            }

            const coord = getCoord(definition.coord);
            const room = tempMap.getRoomAt(coord.x, coord.y);
            const compiled = tempMap.compileRoom(room, physicalRoomId);
            if (!compiled.valid) {
                throw new Error(`Room ${room.label} failed to compile: ${compiled.errors.join('; ')}`);
            }

            bytes.push(...compiled.bytes);
            roomSummaries.push({
                label: room.label,
                physicalRoomId,
                entrySize: compiled.entrySize,
                byteCount: compiled.bytes.length,
                backgroundCount: compiled.backgroundCount,
                blockByteCount: compiled.blockByteCount,
            });
        }

        const capacity = KL_STAGE1.locationEnd - KL_STAGE1.locationStart;
        if (bytes.length > capacity) {
            throw new Error(`Compiled static map is ${bytes.length} bytes but the original location table has only ${capacity} bytes.`);
        }

        return {
            title: Array.isArray(document) ? 'rooms array' : (document.title || 'Untitled static map'),
            bytes,
            roomSummaries,
            roomCount: roomSummaries.length,
            capacity,
        };
    };

    const createReciprocalExitRoom = (room, getRoomAt) => {
        const exits = {...room.exits};
        const adjustments = [];

        for (const direction of KL_DIRECTIONS) {
            const delta = KL_DIRECTION_DELTAS[direction];
            const opposite = KL_OPPOSITE_DIRECTIONS[direction];
            const neighbour = getRoomAt(room.coord.x + delta.x, room.coord.y + delta.y);
            const roomHasExit = !!room.exits[direction];
            const neighbourHasReturn = !!neighbour.exits[opposite];
            const roomExists = room.meta && room.meta.procedural
                ? room.meta.procedural.exists !== false
                : true;
            const neighbourExists = neighbour.meta && neighbour.meta.procedural
                ? neighbour.meta.procedural.exists !== false
                : true;
            const roomIsGenerated = room.source === 'generated';
            const neighbourIsGenerated = neighbour.source === 'generated';
            const pairHasAuthoredExit =
                (!roomIsGenerated && roomHasExit) ||
                (!neighbourIsGenerated && neighbourHasReturn);
            const pairHasGeneratedExit =
                roomIsGenerated &&
                neighbourIsGenerated &&
                (roomHasExit || neighbourHasReturn);
            const pairShouldHaveDoor = roomExists && neighbourExists && (
                pairHasAuthoredExit || pairHasGeneratedExit
            );

            if (!pairShouldHaveDoor) {
                if (roomHasExit) {
                    adjustments.push({
                        type: 'removed',
                        direction,
                        neighbourLabel: neighbour.label,
                        neighbourCoord: cloneData(neighbour.coord),
                        reason: `${neighbour.label} has no authored ${opposite} exit`,
                    });
                }
                exits[direction] = false;
                continue;
            }

            if (roomAllowsExit(room, direction) && roomAllowsExit(neighbour, opposite)) {
                if (!roomHasExit && neighbourHasReturn) {
                    adjustments.push({
                        type: 'added',
                        direction,
                        neighbourLabel: neighbour.label,
                        neighbourCoord: cloneData(neighbour.coord),
                        reason: `${neighbour.label} has ${opposite}`,
                    });
                }
                exits[direction] = room.exits[direction] || neighbour.exits[opposite] || 'arch';
            } else {
                if (roomHasExit) {
                    adjustments.push({
                        type: 'removed',
                        direction,
                        neighbourLabel: neighbour.label,
                        neighbourCoord: cloneData(neighbour.coord),
                        reason: roomAllowsExit(room, direction)
                            ? `${neighbour.label} cannot host ${opposite}`
                            : `${room.label} cannot host ${direction}`,
                    });
                }
                exits[direction] = false;
            }
        }

        if (!adjustments.length) return {room, adjustments};

        const patchedRoom = {
            ...room,
            exits,
            backgrounds: buildBackgroundsWithExits(room, exits),
        };

        return {
            room: patchedRoom,
            adjustments,
        };
    };

    const compileStage7SlidingCrossToLocationTable = centerCoord => {
        const bytes = [];
        const roomSummaries = [];

        for (const physical of KL_STAGE7_SLIDING_CROSS.physicalCross) {
            const logicalCoord = {
                x: centerCoord.x + physical.offset.x,
                y: centerCoord.y + physical.offset.y,
            };
            const room = logicalMap.getRoomAt(logicalCoord.x, logicalCoord.y);
            const reciprocal = createReciprocalExitRoom(room, logicalMap.getRoomAt);
            const compiled = logicalMap.compileRoom(reciprocal.room, physical.id);
            if (!compiled.valid) {
                throw new Error(`Logical room ${room.label} at ${logicalCoordKey(logicalCoord.x, logicalCoord.y)} failed to compile for physical ${physical.role} ${physical.id.toString(16)}: ${compiled.errors.join('; ')}`);
            }

            bytes.push(...compiled.bytes);
            roomSummaries.push({
                role: physical.role,
                physicalRoomId: physical.id,
                logicalCoord,
                label: room.label,
                source: room.source,
                entrySize: compiled.entrySize,
                byteCount: compiled.bytes.length,
                backgroundCount: compiled.backgroundCount,
                blockByteCount: compiled.blockByteCount,
                reciprocalExitAdjustments: reciprocal.adjustments,
            });
        }

        const capacity = KL_STAGE1.locationEnd - KL_STAGE1.locationStart;
        if (bytes.length > capacity) {
            throw new Error(`Compiled Stage 7 sliding cross is ${bytes.length} bytes but the original location table has only ${capacity} bytes.`);
        }

        return {
            title: `Stage 7 sliding cross centered at ${logicalCoordKey(centerCoord.x, centerCoord.y)}`,
            bytes,
            roomSummaries,
            roomCount: roomSummaries.length,
            capacity,
        };
    };

    function startKnightLore() {
        emu = JSSpeccyImpl(document.getElementById('jsspeccy'), {
            zoom: 2,
            sandbox: false,
            autoStart: true,
            openUrl: 'Knight Lore (1984)(Ultimate).z80',
        });
        const logicalMapLoadPromise = KL_STAGE45_MAP_URL
            ? loadLogicalMapFromUrl(KL_STAGE45_MAP_URL).catch(err => {
                console.error(err);
                return null;
            })
            : null;
        installKnightLoreDiagnostics(emu, logicalMapLoadPromise);
    }

    function installKnightLoreDiagnostics(emu, logicalMapLoadPromise = null) {
        const tbody = document.getElementById('stage1-diagnostics-body');
        const crossTbody = document.getElementById('stage2-cross-body');
        const stage2Status = document.getElementById('stage2-status');
        const logicalTbody = document.getElementById('stage4-logical-body');
        const stage4Status = document.getElementById('stage4-status');
        const rowEls = new Map();
        let sampleCount = 0;
        let frameCompletedCount = 0;
        let sampleInFlight = false;
        let previousSample = null;
        let lastTransition = null;
        let stage2StartPoke = {
            attempted: false,
            done: false,
            message: 'Waiting to patch start_locations.',
        };
        let stage2RoomCleanPatch = {
            attempted: false,
            done: false,
            message: 'Waiting to clean room 0x88.',
        };
        let stage3OneRoomInjectionTest = {
            attempted: false,
            done: false,
            message: KL_STAGE5_STATIC_MAP_URL || KL_STAGE7_SLIDING_CROSS.enabled
                ? `Stage 3 one-room injection test is suppressed while ${KL_STAGE7_SLIDING_CROSS.enabled ? 'Stage 7 sliding cross' : 'a Stage 5 static map injection'} is enabled.`
                : KL_STAGE3_ONE_ROOM_INJECTION_TEST.enabled
                ? 'Stage 3 one-room injection test is enabled by ?stage3test=1 and waiting to patch.'
                : 'Stage 3 one-room injection test is disabled; add ?stage3test=1 to the URL to run it.',
        };
        let stage5StaticMapInjection = {
            enabled: !!KL_STAGE5_STATIC_MAP_URL,
            url: KL_STAGE5_STATIC_MAP_URL,
            loading: false,
            loaded: false,
            compiled: null,
            attempted: false,
            done: false,
            lastError: null,
            message: KL_STAGE5_STATIC_MAP_URL
                ? `Waiting to load static map ${KL_STAGE5_STATIC_MAP_URL}.`
                : 'Disabled; add ?stage5static3x3=1 to erase and inject the 3x3 static map fixture.',
        };
        let stage5RoomIdRecenterTest = {
            enabled: KL_STAGE5_ROOM_ID_FORCE_TEST.enabled && !KL_STAGE7_SLIDING_CROSS.enabled,
            armed: false,
            queued: 0,
            completed: 0,
            writes: 0,
            intercepts: 0,
            lastPreviousRoom: null,
            lastInterceptRoom: null,
            lastFrame: null,
            forceEntryFound: null,
            lastError: null,
            inFlight: false,
            api: typeof emu.writeMemoryReadPreviousUnlessAny === 'function'
                ? 'conditional-read-previous'
                : 'missing',
        };
        let stage7SlidingCross = {
            enabled: KL_STAGE7_SLIDING_CROSS.enabled,
            center: {x: 0, y: 0},
            generation: 0,
            attempted: false,
            done: false,
            inFlight: false,
            mapLoadPending: !!logicalMapLoadPromise,
            lastError: null,
            lastCompiled: null,
            lastTransition: null,
            lastPatchedSlots: [],
            message: KL_STAGE7_SLIDING_CROSS.enabled
                ? 'Enabled by ?stage7sliding=1; waiting to inject the first five-room physical cross.'
                : 'Disabled; add ?stage7sliding=1 to run the four-direction sliding cross proof.',
        };

        if (logicalMapLoadPromise) {
            logicalMapLoadPromise.finally(() => {
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    mapLoadPending: false,
                    done: false,
                    attempted: false,
                    message: KL_STAGE7_SLIDING_CROSS.enabled
                        ? 'Logical map load finished; waiting to inject the Stage 7 physical cross.'
                        : stage7SlidingCross.message,
                };
                renderStage7SlidingRow();
                renderStage4LogicalMap();
            });
        }

        tbody.innerHTML = KL_STAGE1.rows.map(([id, label]) => `
            <tr data-row="${id}" class="state-muted">
                <td class="field">${label}</td>
                <td class="value">...</td>
                <td class="notes">Waiting for the first completed frame.</td>
            </tr>
        `).join('');

        tbody.querySelectorAll('tr[data-row]').forEach(row => {
            rowEls.set(row.dataset.row, {
                row,
                value: row.querySelector('.value'),
                notes: row.querySelector('.notes'),
            });
        });

        const setRow = (id, value, notes, state = '') => {
            const els = rowEls.get(id);
            if (!els) return;
            els.value.textContent = value;
            els.notes.textContent = notes;
            els.row.className = state ? `state-${state}` : '';
        };

        const hexByte = value => `0x${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
        const hexWord = value => `0x${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
        const fmtByte = value => `${hexByte(value)} (${value})`;
        const fmtXYZ = (x, y, z) => `X=${fmtByte(x)}  Y=${fmtByte(y)}  Z=${fmtByte(z)}`;
        const fmtBytes = (bytes, limit = 24) => {
            if (!bytes.length) return '(none)';
            const head = bytes.slice(0, limit).map(hexByte).join(' ');
            return bytes.length > limit ? `${head} ... (${bytes.length} bytes)` : head;
        };
        const sameBytes = (a, b) => (
            a.length === b.length && a.every((value, index) => value === b[index])
        );
        const allZero = bytes => bytes.every(value => value === 0);
        const fmtNamedId = (value, names) => {
            const name = names[value] || 'unknown';
            return `${hexByte(value)} ${name}`;
        };
        const fmtPosition = value => {
            const x = value & 0x07;
            const y = (value >> 3) & 0x07;
            const z = (value >> 6) & 0x03;
            return `${hexByte(value)}=(x${x},y${y},z${z})`;
        };
        const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        })[char]);

        const readRange = async (start, end) => {
            const result = await emu.readMemory(start, end - start);
            return {
                start,
                data: result.data,
            };
        };

        const readByte = (range, addr) => {
            const index = addr - range.start;
            if (index < 0 || index >= range.data.length) return undefined;
            return range.data[index];
        };

        const decodeSize = (staticRange, selector) => {
            const addr = KL_STAGE1.roomSizeTable + selector * 3;
            return {
                addr,
                x: readByte(staticRange, addr),
                y: readByte(staticRange, addr + 1),
                z: readByte(staticRange, addr + 2),
            };
        };

        const decodeBlockGroups = (staticRange, startAddr, endAddr) => {
            const groups = [];
            const rawBytes = [];
            let cursor = startAddr;
            while (cursor < endAddr) {
                const header = readByte(staticRange, cursor);
                if (header === undefined) break;
                rawBytes.push(header);
                cursor++;

                const type = header >> 3;
                const count = (header & 0x07) + 1;
                const positions = [];
                for (let i = 0; i < count && cursor < endAddr; i++) {
                    const position = readByte(staticRange, cursor);
                    rawBytes.push(position);
                    positions.push({
                        raw: position,
                        x: position & 0x07,
                        y: (position >> 3) & 0x07,
                        z: (position >> 6) & 0x03,
                    });
                    cursor++;
                }

                groups.push({
                    addr: cursor - 1 - positions.length,
                    header,
                    type,
                    count,
                    positions,
                    truncated: positions.length !== count,
                });
            }
            return {groups, rawBytes};
        };

        const decodeLocationEntry = (staticRange, roomId) => {
            let addr = KL_STAGE1.locationStart;
            let scanned = 0;
            while (addr < KL_STAGE1.locationEnd) {
                const id = readByte(staticRange, addr);
                const entrySize = readByte(staticRange, addr + 1);
                if (id === undefined || entrySize === undefined || entrySize === 0) break;
                const nextAddr = addr + 1 + entrySize;
                if (nextAddr <= addr || nextAddr > KL_STAGE1.locationEnd) break;

                if (id === roomId) {
                    const header = readByte(staticRange, addr + 2);
                    const selector = header >> 3;
                    const attr = header & 0x07;
                    const backgrounds = [];
                    let cursor = addr + 3;
                    while (cursor < nextAddr) {
                        const value = readByte(staticRange, cursor);
                        if (value === 0xff) break;
                        backgrounds.push(value);
                        cursor++;
                    }
                    const foundBackgroundTerminator = cursor < nextAddr && readByte(staticRange, cursor) === 0xff;
                    if (foundBackgroundTerminator) cursor++;
                    const blockStart = cursor;
                    const blockData = decodeBlockGroups(staticRange, blockStart, nextAddr);

                    return {
                        addr,
                        id,
                        entrySize,
                        nextAddr,
                        scanned,
                        header,
                        selector,
                        attr,
                        backgrounds,
                        foundBackgroundTerminator,
                        blockStart,
                        blockGroups: blockData.groups,
                        blockBytes: blockData.rawBytes,
                    };
                }

                addr = nextAddr;
                scanned++;
            }
            return null;
        };

        const writeCompiledLocationTable = async compiled => {
            const capacity = KL_STAGE1.locationEnd - KL_STAGE1.locationStart;
            await emu.writeMemory(KL_STAGE1.locationStart, new Uint8Array(capacity));
            await emu.writeMemory(KL_STAGE1.locationStart, Uint8Array.from(compiled.bytes));
        };

        const renderStage5StaticMapRow = () => {
            const start = KL_STAGE1.locationStart;
            const end = KL_STAGE1.locationEnd - 1;

            if (!stage5StaticMapInjection.enabled) {
                setRow(
                    'stage5StaticMap',
                    'Disabled',
                    stage5StaticMapInjection.message,
                    'muted'
                );
                return;
            }

            if (stage5StaticMapInjection.lastError) {
                setRow(
                    'stage5StaticMap',
                    'Error',
                    stage5StaticMapInjection.lastError,
                    'bad'
                );
                return;
            }

            if (!stage5StaticMapInjection.loaded) {
                setRow(
                    'stage5StaticMap',
                    stage5StaticMapInjection.loading ? 'Loading' : 'Waiting',
                    stage5StaticMapInjection.message,
                    'warn'
                );
                return;
            }

            const compiled = stage5StaticMapInjection.compiled;
            const roomText = compiled.roomSummaries
                .map(item => `${hexByte(item.physicalRoomId)}:${item.entrySize}`)
                .join(' ');
            const value = stage5StaticMapInjection.done
                ? `Injected ${compiled.roomCount} rooms`
                : `Loaded ${compiled.roomCount} rooms`;
            const state = stage5StaticMapInjection.done ? 'ok' : 'warn';
            const action = stage5StaticMapInjection.done
                ? `Erased ${hexWord(start)}..${hexWord(end)} and wrote ${compiled.bytes.length}/${compiled.capacity} compiled bytes.`
                : `Ready to erase ${hexWord(start)}..${hexWord(end)} and write ${compiled.bytes.length}/${compiled.capacity} compiled bytes.`;
            setRow(
                'stage5StaticMap',
                value,
                `${stage5StaticMapInjection.message} ${action} Entries ${roomText}.`,
                state
            );
        };

        const loadStage5StaticMapDocument = async () => {
            if (!stage5StaticMapInjection.enabled || stage5StaticMapInjection.loading || stage5StaticMapInjection.loaded) return;
            stage5StaticMapInjection = {
                ...stage5StaticMapInjection,
                loading: true,
                message: `Loading static map from ${stage5StaticMapInjection.url}.`,
            };
            renderStage5StaticMapRow();

            try {
                const response = await fetch(stage5StaticMapInjection.url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} while loading ${stage5StaticMapInjection.url}.`);
                }
                const document = await response.json();
                const compiled = compileStaticMapDocumentToLocationTable(document);
                stage5StaticMapInjection = {
                    ...stage5StaticMapInjection,
                    loading: false,
                    loaded: true,
                    compiled,
                    message: `Loaded "${compiled.title}" from ${stage5StaticMapInjection.url}.`,
                };
            } catch (err) {
                stage5StaticMapInjection = {
                    ...stage5StaticMapInjection,
                    loading: false,
                    lastError: `Failed to prepare static map injection: ${err.message || err}`,
                };
            }
            renderStage5StaticMapRow();
        };

        const applyStage5StaticMapInjection = async () => {
            if (!stage5StaticMapInjection.enabled || stage5StaticMapInjection.done) return;
            if (!stage5StaticMapInjection.loaded || !stage5StaticMapInjection.compiled) return;

            if (typeof emu.writeMemory !== 'function') {
                stage5StaticMapInjection = {
                    ...stage5StaticMapInjection,
                    attempted: true,
                    done: false,
                    lastError: 'writeMemory is not available; cannot erase and inject the static location table.',
                };
                renderStage5StaticMapRow();
                return;
            }

            stage5StaticMapInjection = {
                ...stage5StaticMapInjection,
                attempted: true,
            };

            try {
                const compiled = stage5StaticMapInjection.compiled;
                await writeCompiledLocationTable(compiled);
                stage5StaticMapInjection = {
                    ...stage5StaticMapInjection,
                    done: true,
                    message: `Injected "${compiled.title}" into the original location table.`,
                };
            } catch (err) {
                const errorText = String(err);
                const canRetry = errorText.includes('Core is not ready');
                stage5StaticMapInjection = {
                    ...stage5StaticMapInjection,
                    attempted: !canRetry,
                    done: false,
                    lastError: canRetry
                        ? null
                        : `Failed to inject static map: ${err.message || err}`,
                    message: canRetry
                        ? 'Core was not ready for static map injection; retrying on the next sample.'
                        : stage5StaticMapInjection.message,
                };
            }
            renderStage5StaticMapRow();
        };

        const applyStage2StartRoomPoke = async () => {
            if (stage2StartPoke.attempted) return;
            if (typeof emu.writeMemory !== 'function') {
                stage2StartPoke = {
                    attempted: true,
                    done: false,
                    message: 'writeMemory is not available; reload the versioned Stage 2 bundle.',
                };
                return;
            }

            stage2StartPoke.attempted = true;
            try {
                await emu.writeMemory(
                    KL_STAGE2.startLocationsAddr,
                    Uint8Array.from(KL_STAGE2.startLocationsPatched)
                );
                stage2StartPoke = {
                    attempted: true,
                    done: true,
                    message: `Patched start_locations ${hexWord(KL_STAGE2.startLocationsAddr)}..${hexWord(KL_STAGE2.startLocationsAddr + KL_STAGE2.startLocationsPatched.length - 1)} to ${fmtBytes(KL_STAGE2.startLocationsPatched)}.`,
                };
            } catch (err) {
                const errorText = String(err);
                const canRetry = errorText.includes('Core is not ready');
                stage2StartPoke = {
                    attempted: !canRetry,
                    done: false,
                    message: canRetry
                        ? 'Core was not ready for the start_locations patch; retrying on the next sample.'
                        : `Failed to patch start_locations: ${err}`,
                };
            }
        };

        const applyStage2RoomCleanPatch = async () => {
            if (stage2RoomCleanPatch.attempted) return;
            if (typeof emu.writeMemory !== 'function') {
                stage2RoomCleanPatch = {
                    attempted: true,
                    done: false,
                    message: 'writeMemory is not available; cannot clean room 0x88.',
                };
                return;
            }

            stage2RoomCleanPatch.attempted = true;
            try {
                for (const patch of KL_STAGE2.cleanRoomPatches) {
                    await emu.writeMemory(patch.addr, new Uint8Array(patch.length));
                }
                stage2RoomCleanPatch = {
                    attempted: true,
                    done: true,
                    message: `Cleaned wizard, cauldron, and cauldron-bubble data for room ${hexByte(KL_STAGE2.centerRoom)}.`,
                };
            } catch (err) {
                const errorText = String(err);
                const canRetry = errorText.includes('Core is not ready');
                stage2RoomCleanPatch = {
                    attempted: !canRetry,
                    done: false,
                    message: canRetry
                        ? 'Core was not ready for the room-clean patch; retrying on the next sample.'
                        : `Failed to clean room ${hexByte(KL_STAGE2.centerRoom)}: ${err}`,
                };
            }
        };

        const applyStage3OneRoomInjectionTest = async () => {
            if (stage5StaticMapInjection.enabled || stage7SlidingCross.enabled) return;
            if (!KL_STAGE3_ONE_ROOM_INJECTION_TEST.enabled || stage3OneRoomInjectionTest.attempted) return;
            if (typeof emu.writeMemory !== 'function') {
                stage3OneRoomInjectionTest = {
                    attempted: true,
                    done: false,
                    message: 'writeMemory is not available; cannot apply Stage 3 one-room injection test.',
                };
                return;
            }

            stage3OneRoomInjectionTest.attempted = true;
            try {
                await emu.writeMemory(
                    KL_STAGE3_ONE_ROOM_INJECTION_TEST.entryAddr,
                    Uint8Array.from(KL_STAGE3_ONE_ROOM_INJECTION_TEST.testEntryBytes)
                );
                stage3OneRoomInjectionTest = {
                    attempted: true,
                    done: true,
                    message: `Stage 3 test rewrote room ${hexByte(KL_STAGE3_ONE_ROOM_INJECTION_TEST.targetRoom)} at ${hexWord(KL_STAGE3_ONE_ROOM_INJECTION_TEST.entryAddr)} while preserving entry size; start a new game or force room reload before expecting the Spectrum view to change.`,
                };
            } catch (err) {
                const errorText = String(err);
                const canRetry = errorText.includes('Core is not ready');
                stage3OneRoomInjectionTest = {
                    attempted: !canRetry,
                    done: false,
                    message: canRetry
                        ? 'Core was not ready for the Stage 3 one-room injection test; retrying on the next sample.'
                        : `Failed Stage 3 one-room injection test: ${err}`,
                };
            }
        };

        const formatArchSummary = entry => {
            if (!entry) return 'missing';
            const arches = [
                ['N', 0x00, 0x04],
                ['E', 0x01, 0x05],
                ['S', 0x02, 0x06],
                ['W', 0x03, 0x07],
            ];
            return arches.map(([label, stoneId, treeId]) => {
                if (entry.backgrounds.includes(stoneId)) return `${label}:arch`;
                if (entry.backgrounds.includes(treeId)) return `${label}:tree`;
                return `${label}:-`;
            }).join(' ');
        };

        const countCardinalArches = entry => {
            if (!entry) return 0;
            const pairs = [[0x00, 0x04], [0x01, 0x05], [0x02, 0x06], [0x03, 0x07]];
            return pairs.reduce((count, pair) => (
                count + (entry.backgrounds.includes(pair[0]) || entry.backgrounds.includes(pair[1]) ? 1 : 0)
            ), 0);
        };

        const formatBlockGroupSummary = entry => {
            if (!entry || !entry.blockGroups.length) return 'none';
            return entry.blockGroups.map(group => {
                const name = KL_BLOCK_NAMES[group.type] || 'unknown';
                return `${hexByte(group.type)} ${name}: ${group.count}`;
            }).join('; ');
        };

        const renderStage2Cross = (staticRange, sample) => {
            if (!crossTbody || !stage2Status) return;

            const decoded = KL_STAGE2.crossRooms.map(room => {
                const entry = decodeLocationEntry(staticRange, room.id);
                const size = entry ? decodeSize(staticRange, entry.selector) : null;
                return {...room, entry, size};
            });
            const foundCount = decoded.filter(item => item.entry).length;
            const center = decoded.find(item => item.role === 'center');
            const centerArchCount = countCardinalArches(center && center.entry);
            const centerArchCapacity = !!(center && center.entry && center.entry.backgrounds.length >= 4);
            const startLocationBytes = sample.startLocations || [];
            const startLocationPatchOk = sameBytes(startLocationBytes, KL_STAGE2.startLocationsPatched);
            const cleanReadback = sample.cleanRoomPatches || [];
            const cleanPatchOk = cleanReadback.length === KL_STAGE2.cleanRoomPatches.length &&
                cleanReadback.every(item => allZero(item.bytes));
            const cleanSummary = cleanReadback.length
                ? cleanReadback.map(item => `${item.label}: ${allZero(item.bytes) ? 'zeroed' : 'not zeroed'}`).join('; ')
                : 'waiting for clean readback';

            stage2Status.textContent = [
                stage2StartPoke.message,
                stage2RoomCleanPatch.message,
                stage3OneRoomInjectionTest.message,
                `start_locations now: ${fmtBytes(startLocationBytes)}${startLocationPatchOk ? ' OK' : ' not patched yet'}.`,
                `Room clean readback: ${cleanSummary}${cleanPatchOk ? ' OK' : ''}.`,
                `Entries found: ${foundCount}/5.`,
                `Live 0x5C10: ${hexByte(sample.room0)}.`,
                `Center exits currently present: ${centerArchCount}/4.`,
                centerArchCapacity
                    ? 'Four cardinal arch ids fit in the center entry background-list capacity.'
                    : 'Center entry does not currently expose four background slots without moving the terminator.',
                'Diagonal/corner entries are not part of the load-then-renumber cardinal model.',
                `Diagnostics build: ${KL_DIAGNOSTICS_BUILD}.`,
            ].join(' ');

            crossTbody.innerHTML = decoded.map(item => {
                const entry = item.entry;
                const size = item.size;
                const found = !!entry;
                const isCenter = item.role === 'center';
                const archCount = countCardinalArches(entry);
                let state = found ? 'ok' : 'bad';
                let status = found
                    ? `retrieve_screen scan can find this entry after ${entry.scanned} entries.`
                    : 'Entry not found by location-table scan.';
                if (found && isCenter && archCount < 4) {
                    state = centerArchCapacity ? 'warn' : 'bad';
                    status = centerArchCapacity
                        ? `Center has ${archCount}/4 cardinal arches now; fixed-size arch rewrite appears possible.`
                        : `Center has ${archCount}/4 cardinal arches now; fixed-size arch rewrite needs more capacity analysis.`;
                } else if (found && isCenter && cleanPatchOk && (
                    entry.backgrounds.includes(0x12) || entry.backgrounds.includes(0x13)
                )) {
                    status += ' Wizard/cauldron ids remain in the compact entry but expand to null records.';
                }

                return `
                    <tr class="state-${state}">
                        <td>${item.role}</td>
                        <td>${hexByte(item.id)}</td>
                        <td>${found ? `${hexWord(entry.addr)}..${hexWord(entry.nextAddr - 1)}` : 'not found'}</td>
                        <td>${found ? `${hexByte(entry.header)} sel ${entry.selector} attr ${entry.attr}` : '-'}</td>
                        <td>${size ? `${size.x}/${size.y}/${size.z}` : '-'}</td>
                        <td>${found ? `bg ${entry.backgrounds.length}; groups ${entry.blockGroups.length}; ${formatBlockGroupSummary(entry)}` : '-'}</td>
                        <td>${formatArchSummary(entry)}</td>
                        <td>${status}</td>
                    </tr>
                `;
            }).join('');
        };

        const formatLogicalExits = room => (
            KL_DIRECTIONS.map(direction => (
                `${direction[0].toUpperCase()}:${room.exits[direction] ? room.exits[direction] : '-'}`
            )).join(' ')
        );

        const formatLogicalBlocks = room => {
            if (!room.blocks.length) return 'none';
            return room.blocks.map(block => {
                const name = KL_BLOCK_NAMES[block.type] || 'unknown';
                return `${hexByte(block.type)} ${name}: ${block.positions.length}`;
            }).join('; ');
        };

        const renderStage4LogicalMap = () => {
            if (!logicalTbody || !stage4Status) return;

            const rows = KL_STAGE4.sampleQueries.map(query => {
                const room = logicalMap.getRoomAt(query.x, query.y);
                const compiled = logicalMap.compileRoom(room, KL_STAGE4.compileProbeRoom);
                const backgroundSummary = room.backgrounds.map(value => fmtNamedId(value, KL_BACKGROUND_NAMES)).join('; ');
                const byteSummary = compiled.valid ? fmtBytes(compiled.bytes, 28) : compiled.errors.join('; ');
                const state = compiled.valid ? 'ok' : 'bad';

                return `
                    <tr class="state-${state}">
                        <td>${escapeHtml(query.label)}</td>
                        <td>${escapeHtml(room.label)}</td>
                        <td>(${room.coord.x}, ${room.coord.y})</td>
                        <td>${escapeHtml(room.source)}</td>
                        <td>sel ${room.size.selector}; ${room.size.x}/${room.size.y}/${room.size.z}; attr ${room.colour}</td>
                        <td>${escapeHtml(formatLogicalExits(room))}</td>
                        <td>${escapeHtml(backgroundSummary)}</td>
                        <td>${escapeHtml(formatLogicalBlocks(room))}</td>
                        <td>${escapeHtml(byteSummary)}</td>
                        <td>${escapeHtml(compiled.valid ? `valid; entry size ${compiled.entrySize}; state rev ${room.state.revision}` : 'invalid')}</td>
                    </tr>
                `;
            }).join('');
            const stats = logicalMap.stats();

            stage4Status.textContent = [
                logicalMapLoadStatus.message,
                `Coordinate convention: ${KL_STAGE4.coordinateConvention}.`,
                `Document: ${stats.activeDocument.title}.`,
                `Authored rooms: ${stats.authoredRooms}; labels: ${stats.labels}; generated cache: ${stats.generatedRooms}; persistent states: ${stats.persistentRooms}.`,
                `Procedural: ${stats.procedural.algorithm}; seed ${stats.procedural.worldSeed}; chunk ${stats.procedural.chunkSize}x${stats.procedural.chunkSize}; chunks ${stats.procedural.generatedChunks}.`,
                'Probe APIs: window.KnightLoreInfinity.logicalMap.getRoomAt(12, -4), getRoomByLabel("0x88"), loadLogicalMapFromUrl("maps/knight-lore-original-map.json").',
            ].join(' ');

            logicalTbody.innerHTML = rows;
        };

        const describeDirection = (fromRoom, toRoom) => {
            if ((fromRoom & 0xf0) === (toRoom & 0xf0)) {
                if (((fromRoom - 1) & 0x0f) === (toRoom & 0x0f)) return 'west';
                if (((fromRoom + 1) & 0x0f) === (toRoom & 0x0f)) return 'east';
            }
            if (((fromRoom + 0x10) & 0xff) === toRoom) return 'north';
            if (((fromRoom - 0x10) & 0xff) === toRoom) return 'south';
            const delta = ((toRoom - fromRoom + 0x80) & 0xff) - 0x80;
            return `unknown delta ${delta}`;
        };

        const fmtLogicalCoord = coord => `(${coord.x}, ${coord.y})`;

        const getStage7PhysicalRole = roomId => (
            KL_STAGE7_SLIDING_CROSS.physicalCross.find(item => item.id === roomId) || null
        );

        const collectStage7RoomIdPatchAddrs = (workRange, fromRoom) => {
            const addrs = [];
            const firstRoomAddr = KL_STAGE7_SLIDING_CROSS.slotStart + KL_STAGE7_SLIDING_CROSS.slotRoomOffset;
            for (
                let addr = firstRoomAddr;
                addr < KL_STAGE7_SLIDING_CROSS.slotEnd;
                addr += KL_STAGE7_SLIDING_CROSS.slotSize
            ) {
                if (readByte(workRange, addr) === fromRoom) addrs.push(addr);
            }
            return addrs;
        };

        const formatStage7Mapping = compiled => {
            if (!compiled) return 'No physical cross has been injected yet.';
            return compiled.roomSummaries.map(item => (
                `${item.role} ${hexByte(item.physicalRoomId)}=${fmtLogicalCoord(item.logicalCoord)} ${item.label}`
            )).join('; ');
        };

        const formatStage7ReciprocalAdjustments = compiled => {
            if (!compiled) return 'Reciprocal exit overlay has not compiled yet.';
            const adjustments = compiled.roomSummaries.flatMap(item => (
                (item.reciprocalExitAdjustments || []).map(adjustment => (
                    `${item.label} ${adjustment.type} ${adjustment.direction} (${adjustment.reason})`
                ))
            ));
            if (!adjustments.length) return 'Reciprocal exit overlay: no changes needed for this cross.';
            const head = adjustments.slice(0, 4).join('; ');
            const tail = adjustments.length > 4 ? `; +${adjustments.length - 4} more` : '';
            return `Reciprocal exit overlay: ${head}${tail}.`;
        };

        const renderStage7SlidingRow = () => {
            if (!stage7SlidingCross.enabled) {
                setRow(
                    'stage7Sliding',
                    'Disabled',
                    stage7SlidingCross.message,
                    'muted'
                );
                return;
            }

            if (stage7SlidingCross.lastError) {
                setRow(
                    'stage7Sliding',
                    'Error',
                    stage7SlidingCross.lastError,
                    'bad'
                );
                return;
            }

            if (stage7SlidingCross.mapLoadPending) {
                setRow(
                    'stage7Sliding',
                    'Waiting for logical map',
                    `${stage7SlidingCross.message} The physical cross will not be written until the optional ?map= JSON load settles.`,
                    'warn'
                );
                return;
            }

            if (logicalMapLoadStatus.attempted && !logicalMapLoadStatus.done) {
                setRow(
                    'stage7Sliding',
                    'Logical map unavailable',
                    `${logicalMapLoadStatus.message} Stage 7 is paused to avoid compiling the wrong room set.`,
                    'bad'
                );
                return;
            }

            const transition = stage7SlidingCross.lastTransition
                ? ` Last transition ${stage7SlidingCross.lastTransition.direction} via ${hexByte(stage7SlidingCross.lastTransition.viaPhysicalRoom)}: ${fmtLogicalCoord(stage7SlidingCross.lastTransition.previousCenter)} -> ${fmtLogicalCoord(stage7SlidingCross.lastTransition.newCenter)}.`
                : ' No recenter transition has been observed yet.';
            const patched = stage7SlidingCross.lastPatchedSlots.length
                ? ` Patched ${stage7SlidingCross.lastPatchedSlots.length} slot room byte(s): ${stage7SlidingCross.lastPatchedSlots.map(hexWord).join(' ')}.`
                : ' No working-memory slot patch has been needed yet.';
            const state = stage7SlidingCross.done ? 'ok' : 'warn';

            setRow(
                'stage7Sliding',
                `Center ${fmtLogicalCoord(stage7SlidingCross.center)}; gen ${stage7SlidingCross.generation}`,
                `${stage7SlidingCross.message} ${formatStage7Mapping(stage7SlidingCross.lastCompiled)} ${formatStage7ReciprocalAdjustments(stage7SlidingCross.lastCompiled)}${transition}${patched}`,
                state
            );
        };

        const applyStage7CrossInjection = async reason => {
            if (!stage7SlidingCross.enabled || stage7SlidingCross.inFlight || stage7SlidingCross.done) return;
            if (stage7SlidingCross.mapLoadPending) {
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    message: 'Waiting for the logical map JSON load before injecting the five-room physical cross.',
                };
                renderStage7SlidingRow();
                return;
            }
            if (logicalMapLoadStatus.attempted && !logicalMapLoadStatus.done) {
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    lastError: logicalMapLoadStatus.message,
                };
                renderStage7SlidingRow();
                return;
            }
            if (typeof emu.writeMemory !== 'function') {
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    attempted: true,
                    done: false,
                    lastError: 'writeMemory is not available; cannot erase and inject the Stage 7 physical cross.',
                };
                renderStage7SlidingRow();
                return;
            }

            stage7SlidingCross = {
                ...stage7SlidingCross,
                attempted: true,
                inFlight: true,
                message: `${reason}; compiling the five-room physical cross.`,
            };
            renderStage7SlidingRow();

            try {
                const compiled = compileStage7SlidingCrossToLocationTable(stage7SlidingCross.center);
                await writeCompiledLocationTable(compiled);
                logicalMap.markVisited(stage7SlidingCross.center.x, stage7SlidingCross.center.y);
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    done: true,
                    inFlight: false,
                    lastError: null,
                    lastCompiled: compiled,
                    generation: stage7SlidingCross.generation + 1,
                    message: `${reason}; erased ${hexWord(KL_STAGE1.locationStart)}..${hexWord(KL_STAGE1.locationEnd - 1)} and wrote ${compiled.bytes.length}/${compiled.capacity} bytes.`,
                };
            } catch (err) {
                const errorText = String(err);
                const canRetry = errorText.includes('Core is not ready');
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    attempted: !canRetry,
                    done: false,
                    inFlight: false,
                    lastError: canRetry
                        ? null
                        : `Failed Stage 7 physical cross injection: ${err.message || err}`,
                    message: canRetry
                        ? 'Core was not ready for Stage 7 physical cross injection; retrying on the next sample.'
                        : stage7SlidingCross.message,
                };
            }
            renderStage7SlidingRow();
        };

        const patchStage7WorkingRoomIds = async (workRange, fromRoom) => {
            const addrs = collectStage7RoomIdPatchAddrs(workRange, fromRoom);
            for (const addr of addrs) {
                await emu.writeMemory(addr, Uint8Array.from([KL_STAGE7_SLIDING_CROSS.centerRoom]));
            }
            return addrs;
        };

        const handleStage7SlidingTransition = async (sample, workRange) => {
            if (!stage7SlidingCross.enabled || !stage7SlidingCross.done) return null;
            if (sample.room0 === KL_STAGE7_SLIDING_CROSS.centerRoom) return null;

            const physical = getStage7PhysicalRole(sample.room0);
            if (!physical || physical.role === 'center') return null;

            const direction = physical.role;
            const delta = KL_STAGE7_SLIDING_CROSS.directionDeltas[direction];
            if (!delta) return null;

            const previousCenter = {...stage7SlidingCross.center};
            const newCenter = {
                x: previousCenter.x + delta.x,
                y: previousCenter.y + delta.y,
            };

            stage7SlidingCross = {
                ...stage7SlidingCross,
                center: newCenter,
                done: false,
                lastTransition: {
                    frame: frameCompletedCount,
                    sample: sampleCount,
                    source: sample.source,
                    direction,
                    viaPhysicalRoom: sample.room0,
                    previousCenter,
                    newCenter,
                },
                lastPatchedSlots: [],
                message: `Detected ${direction} transition through physical ${hexByte(sample.room0)}; refreshing the cross around ${fmtLogicalCoord(newCenter)}.`,
            };
            renderStage7SlidingRow();

            await applyStage7CrossInjection(`Recentered ${direction} to ${fmtLogicalCoord(newCenter)}`);
            if (!stage7SlidingCross.done || stage7SlidingCross.lastError) return null;

            const patchedSlots = await patchStage7WorkingRoomIds(workRange, sample.room0);
            stage7SlidingCross = {
                ...stage7SlidingCross,
                lastPatchedSlots: patchedSlots,
                message: `${stage7SlidingCross.message} Rewrote room ids from ${hexByte(sample.room0)} back to ${hexByte(KL_STAGE7_SLIDING_CROSS.centerRoom)} in working memory.`,
            };
            renderStage7SlidingRow();

            return {
                recentered: true,
                direction,
                fromRoom: sample.room0,
                previousCenter,
                newCenter,
                patchedSlots,
            };
        };

        const renderStage5RecenterRow = () => {
            const center = KL_STAGE5_ROOM_ID_FORCE_TEST.centerRoom;
            const forceRoom = KL_STAGE5_ROOM_ID_FORCE_TEST.forceRoom;
            const addr = KL_STAGE5_ROOM_ID_FORCE_TEST.currentRoomAddr;

            if (!stage5RoomIdRecenterTest.enabled) {
                setRow(
                    'stage5Recenter',
                    'Disabled',
                    KL_STAGE7_SLIDING_CROSS.enabled
                        ? 'Suppressed while Stage 7 sliding cross is active.'
                        : `Add ?stage5force=0x78, ?stage5force=0x98, or ?stage5test=1 to override only ${hexWord(addr)} after each drawn frame.`,
                    'muted'
                );
                return;
            }

            if (KL_STAGE5_ROOM_ID_FORCE_TEST.configError) {
                setRow(
                    'stage5Recenter',
                    'Invalid force target',
                    KL_STAGE5_ROOM_ID_FORCE_TEST.configError,
                    'bad'
                );
                return;
            }

            if (stage5RoomIdRecenterTest.api === 'missing') {
                setRow(
                    'stage5Recenter',
                    'Missing conditional poke',
                    'This JSSpeccy bundle cannot run the conditional read-previous/poke command; rebuild and refresh before running Stage 5.',
                    'bad'
                );
                return;
            }

            if (stage5RoomIdRecenterTest.lastError) {
                setRow(
                    'stage5Recenter',
                    'Error',
                    stage5RoomIdRecenterTest.lastError,
                    'bad'
                );
                return;
            }

            if (stage5RoomIdRecenterTest.forceEntryFound === false) {
                setRow(
                    'stage5Recenter',
                    `Invalid target ${hexByte(forceRoom)}`,
                    `No location-table entry was found for forced room ${hexByte(forceRoom)}, so the experiment is not armed.`,
                    'bad'
                );
                return;
            }

            if (!stage5RoomIdRecenterTest.armed) {
                setRow(
                    'stage5Recenter',
                    'Enabled; waiting to arm',
                    `Target ${hexByte(forceRoom)}. The conditional poke starts only after the sampler sees stable ${hexWord(addr)} = ${hexByte(center)} and confirms the target has a location entry.`,
                    'warn'
                );
                return;
            }

            const previousText = stage5RoomIdRecenterTest.lastPreviousRoom === null
                ? 'none yet'
                : `${hexByte(stage5RoomIdRecenterTest.lastPreviousRoom)} -> ${hexByte(forceRoom)}`;
            const interceptText = stage5RoomIdRecenterTest.lastInterceptRoom === null
                ? 'No destination override has been needed yet.'
                : `Last overridden room byte was ${hexByte(stage5RoomIdRecenterTest.lastInterceptRoom)} (${describeDirection(center, stage5RoomIdRecenterTest.lastInterceptRoom)} from center).`;
            const pendingText = stage5RoomIdRecenterTest.inFlight ? ' One poke is still awaiting acknowledgement.' : '';

            setRow(
                'stage5Recenter',
                `Force ${hexByte(forceRoom)}; last ${previousText}`,
                `Conditional read-previous/poke. Completed ${stage5RoomIdRecenterTest.completed}/${stage5RoomIdRecenterTest.queued} post-draw checks; writes ${stage5RoomIdRecenterTest.writes}; destination overrides ${stage5RoomIdRecenterTest.intercepts}. ${interceptText} Skips writes while ${hexWord(addr)} is ${hexByte(center)} or already ${hexByte(forceRoom)}. Only ${hexWord(addr)} is changed; object slots are deliberately untouched.${pendingText}`,
                stage5RoomIdRecenterTest.intercepts ? 'ok' : 'warn'
            );
        };

        const queueStage5RoomIdRecenterAfterDraw = () => {
            if (
                !stage5RoomIdRecenterTest.enabled ||
                KL_STAGE5_ROOM_ID_FORCE_TEST.configError ||
                stage5RoomIdRecenterTest.forceEntryFound === false ||
                !stage5RoomIdRecenterTest.armed ||
                stage5RoomIdRecenterTest.inFlight
            ) return;
            if (stage5RoomIdRecenterTest.api === 'missing') {
                renderStage5RecenterRow();
                return;
            }

            const center = KL_STAGE5_ROOM_ID_FORCE_TEST.centerRoom;
            const forceRoom = KL_STAGE5_ROOM_ID_FORCE_TEST.forceRoom;
            const addr = KL_STAGE5_ROOM_ID_FORCE_TEST.currentRoomAddr;
            const skipRooms = Array.from(new Set([center, forceRoom]));
            stage5RoomIdRecenterTest = {
                ...stage5RoomIdRecenterTest,
                queued: stage5RoomIdRecenterTest.queued + 1,
                lastFrame: frameCompletedCount + 1,
                inFlight: true,
            };
            renderStage5RecenterRow();

            const writePromise = emu.writeMemoryReadPreviousUnlessAny(
                addr,
                Uint8Array.from([forceRoom]),
                skipRooms
            );

            writePromise.then(result => {
                const previousData = result && result.previousData ? Array.from(result.previousData) : [];
                const previousRoom = previousData.length ? previousData[0] : null;
                const didWrite = !!(result && result.didWrite);
                const wasDestinationOverride = didWrite && previousRoom !== forceRoom;
                stage5RoomIdRecenterTest = {
                    ...stage5RoomIdRecenterTest,
                    completed: stage5RoomIdRecenterTest.completed + 1,
                    writes: stage5RoomIdRecenterTest.writes + (didWrite ? 1 : 0),
                    intercepts: stage5RoomIdRecenterTest.intercepts + (wasDestinationOverride ? 1 : 0),
                    lastPreviousRoom: previousRoom,
                    lastInterceptRoom: wasDestinationOverride
                        ? previousRoom
                        : stage5RoomIdRecenterTest.lastInterceptRoom,
                    lastError: null,
                    inFlight: false,
                };
                renderStage5RecenterRow();
            }).catch(err => {
                stage5RoomIdRecenterTest = {
                    ...stage5RoomIdRecenterTest,
                    lastError: `Failed Stage 5 room-id force poke: ${err}`,
                    inFlight: false,
                };
                renderStage5RecenterRow();
            });
        };

        const armStage5RoomIdRecenterWhenStable = sample => {
            if (!stage5RoomIdRecenterTest.enabled || stage5RoomIdRecenterTest.armed) return;
            if (
                stage5RoomIdRecenterTest.forceEntryFound &&
                sample.room0 === KL_STAGE5_ROOM_ID_FORCE_TEST.centerRoom &&
                sample.attrOk &&
                sample.sizeOk
            ) {
                stage5RoomIdRecenterTest = {
                    ...stage5RoomIdRecenterTest,
                    armed: true,
                };
            }
        };

        const updateTransition = sample => {
            if (!previousSample || previousSample.room0 === sample.room0) return;
            const direction = describeDirection(previousSample.room0, sample.room0);
            lastTransition = {
                sample: sampleCount,
                frame: frameCompletedCount,
                source: sample.source,
                fromRoom: previousSample.room0,
                toRoom: sample.room0,
                fromRoom1: previousSample.room1,
                toRoom1: sample.room1,
                direction,
                body: sample.body,
                flags0: sample.flags0,
                fieldsStable: sample.attrOk && sample.sizeOk,
            };
        };

        const renderTransitionRows = () => {
            if (!lastTransition) {
                setRow(
                    'transition',
                    'No transition observed yet',
                    'Walk through a normal exit; this row records the first post-frame room-id change.',
                    'muted'
                );
                setRow(
                    'timing',
                    'Waiting',
                    'No timing conclusion until a room-id change is seen at frameCompleted.',
                    'muted'
                );
                return;
            }

            const tr = lastTransition;
            const pair = `${hexByte(tr.fromRoom)} -> ${hexByte(tr.toRoom)}`;
            const body = fmtXYZ(tr.body.x, tr.body.y, tr.body.z);
            const eventLabel = tr.source === 'frameCompleted'
                ? `frameCompleted ${tr.frame}`
                : `sample ${tr.sample}`;
            setRow(
                'transition',
                `${eventLabel}: ${pair}`,
                `${tr.direction}; 0x5C30 observed ${hexByte(tr.fromRoom1)} -> ${hexByte(tr.toRoom1)}; body ${body}; slot +12 ${hexByte(tr.flags0)}; source ${tr.source}.`,
                tr.fieldsStable ? 'ok' : 'warn'
            );

            if (tr.source !== 'frameCompleted') {
                setRow(
                    'timing',
                    'Fallback sample only',
                    'A transition was observed, but not through the frameCompleted event, so this cannot judge whether frameCompleted is too late.',
                    'warn'
                );
            } else if (tr.fieldsStable) {
                setRow(
                    'timing',
                    'Too late for pre-load rewrite',
                    'At frameCompleted the new room id and decoded work fields already agree, so use an earlier hook for invisible recentering.',
                    'warn'
                );
            } else {
                setRow(
                    'timing',
                    'Post-frame transition seen',
                    'The room id changed, but the decoded work fields were not stable in that sample; keep watching and add a finer hook if needed.',
                    'warn'
                );
            }
        };

        const sample = async (source = 'manual') => {
            if (sampleInFlight) return;
            if (!emu.readMemory) {
                setRow(
                    'sampler',
                    'Missing readMemory',
                    'The loaded JSSpeccy bundle is stale or was not rebuilt; refresh the page after this patch.',
                    'bad'
                );
                return;
            }
            sampleInFlight = true;
            sampleCount++;
            if (source === 'frameCompleted') {
                frameCompletedCount++;
            }

            try {
                await applyStage2StartRoomPoke();
                await applyStage2RoomCleanPatch();
                await applyStage5StaticMapInjection();
                // Dormant by default. Open index.html?stage3test=1 to run
                // this fixed-size one-room injection before the next
                // retrieve_screen rebuild.
                await applyStage3OneRoomInjectionTest();
                await applyStage7CrossInjection('Initial Stage 7 physical cross injection');

                const readDiagnosticSnapshot = async () => {
                    const [workRange, staticRange, startLocationsRange, ...cleanRoomRanges] = await Promise.all([
                        readRange(KL_STAGE1.workStart, KL_STAGE1.workEnd),
                        readRange(KL_STAGE1.staticStart, KL_STAGE1.staticEnd),
                        readRange(
                            KL_STAGE2.startLocationsAddr,
                            KL_STAGE2.startLocationsAddr + KL_STAGE2.startLocationsPatched.length
                        ),
                        ...KL_STAGE2.cleanRoomPatches.map(patch => (
                            readRange(patch.addr, patch.addr + patch.length)
                        )),
                    ]);

                    return {
                        workRange,
                        staticRange,
                        sample: {
                            source,
                            room0: readByte(workRange, 0x5c10),
                            room1: readByte(workRange, 0x5c30),
                            body: {
                                x: readByte(workRange, 0x5c09),
                                y: readByte(workRange, 0x5c0a),
                                z: readByte(workRange, 0x5c0b),
                            },
                            head: {
                                x: readByte(workRange, 0x5c29),
                                y: readByte(workRange, 0x5c2a),
                                z: readByte(workRange, 0x5c2b),
                            },
                            flags0: readByte(workRange, 0x5c14),
                            flags1: readByte(workRange, 0x5c34),
                            sizeX: readByte(workRange, 0x5bab),
                            sizeY: readByte(workRange, 0x5bac),
                            attrWork: readByte(workRange, 0x5bad),
                            sizeZ: readByte(workRange, 0x5bae),
                            startLocations: Array.from(startLocationsRange.data),
                            cleanRoomPatches: cleanRoomRanges.map((range, index) => ({
                                ...KL_STAGE2.cleanRoomPatches[index],
                                bytes: Array.from(range.data),
                            })),
                        },
                    };
                };

                let {workRange, staticRange, sample} = await readDiagnosticSnapshot();
                let stage7Action = null;

                if (stage7SlidingCross.enabled) {
                    const preRecenterEntry = decodeLocationEntry(staticRange, sample.room0);
                    sample.attrOk = false;
                    sample.sizeOk = false;
                    if (preRecenterEntry) {
                        const preRecenterSize = decodeSize(staticRange, preRecenterEntry.selector);
                        sample.attrOk = (sample.attrWork & 0x07) === preRecenterEntry.attr;
                        sample.sizeOk = (
                            preRecenterSize.x === sample.sizeX &&
                            preRecenterSize.y === sample.sizeY &&
                            preRecenterSize.z === sample.sizeZ
                        );
                    }
                    updateTransition(sample);
                    stage7Action = await handleStage7SlidingTransition(sample, workRange);
                    if (stage7Action && stage7Action.recentered) {
                        ({workRange, staticRange, sample} = await readDiagnosticSnapshot());
                        sample.stage7Action = stage7Action;
                    }
                }

                const entry = decodeLocationEntry(staticRange, sample.room0);
                if (stage5RoomIdRecenterTest.enabled && !KL_STAGE5_ROOM_ID_FORCE_TEST.configError) {
                    const forceEntry = decodeLocationEntry(staticRange, KL_STAGE5_ROOM_ID_FORCE_TEST.forceRoom);
                    stage5RoomIdRecenterTest = {
                        ...stage5RoomIdRecenterTest,
                        forceEntryFound: !!forceEntry,
                    };
                }
                let decodedSize = null;
                sample.attrOk = false;
                sample.sizeOk = false;

                if (entry) {
                    decodedSize = decodeSize(staticRange, entry.selector);
                    sample.attrOk = (sample.attrWork & 0x07) === entry.attr;
                    sample.sizeOk = (
                        decodedSize.x === sample.sizeX &&
                        decodedSize.y === sample.sizeY &&
                        decodedSize.z === sample.sizeZ
                    );
                }

                if (!stage7SlidingCross.enabled) updateTransition(sample);
                armStage5RoomIdRecenterWhenStable(sample);

                setRow(
                    'sampler',
                    'Read-only',
                    source === 'frameCompleted'
                        ? 'Memory sampled after the host frameCompleted event; Stage 2 may patch static data once, with no renderer changes.'
                        : `Memory sampled by ${source} fallback; Stage 2 may patch static data once, with no renderer changes.`,
                    source === 'frameCompleted' ? 'ok' : 'warn'
                );
                setRow(
                    'frame',
                    `samples=${sampleCount}  frameCompleted=${frameCompletedCount}`,
                    `Last source: ${source}; ranges ${hexWord(KL_STAGE1.workStart)}..${hexWord(KL_STAGE1.workEnd - 1)} and ${hexWord(KL_STAGE1.staticStart)}..${hexWord(KL_STAGE1.staticEnd - 1)}.`,
                    frameCompletedCount > 0 ? 'ok' : 'warn'
                );
                setRow(
                    'currentRoom',
                    hexByte(sample.room0),
                    `Authoritative current location for Stage 1. The Stage 2 start_locations patch affects the next game start; it does not force an already-running room.`,
                    'ok'
                );
                setRow(
                    'secondaryRoom',
                    hexByte(sample.room1),
                    'Observed slot 1 +8 value. This often does not follow room transitions, so it is not used as current-location truth.',
                    sample.room0 === sample.room1 ? 'ok' : 'warn'
                );
                setRow(
                    'playerBody',
                    fmtXYZ(sample.body.x, sample.body.y, sample.body.z),
                    '0x5C09, 0x5C0A, 0x5C0B.',
                    'ok'
                );
                setRow(
                    'playerHead',
                    fmtXYZ(sample.head.x, sample.head.y, sample.head.z),
                    '0x5C29, 0x5C2A, 0x5C2B.',
                    'ok'
                );
                setRow(
                    'slotFlags',
                    `0x5C14=${hexByte(sample.flags0)}  0x5C34=${hexByte(sample.flags1)}`,
                    `High nibbles ${hexByte(sample.flags0 & 0xf0)} / ${hexByte(sample.flags1 & 0xf0)}; transition entry counter is expected around 0x30.`,
                    (sample.flags0 & 0x30) || (sample.flags1 & 0x30) ? 'warn' : 'ok'
                );
                setRow(
                    'workRoom',
                    `X=${fmtByte(sample.sizeX)}  Y=${fmtByte(sample.sizeY)}  Attr=${hexByte(sample.attrWork)}  Z=${fmtByte(sample.sizeZ)}`,
                    'Raw room work bytes at 0x5BAB, 0x5BAC, 0x5BAD, 0x5BAE.',
                    'ok'
                );
                setRow(
                    'locationFormat',
                    'id, size, size/attr, backgrounds..., 0xFF, block/count groups',
                    'Icemark 0x6251 locations format: byte 0 id, byte 1 entry size, byte 2 selector+attribute, then background ids and packed block data.',
                    'ok'
                );

                if (!entry) {
                    setRow('entry', 'Not found', `No location table entry matched ${hexByte(sample.room0)}.`, 'bad');
                    setRow('entryHeader', 'Not found', 'Cannot decode selector or attribute.', 'bad');
                    setRow('backgrounds', 'Not found', 'Cannot list background ids.', 'bad');
                    setRow('blockGroups', 'Not found', 'Cannot decode block/count groups.', 'bad');
                    setRow('blockPositions', 'Not found', 'Cannot decode packed block positions.', 'bad');
                    setRow('attrCompare', 'No comparison', 'Missing location entry.', 'bad');
                    setRow('sizeCompare', 'No comparison', 'Missing location entry.', 'bad');
                } else {
                    setRow(
                        'entry',
                        `${hexWord(entry.addr)}..${hexWord(entry.nextAddr - 1)}`,
                        `Matched room ${hexByte(entry.id)} after scanning ${entry.scanned} entries; declared payload size ${entry.entrySize}.`,
                        'ok'
                    );
                    setRow(
                        'entryHeader',
                        `${hexByte(entry.header)}  selector=${entry.selector}  attr=${entry.attr}`,
                        `Size table entry at ${hexWord(decodedSize.addr)} gives X=${fmtByte(decodedSize.x)}, Y=${fmtByte(decodedSize.y)}, Z=${fmtByte(decodedSize.z)}.`,
                        'ok'
                    );
                    setRow(
                        'backgrounds',
                        entry.backgrounds.length
                            ? entry.backgrounds.map(value => fmtNamedId(value, KL_BACKGROUND_NAMES)).join('; ')
                            : '(none)',
                        entry.foundBackgroundTerminator
                            ? `Terminated by 0xFF at ${hexWord(entry.blockStart - 1)} before block/count groups.`
                            : 'No 0xFF terminator before entry end.',
                        entry.foundBackgroundTerminator ? 'ok' : 'warn'
                    );
                    setRow(
                        'blockGroups',
                        entry.blockGroups.length
                            ? entry.blockGroups.map(group => {
                                const typeName = KL_BLOCK_NAMES[group.type] || 'unknown';
                                return `${hexWord(group.addr)} ${hexByte(group.header)} type ${group.type} ${typeName} count ${group.count}`;
                            }).join('; ')
                            : '(none)',
                        `${entry.blockBytes.length} bytes from ${hexWord(entry.blockStart)} to ${hexWord(entry.nextAddr - 1)}; header bits are tttttccc.`,
                        entry.blockGroups.some(group => group.truncated) ? 'warn' : 'ok'
                    );
                    setRow(
                        'blockPositions',
                        entry.blockGroups.length
                            ? entry.blockGroups.map(group => {
                                const positions = group.positions.map(position => fmtPosition(position.raw)).join(' ');
                                return `${fmtNamedId(group.type, KL_BLOCK_NAMES)}: ${positions || '(none)'}`;
                            }).join('; ')
                            : '(none)',
                        'Each position byte is decoded as zz yyy xxx, giving grid z/y/x before block-type fine offsets are applied.',
                        entry.blockGroups.some(group => group.truncated) ? 'warn' : 'ok'
                    );
                    setRow(
                        'attrCompare',
                        `entry attr=${entry.attr}  0x5BAD=${hexByte(sample.attrWork)}  low3=${sample.attrWork & 0x07}`,
                        sample.attrOk
                            ? 'Match using the low three bits of 0x5BAD.'
                            : 'Mismatch; do not treat 0x5BAD as final until this is explained.',
                        sample.attrOk ? 'ok' : 'bad'
                    );
                    setRow(
                        'sizeCompare',
                        `selector ${entry.selector}: ${decodedSize.x}/${decodedSize.y}/${decodedSize.z} vs work ${sample.sizeX}/${sample.sizeY}/${sample.sizeZ}`,
                        sample.sizeOk
                            ? 'Selector dimensions match 0x5BAB, 0x5BAC, and 0x5BAE.'
                            : 'Mismatch between static size selector and working room sizes.',
                        sample.sizeOk ? 'ok' : 'bad'
                    );
                }

                renderTransitionRows();
                renderStage5StaticMapRow();
                renderStage5RecenterRow();
                renderStage7SlidingRow();
                renderStage2Cross(staticRange, sample);
                renderStage4LogicalMap();
                previousSample = sample;
            } catch (err) {
                setRow('sampler', 'Error', String(err), 'bad');
            } finally {
                sampleInFlight = false;
            }
        };

        if (typeof emu.on === 'function') {
            emu.on('frameCompleted', () => {
                queueStage5RoomIdRecenterAfterDraw();
                sample('frameCompleted');
            });
        } else {
            setRow(
                'sampler',
                'Missing frame event',
                'The loaded JSSpeccy bundle does not expose on(); refresh to load the versioned Stage 1 bundle.',
                'bad'
            );
        }

        renderStage5StaticMapRow();
        renderStage5RecenterRow();
        renderStage7SlidingRow();
        renderStage4LogicalMap();
        loadStage5StaticMapDocument();
        sample('initial');
        window.setInterval(() => {
            if (frameCompletedCount === 0) {
                sample('interval');
            }
        }, 250);
    }


    return {
        start: startKnightLore,
        installDiagnostics: installKnightLoreDiagnostics,
        logicalMap,
        getLogicalRoom: logicalMap.getRoomAt,
        getLogicalRoomByLabel: logicalMap.getRoomByLabel,
        compileLogicalRoom: logicalMap.compileRoom,
        loadLogicalMapDocument,
        loadLogicalMapFromUrl,
    };
}
