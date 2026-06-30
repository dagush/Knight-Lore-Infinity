export function createKnightLoreInfinity(JSSpeccyImpl = window.JSSpeccy) {
    let emu = null;
    const KL_DIAGNOSTICS_BUILD = 'stage45-json-format-20260630-1';
    const KL_URL_PARAMS = new URLSearchParams(window.location.search);
    const KL_MAP_FORMAT = 'knight-lore-infinity-logical-map-v1';
    const KL_STAGE45_MAP_URL = KL_URL_PARAMS.get('map');
    let renderStage4LogicalMapNow = null;
    let logicalMapLoadStatus = {
        attempted: false,
        done: true,
        message: 'Using built-in authored rooms plus deterministic generation.',
    };

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

    const hashLogicalCoord = (x, y, salt = 0) => {
        let hash = 0x811c9dc5;
        hash = Math.imul(hash ^ (x | 0), 0x01000193);
        hash = Math.imul(hash ^ (y | 0), 0x01000193);
        hash = Math.imul(hash ^ (salt | 0), 0x01000193);
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d);
        hash ^= hash >>> 15;
        hash = Math.imul(hash, 0x846ca68b);
        hash ^= hash >>> 16;
        return hash >>> 0;
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

    const buildBackgrounds = room => {
        if (Array.isArray(room.backgrounds)) return [...room.backgrounds];

        const selectorInfo = KL_SIZE_SELECTORS[room.size.selector];
        if (!selectorInfo) return [];

        const exits = room.exits || {};
        const theme = room.theme || 'stone';
        const archIds = theme === 'tree' ? KL_TREE_ARCH_IDS : KL_STONE_ARCH_IDS;
        const backgrounds = [];

        for (const direction of KL_DIRECTIONS) {
            if (exits[direction]) backgrounds.push(archIds[direction]);
        }

        if (theme === 'tree' && room.size.selector === 0) {
            backgrounds.push(0x0f, 0x10, 0x11);
        } else {
            backgrounds.push(selectorInfo.wallId);
        }

        return backgrounds;
    };

    const createGeneratedLogicalRoom = (x, y) => {
        const hash = hashLogicalCoord(x, y, 0x4b4c);
        const colour = 3 + (hash & 0x03);
        const theme = (hash & 0x08) ? 'tree' : 'stone';
        const count = 1 + ((hash >>> 4) & 0x03);
        const positions = [];

        for (let index = 0; index < count; index++) {
            const offsetHash = hashLogicalCoord(x, y, 0x100 + index);
            positions.push({
                x: 2 + (offsetHash & 0x03),
                y: 2 + ((offsetHash >>> 3) & 0x03),
                z: 0,
            });
        }

        return {
            coord: {x, y},
            label: `generated:${logicalCoordKey(x, y)}`,
            title: `generated ${logicalCoordKey(x, y)}`,
            source: 'generated',
            size: {selector: 0},
            colour,
            theme,
            exits: {north: 'arch', east: 'arch', south: 'arch', west: 'arch'},
            blocks: [
                {
                    type: theme === 'tree' ? 0x00 : 0x03,
                    positions,
                },
            ],
            objects: [],
            items: [],
        };
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
        const payload = [header, ...room.backgrounds, 0xff, ...blockBytes];
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
                    generated.set(key, createGeneratedLogicalRoom(coord.x, coord.y));
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

    function startKnightLore() {
        emu = JSSpeccyImpl(document.getElementById('jsspeccy'), {
            zoom: 2,
            sandbox: false,
            autoStart: true,
            openUrl: 'Knight Lore (1984)(Ultimate).z80',
        });
        installKnightLoreDiagnostics(emu);
        if (KL_STAGE45_MAP_URL) {
            loadLogicalMapFromUrl(KL_STAGE45_MAP_URL).catch(err => {
                console.error(err);
            });
        }
    }

    function installKnightLoreDiagnostics(emu) {
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
            message: KL_STAGE3_ONE_ROOM_INJECTION_TEST.enabled
                ? 'Stage 3 one-room injection test is enabled by ?stage3test=1 and waiting to patch.'
                : 'Stage 3 one-room injection test is disabled; add ?stage3test=1 to the URL to run it.',
        };

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
                // Dormant by default. Open index.html?stage3test=1 to run
                // this fixed-size one-room injection before the next
                // retrieve_screen rebuild.
                await applyStage3OneRoomInjectionTest();
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

                const sample = {
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
                };

                const entry = decodeLocationEntry(staticRange, sample.room0);
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

                updateTransition(sample);

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
            emu.on('frameCompleted', () => sample('frameCompleted'));
        } else {
            setRow(
                'sampler',
                'Missing frame event',
                'The loaded JSSpeccy bundle does not expose on(); refresh to load the versioned Stage 1 bundle.',
                'bad'
            );
        }

        renderStage4LogicalMap();
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
