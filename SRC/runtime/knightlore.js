import { createKnightLoreProceduralMap } from './knightlore-mapgen.js';

export function createKnightLoreInfinity(JSSpeccyImpl = window.JSSpeccy) {
    let emu = null;
    const KL_DIAGNOSTICS_BUILD = 'stage84-c35f-charm-reset-20260723-2';
    const KL_URL_PARAMS = new URLSearchParams(window.location.search);
    const KL_MAP_FORMAT = 'knight-lore-infinity-logical-map-v1';
    const KL_STAGE45_MAP_URL = KL_URL_PARAMS.get('map');
    const KL_STAGE7_SLIDING_CROSS_ENABLED =
        KL_URL_PARAMS.get('stage7sliding') === '1' ||
        KL_URL_PARAMS.get('stage7') === '1';
    const KL_STAGE82C_CAULDRON_VISUAL_ENABLED =
        KL_URL_PARAMS.get('stage8c') === '1' ||
        KL_URL_PARAMS.get('stage82c') === '1';
    const KL_STAGE82C_BUBBLE_PARAMS = KL_URL_PARAMS.getAll('stage8cbubbles')
        .map(value => value.trim().toLowerCase())
        .filter(Boolean);
    const KL_STAGE82C_BUBBLE_PARAM = KL_STAGE82C_BUBBLE_PARAMS.length
        ? KL_STAGE82C_BUBBLE_PARAMS[KL_STAGE82C_BUBBLE_PARAMS.length - 1]
        : '';
    const KL_STAGE82C_BUBBLE_REQUEST = KL_STAGE82C_BUBBLE_PARAMS.length
        ? KL_STAGE82C_BUBBLE_PARAMS.join(' -> ')
        : 'off';
    const KL_STAGE82C_BUBBLE_MODE = (() => {
        if (!KL_STAGE82C_BUBBLE_PARAM || ['0', 'false', 'off', 'disabled'].includes(KL_STAGE82C_BUBBLE_PARAM)) {
            return 'disabled';
        }
        if (['1', 'true', 'on', 'global'].includes(KL_STAGE82C_BUBBLE_PARAM)) {
            return 'global';
        }
        if (['cauldron', 'cauldron-only', 'gated', 'room', 'room-gated'].includes(KL_STAGE82C_BUBBLE_PARAM)) {
            return 'cauldron';
        }
        return 'invalid';
    })();
    const KL_STAGE82C_BUBBLES_ENABLED = KL_STAGE82C_BUBBLE_MODE === 'global';
    const KL_STAGE84_C31_ENABLED = ['1', 'true', 'on', 'yes'].includes(
        (KL_URL_PARAMS.get('stage84c31') || KL_URL_PARAMS.get('stage8c31') || '').trim().toLowerCase()
    );
    const KL_STAGE84_C33_ENABLED = ['1', 'true', 'on', 'yes'].includes(
        (KL_URL_PARAMS.get('stage84c33') || KL_URL_PARAMS.get('stage8c33') || '').trim().toLowerCase()
    );
    const KL_STAGE84_C34_ENABLED = ['1', 'true', 'on', 'yes'].includes(
        (KL_URL_PARAMS.get('stage84c34') || KL_URL_PARAMS.get('stage8c34') || '').trim().toLowerCase()
    );
    const KL_STAGE84_C35B_ENABLED = ['1', 'true', 'on', 'yes'].includes(
        (KL_URL_PARAMS.get('stage84c35b') || KL_URL_PARAMS.get('stage8c35b') || '').trim().toLowerCase()
    );
    const KL_STAGE84_C35B_HOLD_FRAMES = (() => {
        const raw = KL_URL_PARAMS.get('stage84c35bhold') || KL_URL_PARAMS.get('stage8c35bhold') || '6';
        const parsed = Number.parseInt(String(raw).trim(), 10);
        if (!Number.isFinite(parsed)) return 6;
        return Math.max(1, Math.min(30, parsed));
    })();
    const KL_STAGE84_C35B_HUMAN_BUBBLES_ENABLED = [
        '1', 'true', 'on', 'yes', 'human', 'human-only',
    ].includes(
        (KL_URL_PARAMS.get('stage84c35bbubbles') || KL_URL_PARAMS.get('stage8c35bbubbles') || '').trim().toLowerCase()
    );
    const KL_STAGE84_C35C_ENABLED = ['1', 'true', 'on', 'yes'].includes(
        (KL_URL_PARAMS.get('stage84c35c') || KL_URL_PARAMS.get('stage8c35c') || '').trim().toLowerCase()
    );
    const KL_STAGE84_C35C_PERIOD = (() => {
        const raw = KL_URL_PARAMS.get('stage84c35cperiod') || KL_URL_PARAMS.get('stage8c35cperiod') || '4';
        const parsed = Number.parseInt(String(raw).trim(), 10);
        if (!Number.isFinite(parsed)) return 4;
        return Math.max(2, Math.min(12, parsed));
    })();
    const KL_STAGE84_C35E_REQUESTED = !['0', 'false', 'off', 'disabled', 'no'].includes(
        (KL_URL_PARAMS.get('stage84c35e') || KL_URL_PARAMS.get('stage8c35e') || '1').trim().toLowerCase()
    );
    const KL_STAGE84_C35F_REQUESTED = !['0', 'false', 'off', 'disabled', 'no'].includes(
        (KL_URL_PARAMS.get('stage84c35f') || KL_URL_PARAMS.get('stage8c35f') || '1').trim().toLowerCase()
    );
    const KL_STAGE84_C36_ORIGINAL_CHARM_ROOMS_ENABLED = ['1', 'true', 'on', 'yes'].includes(
        (KL_URL_PARAMS.get('stage84c36') || KL_URL_PARAMS.get('stage8originalcharmrooms') || '').trim().toLowerCase()
    );
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
            ['stage82CBubbles', 'Stage 8.2C2 bubble probe'],
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
            {kind: 'wizard-background', addr: 0x6fae, length: 17, label: 'wizard background'},
            {kind: 'cauldron-background', addr: 0x6fbf, length: 17, label: 'cauldron background'},
            {kind: 'cauldron-bubbles', addr: 0xb8c8, length: 18, label: 'cauldron bubbles'},
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

    const makeTreeSpriteFromStoneSprite = value => {
        if (value === 0x0d || value === 0x0a) return 0x80;
        if (value === 0x0e || value === 0x0b) return 0x81;
        if (value === 0x0f || value === 0x0c) return 0x82;
        return value;
    };

    const makeBaseTreeWallFromStoneWall = (bytes, extraRecords = [], keepRecord = () => true) => {
        const records = [];

        for (let index = 0; index < bytes.length; index += 8) {
            const sprite = bytes[index];
            if (sprite === 0x00) break;

            const record = bytes.slice(index, index + 8);
            if (record.length < 8) break;
            if (record[3] !== 0x80) continue;
            if (!keepRecord(record)) continue;

            records.push(makeTreeSpriteFromStoneSprite(record[0]), ...record.slice(1));
        }

        for (const record of extraRecords) records.push(...record);
        records.push(0x00);
        return records;
    };

    const KL_STAGE7_WEST_FILLER_X = {
        defaultValue: 0x5f,
        min: 0x00,
        max: 0xbf,
    };

    const clampStage7WestFillerX = value => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return KL_STAGE7_WEST_FILLER_X.defaultValue;
        return Math.max(
            KL_STAGE7_WEST_FILLER_X.min,
            Math.min(KL_STAGE7_WEST_FILLER_X.max, Math.round(numeric))
        );
    };

    const parseStage7WestFillerX = value => {
        if (value === null) return KL_STAGE7_WEST_FILLER_X.defaultValue;
        const text = String(value).trim();
        if (!text) return KL_STAGE7_WEST_FILLER_X.defaultValue;
        const parsed = /^0x[0-9a-f]+$/i.test(text)
            ? Number.parseInt(text.slice(2), 16)
            : Number.parseInt(text, 10);
        return clampStage7WestFillerX(parsed);
    };

    let stage7WoodWallTuning = {
        westFillerX: parseStage7WestFillerX(KL_URL_PARAMS.get('stage7westx')),
    };

    const KL_STAGE7_NORTH_WALL_Y = 0xa0;

    const KL_STAGE7_WEST_WOOD_WALL_PATTERN = [
        {label: 'west panel 1', sprite: 0x80, y: 0x49},
        {label: 'west panel 2', sprite: 0x81, y: 0x58},
        {label: 'west panel 3', sprite: 0x82, y: 0x68},
        {label: 'west gap lower', sprite: 0x80, y: 0x78},
        {label: 'west gap upper', sprite: 0x81, y: 0x88},
        {label: 'west panel 4', sprite: 0x80, y: 0x98},
        {label: 'west panel 5', sprite: 0x81, y: 0xa8},
        {label: 'west panel 6', sprite: 0x82, y: 0xb8},
    ];

    const buildStage7TranslatedWestWallRecords = (x = stage7WoodWallTuning.westFillerX) => (
        KL_STAGE7_WEST_WOOD_WALL_PATTERN.map(item => ({
            ...item,
            bytes: [item.sprite, x, item.y, 0x80, 0x00, 0x08, 0x2c, 0x10],
        }))
    );

    const KL_STAGE7_NORTH_WOOD_WALL_PATTERN = [
        {label: 'north panel 1', sprite: 0x80, x: 0x48},
        {label: 'north panel 2', sprite: 0x81, x: 0x58},
        {label: 'north panel 3', sprite: 0x82, x: 0x68},
        {label: 'north gap lower', sprite: 0x80, x: 0x78},
        {label: 'north gap upper', sprite: 0x81, x: 0x88},
        {label: 'north panel 4', sprite: 0x80, x: 0x98},
        {label: 'north panel 5', sprite: 0x81, x: 0xa8},
        {label: 'north panel 6', sprite: 0x82, x: 0xb8},
    ];

    const buildStage7TranslatedNorthWallRecords = (y = KL_STAGE7_NORTH_WALL_Y) => (
        KL_STAGE7_NORTH_WOOD_WALL_PATTERN.map(item => ({
            ...item,
            bytes: [item.sprite, item.x, y, 0x80, 0x08, 0x00, 0x2c, 0x50],
        }))
    );

    const isStage7GroundNorthWallRecord = record => (
        record[3] === 0x80 &&
        record[4] === 0x08 &&
        record[5] === 0x00 &&
        (record[7] === 0x10 || record[7] === 0x50)
    );

    const isStage7GroundWestWallRecord = record => (
        record[3] === 0x80 &&
        record[4] === 0x00 &&
        record[5] === 0x08 &&
        record[7] === 0x10
    );

    const buildStage7TranslatedTreeWallRecords = () => ({
        size2North: buildStage7TranslatedNorthWallRecords().map(item => item.bytes),
        size3West: buildStage7TranslatedWestWallRecords().map(item => item.bytes),
    });

    const KL_STAGE7_TREE_WALL_SIZE2_SOURCE = [
        0x0d, 0x3f, 0x98, 0x80, 0x00, 0x08, 0x28, 0x10,
        0x0e, 0x47, 0xa0, 0x80, 0x08, 0x00, 0x28, 0x10,
        0x0f, 0x3f, 0x63, 0x80, 0x00, 0x08, 0x2c, 0x10,
        0x0f, 0xb8, 0xa0, 0x80, 0x08, 0x00, 0x2c, 0x50,
        0x0f, 0x3f, 0x63, 0xac, 0x00, 0x08, 0x2c, 0x10,
        0x0f, 0xb8, 0xa0, 0xac, 0x08, 0x00, 0x2c, 0x50,
        0x0d, 0x3f, 0x98, 0xa8, 0x00, 0x08, 0x28, 0x10,
        0x0e, 0x47, 0xa0, 0xa8, 0x08, 0x00, 0x28, 0x10,
        0x0f, 0xb8, 0xa0, 0xd0, 0x08, 0x00, 0x2c, 0x50,
        0x0a, 0x80, 0xa0, 0x80, 0x14, 0x00, 0x14, 0x50,
        0x0a, 0x3f, 0x7e, 0xb0, 0x00, 0x14, 0x14, 0x10,
        0x0b, 0x60, 0xa0, 0x90, 0x0c, 0x00, 0x14, 0x50,
        0x0a, 0x60, 0xa0, 0xb8, 0x14, 0x00, 0x14, 0x50,
        0x0c, 0xa0, 0xa0, 0xb0, 0x0c, 0x00, 0x0c, 0x50,
        0x00,
    ];

    const KL_STAGE7_TREE_WALL_SIZE3_SOURCE = [
        0x0d, 0x5f, 0xb8, 0x80, 0x00, 0x08, 0x28, 0x10,
        0x0e, 0x67, 0xc0, 0x80, 0x08, 0x00, 0x28, 0x10,
        0x0f, 0x5f, 0x48, 0x80, 0x00, 0x08, 0x2c, 0x10,
        0x0f, 0x9d, 0xc0, 0x80, 0x08, 0x00, 0x2c, 0x50,
        0x0d, 0x5f, 0xb8, 0xa8, 0x00, 0x08, 0x28, 0x10,
        0x0e, 0x67, 0xc0, 0xa8, 0x08, 0x00, 0x28, 0x10,
        0x0f, 0x5f, 0x48, 0xac, 0x00, 0x08, 0x2c, 0x10,
        0x0f, 0x9d, 0xc0, 0xac, 0x08, 0x00, 0x2c, 0x50,
        0x0f, 0x5f, 0x48, 0xd0, 0x00, 0x08, 0x2c, 0x10,
        0x0a, 0x5f, 0x90, 0x80, 0x00, 0x14, 0x14, 0x10,
        0x0a, 0x84, 0xc0, 0xb0, 0x14, 0x00, 0x14, 0x50,
        0x0b, 0x5f, 0x60, 0x90, 0x00, 0x0c, 0x14, 0x10,
        0x0a, 0x5f, 0x68, 0xb8, 0x00, 0x14, 0x14, 0x10,
        0x0c, 0x5f, 0xa0, 0xb0, 0x00, 0x0c, 0x0c, 0x10,
        0x00,
    ];

    const KL_STAGE7_CUSTOM_BACKGROUNDS = {
        baseAddr: 0x6ae0,
        offsetTableAddr: 0x6ce2,
        treeWallSize2Id: 0x16,
        treeWallSize3Id: 0x17,
    };

    const KL_STAGE82C_ORIGINAL_CAULDRON = {
        offsetTableAddr: 0x6ce2 + 0x12 * 2,
        offsetTableBytes: [0xae, 0x6f, 0xbf, 0x6f],
        cauldronBackgroundAddr: 0x6fbf,
        cauldronBackgroundBytes: [
            0x8d, 0x80, 0x80, 0x80, 0x0a, 0x0a, 0x18, 0x10,
            0x8e, 0x80, 0x88, 0x80, 0x00, 0x00, 0x00, 0x12,
            0x00,
        ],
        bubbleTemplateAddr: 0xb8c8,
        bubbleTemplateBytes: [
            0xa0, 0x80, 0x80, 0x80, 0x05, 0x05, 0x0c, 0x10,
            0xb4, 0x00, 0x00, 0x00, 0x00, 0xa0, 0x00, 0x00,
            0x00, 0x00,
        ],
        bubbleUpdateMotionCallAddr: 0xb8e8,
        bubbleUpdateGraphicCallAddr: 0xb8eb,
        bubbleUpdateExitAddr: 0xb916,
        requestDisplayResetAddr: 0xb926,
        liveBubbleSlotAddr: 0x5c68,
        liveBubbleSlotLength: 0x18,
    };
    const KL_STAGE84_C30 = {
        staticObjectTableStart: 0x6ff2,
        staticObjectTableEnd: 0x7112,
        staticObjectRecordSize: 0x09,
        cauldronPhysicalRoom: 0x88,
        carryStateStart: 0x5bb3,
        carryStateEnd: 0x5be8,
        inventoryStart: 0x5bd8,
        inventoryEnd: 0x5be8,
        inventorySlots: [
            {label: 'inventory handoff', addr: 0x5bd8, offset: 0},
            {label: 'carried display 0', addr: 0x5bdc, offset: 4},
            {label: 'carried display 1', addr: 0x5be0, offset: 8},
            {label: 'carried display 2', addr: 0x5be4, offset: 12},
        ],
        stateBytes: [
            {label: 'pickup_drop_pressed', addr: 0x5bb3},
            {label: 'objects_carried_changed', addr: 0x5bb4},
            {label: 'user_input', addr: 0x5bb5},
            {label: 'lives', addr: 0x5bba},
            {label: 'objects_put_in_cauldron', addr: 0x5bbb},
            {label: 'all_objs_in_cauldron', addr: 0x5bc3},
            {label: 'obj_dropping_into_cauldron', addr: 0x5bc4},
            {label: 'cant_drop', addr: 0x5bd3},
        ],
        objectsRequiredAddr: 0xc27d,
        objectsRequiredLength: 14,
        cauldronGateBlockedRoom: 0xff,
        cauldronGatePatches: [
            {
                label: 'drop-slot scan limiter',
                opcodeAddr: 0xc086,
                immediateAddr: 0xc087,
                originalCompare: 0x88,
                blockedCompare: 0xff,
            },
            {
                label: 'drop-into-cauldron arm',
                opcodeAddr: 0xc0c9,
                immediateAddr: 0xc0ca,
                originalCompare: 0x88,
                blockedCompare: 0xff,
            },
        ],
        disposableRecordIndex: 31,
        disposableInactiveRoom: 0xff,
        disposablePosition: {x: 0x80, y: 0x80, z: 0x80},
        playerBodyXyzAddr: 0x5c09,
        playerHeadXyzAddr: 0x5c29,
        liveSlots: [
            {label: 'live item slot 1', addr: 0x5c48},
            {label: 'live item/bubble slot 2', addr: 0x5c68},
        ],
        liveSlotSize: 0x20,
        dynamicStart: 0x5c88,
        dynamicSlotSize: 0x20,
        dynamicProbeCount: 8,
    };

    const refreshStage7CustomBackgrounds = () => {
        const records = buildStage7TranslatedTreeWallRecords();
        KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Bytes = makeBaseTreeWallFromStoneWall(
            KL_STAGE7_TREE_WALL_SIZE2_SOURCE,
            records.size2North,
            record => !isStage7GroundNorthWallRecord(record)
        );
        KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Bytes = makeBaseTreeWallFromStoneWall(
            KL_STAGE7_TREE_WALL_SIZE3_SOURCE,
            records.size3West,
            record => !isStage7GroundWestWallRecord(record)
        );
        KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Addr = KL_STAGE7_CUSTOM_BACKGROUNDS.baseAddr;
        KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Addr =
            KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Addr +
            KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Bytes.length;
        KL_STAGE7_CUSTOM_BACKGROUNDS.endAddr =
            KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Addr +
            KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Bytes.length;
    };

    refreshStage7CustomBackgrounds();

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
            // Four stone arches keep all cardinal exits usable; repeated
            // 0x12 fillers preserve size without colliding with Phase C
            // cauldron visual probing, where 0x13 becomes active again.
            0x88, 0x13, 0x06,
            0x00, 0x01, 0x02, 0x03, 0x12, 0x12, 0x0c, 0xff,
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
            title: 'authored origin 0x88 block frame',
            size: {selector: 0},
            colour: 6,
            theme: 'stone',
            exits: {north: 'arch', east: 'arch', south: 'arch', west: 'arch'},
            blocks: [
                {
                    type: 0x00,
                    positions: [
                        {x: 2, y: 6, z: 0},
                        {x: 1, y: 5, z: 0},
                        {x: 5, y: 6, z: 0},
                        {x: 6, y: 5, z: 0},
                        {x: 6, y: 2, z: 0},
                        {x: 5, y: 1, z: 0},
                        {x: 1, y: 2, z: 0},
                        {x: 2, y: 1, z: 0},
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
        'high arch east', 'high arch south', 'custom tree wall size 2', 'custom tree wall size 3',
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
    const KL_ITEM_NAMES = {
        0x60: 'diamond/gem',
        0x61: 'poison',
        0x62: 'shoe/boot',
        0x63: 'chalice/vase',
        0x64: 'cup',
        0x65: 'bottle',
        0x66: 'ball/crystal ball',
        0x67: 'life',
        0xa0: 'good bubble 0',
        0xa1: 'good bubble 1',
        0xa2: 'good bubble 2',
        0xa3: 'good bubble 3',
        0xa4: 'wolf-attack bubble 0',
        0xa5: 'wolf-attack bubble 1',
        0xa6: 'wolf-attack bubble 2',
        0xa7: 'wolf-attack bubble 3',
        0xa8: 'request diamond/gem display',
        0xa9: 'request poison display',
        0xaa: 'request shoe/boot display',
        0xab: 'request chalice/vase display',
        0xac: 'request cup display',
        0xad: 'request bottle display',
        0xae: 'request ball/crystal ball display',
        0xb4: 'fire/bubble support 0',
        0xb5: 'fire/bubble support 1',
    };

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
    const KL_CUSTOM_TREE_RECT_WALL_IDS = new Set([
        KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Id,
        KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Id,
    ]);
    const KL_ALL_WALL_IDS = new Set([
        ...KL_SIZE_WALL_IDS,
        ...KL_CUSTOM_TREE_RECT_WALL_IDS,
    ]);
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

    const getExtraBackgrounds = room => (
        Array.isArray(room.extraBackgrounds) ? room.extraBackgrounds : []
    );

    const buildStoneBackgroundsWithExits = (room, exits) => {
        const selectorInfo = KL_SIZE_SELECTORS[room.size.selector];
        if (!selectorInfo) return [];
        return [
            ...KL_DIRECTIONS
                .filter(direction => exits && exits[direction])
                .map(direction => KL_STONE_ARCH_IDS[direction]),
            selectorInfo.wallId,
            ...getExtraBackgrounds(room),
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
            !KL_ALL_WALL_IDS.has(value)
        ));

        return [...baseBackgrounds, ...specialBackgrounds, ...getExtraBackgrounds(room)];
    };

    const buildTreeRectangularBackgroundsWithExits = (room, exits) => {
        if (room.size.selector === 0) return null;

        const selectorInfo = KL_SIZE_SELECTORS[room.size.selector];
        if (!selectorInfo) return null;
        const customWallId = room.size.selector === 1
            ? KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Id
            : KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Id;

        const archBackgrounds = KL_DIRECTIONS
            .filter(direction => exits && exits[direction])
            .map(direction => KL_TREE_ARCH_IDS[direction]);
        const specialBackgrounds = (room.backgrounds || []).filter(value => (
            !KL_ALL_CARDINAL_ARCH_IDS.has(value) &&
            !KL_TREE_FILLER_IDS.has(value) &&
            !KL_ALL_WALL_IDS.has(value)
        ));

        return [...archBackgrounds, customWallId, ...specialBackgrounds, ...getExtraBackgrounds(room)];
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

            const treeRectangularBackgrounds = buildTreeRectangularBackgroundsWithExits(room, exits);
            if (treeRectangularBackgrounds) return treeRectangularBackgrounds;
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

            const treeRectangularBackgrounds = buildTreeRectangularBackgroundsWithExits(room, exits);
            if (treeRectangularBackgrounds) return treeRectangularBackgrounds;

            const specialBackgrounds = (room.backgrounds || []).filter(value => (
                !KL_ALL_CARDINAL_ARCH_IDS.has(value) &&
                !KL_TREE_FILLER_IDS.has(value) &&
                !KL_ALL_WALL_IDS.has(value)
            ));
            return [...buildStoneBackgroundsWithExits(room, exits), ...specialBackgrounds];
        }

        const nonArchBackgrounds = (room.backgrounds || [])
            .filter(value => !KL_ALL_CARDINAL_ARCH_IDS.has(value));
        const archBackgrounds = KL_DIRECTIONS
            .filter(direction => exits[direction])
            .map(direction => chooseArchIdForRoom(room, direction));
        return [...archBackgrounds, ...nonArchBackgrounds, ...getExtraBackgrounds(room)];
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
            extraBackgrounds: cloneData(definition.extraBackgrounds || []),
            blocks: normalizeBlockRuns(definition.blocks),
            objects: cloneData(definition.objects || []),
            items: cloneData(definition.items || []),
            questRole: definition.questRole || 'none',
            questSector: cloneData(definition.questSector || null),
            questCharm: cloneData(definition.questCharm || null),
            questDressing: cloneData(definition.questDressing || null),
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
        for (const background of room.extraBackgrounds) {
            if (!Number.isInteger(background) || background < 0 || background > 0xff) {
                errors.push(`Invalid extra background id ${background}.`);
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
        const questPersistent = new Map();
        const labels = new Map();
        const proceduralMap = createKnightLoreProceduralMap({
            questCauldronOriginalVisual: KL_STAGE82C_CAULDRON_VISUAL_ENABLED,
            questCauldronBubbles: KL_STAGE82C_BUBBLE_MODE === 'global' || KL_STAGE82C_BUBBLE_MODE === 'cauldron',
            questCauldronBubbleMode: KL_STAGE82C_BUBBLE_MODE,
            questCharmOriginalRooms: KL_STAGE84_C36_ORIGINAL_CHARM_ROOMS_ENABLED,
        });
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

        const createQuestState = sector => ({
            key: sector.key,
            sector: {
                x: sector.sectorX,
                y: sector.sectorY,
                size: sector.sectorSize,
            },
            unvisited: true,
            cauldronSeen: false,
            charmSeen: false,
            charmCollected: false,
            completed: false,
            completedAt: null,
            completedWith: null,
            completionSource: null,
            status: sector.quest && sector.quest.exists ? 'unvisited' : 'no-quest',
            revision: 0,
        });

        const ensureQuestState = sector => {
            if (!questPersistent.has(sector.key)) {
                questPersistent.set(sector.key, createQuestState(sector));
            }
            return questPersistent.get(sector.key);
        };

        const getQuestSectorAt = (x, y) => {
            const coord = getCoord({x, y});
            const sector = proceduralMap.getQuestSectorAt(coord.x, coord.y);
            return {
                ...sector,
                state: ensureQuestState(sector),
            };
        };

        const getQuestRoomInfoAt = (x, y) => {
            const coord = getCoord({x, y});
            const info = proceduralMap.getQuestRoomInfoAt(coord.x, coord.y);
            const sector = proceduralMap.getQuestSectorAt(coord.x, coord.y);
            return {
                ...info,
                state: ensureQuestState(sector),
            };
        };

        const getQuestReachabilityAt = (x, y, options = {}) => {
            const coord = getCoord({x, y});
            return proceduralMap.getQuestReachabilityAt(coord.x, coord.y, options);
        };

        const refreshQuestStateStatus = (state, questExists) => {
            if (state.completed) {
                state.status = 'completed';
            } else if (state.charmCollected) {
                state.status = 'charmCollected';
            } else if (state.charmSeen) {
                state.status = 'charmSeen';
            } else if (state.cauldronSeen) {
                state.status = 'cauldronSeen';
            } else if (!questExists) {
                state.status = 'no-quest';
            } else if (!state.unvisited) {
                state.status = 'visited';
            } else {
                state.status = 'unvisited';
            }
        };

        const attachQuestMetadata = room => {
            const info = getQuestRoomInfoAt(room.coord.x, room.coord.y);
            const reachability = getQuestReachabilityAt(room.coord.x, room.coord.y);
            room.questRole = info.role;
            room.questSector = cloneData(info.sector);
            room.questCharm = info.quest.requiredCharm ? cloneData(info.quest.requiredCharm) : null;
            room.questDressing = cloneData(room.questDressing || info.dressing || null);
            room.meta = {
                ...room.meta,
                quest: {
                    sector: cloneData(info.sector),
                    role: info.role,
                    quest: cloneData(info.quest),
                    state: cloneData(info.state),
                    reachability: cloneData(reachability),
                    dressing: cloneData(room.questDressing || null),
                    charmPolicy: 'Charm type is global; the local charm anchor is a suggested source, not an enforced sector-bound item.',
                },
            };
            return room;
        };

        const updateQuestVisitState = room => {
            const info = getQuestRoomInfoAt(room.coord.x, room.coord.y);
            const state = info.state;
            const previousStatus = state.status;

            state.unvisited = false;
            if (info.role === 'cauldron') state.cauldronSeen = true;
            if (info.role === 'charm') state.charmSeen = true;
            refreshQuestStateStatus(state, info.quest.exists);

            if (state.status !== previousStatus || info.role !== 'none') state.revision++;
            return state;
        };

        const markQuestCompletedAt = (x, y, detail = {}) => {
            const coord = getCoord({x, y});
            const sector = getQuestSectorAt(coord.x, coord.y);
            const quest = sector.quest || {exists: false};
            const state = sector.state;
            if (!quest.exists) {
                refreshQuestStateStatus(state, false);
                return {changed: false, state, sector};
            }

            const previous = JSON.stringify({
                unvisited: state.unvisited,
                cauldronSeen: state.cauldronSeen,
                charmSeen: state.charmSeen,
                charmCollected: state.charmCollected,
                completed: state.completed,
                completedAt: state.completedAt,
                completedWith: state.completedWith,
                completionSource: state.completionSource,
                status: state.status,
            });

            state.unvisited = false;
            state.cauldronSeen = true;
            state.charmCollected = true;
            state.completed = true;
            state.completedAt = {
                coord: cloneData(coord),
                sample: Number.isInteger(detail.sample) ? detail.sample : null,
            };
            state.completedWith = detail.charm ? cloneData(detail.charm) : null;
            state.completionSource = detail.source ? cloneData(detail.source) : null;
            refreshQuestStateStatus(state, true);

            const changed = previous !== JSON.stringify({
                unvisited: state.unvisited,
                cauldronSeen: state.cauldronSeen,
                charmSeen: state.charmSeen,
                charmCollected: state.charmCollected,
                completed: state.completed,
                completedAt: state.completedAt,
                completedWith: state.completedWith,
                completionSource: state.completionSource,
                status: state.status,
            });
            if (changed) state.revision++;
            return {changed, state, sector};
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
            return attachQuestMetadata(room);
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
            const previousQuestPersistent = new Map(questPersistent);
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
                    questPersistent.clear();
                }
                loadAuthoredRooms(rooms);
            } catch (err) {
                authored.clear();
                generated.clear();
                persistent.clear();
                questPersistent.clear();
                labels.clear();
                for (const [key, value] of previousAuthored.entries()) authored.set(key, value);
                for (const [key, value] of previousGenerated.entries()) generated.set(key, value);
                for (const [key, value] of previousPersistent.entries()) persistent.set(key, value);
                for (const [key, value] of previousQuestPersistent.entries()) questPersistent.set(key, value);
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
            getQuestSectorAt,
            getQuestRoomInfoAt,
            getQuestReachabilityAt,
            markQuestCompletedAt,
            compileRoomAt: (x, y, physicalRoomId = KL_STAGE2.centerRoom) => (
                compileLogicalRoomToLocationEntry(getRoomAt(x, y), physicalRoomId)
            ),
            compileRoom: compileLogicalRoomToLocationEntry,
            loadAuthoredRooms,
            loadMapDocument,
            getPersistentState: (x, y) => ensurePersistentState(getRoomAt(x, y)),
            markVisited: (x, y) => {
                const room = getRoomAt(x, y);
                const state = ensurePersistentState(room);
                state.visited = true;
                state.revision++;
                updateQuestVisitState(room);
                return state;
            },
            stats: () => ({
                activeDocument: cloneData(activeDocument),
                authoredRooms: authored.size,
                generatedRooms: generated.size,
                persistentRooms: persistent.size,
                questPersistentSectors: questPersistent.size,
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
                title: reciprocal.room.title,
                source: room.source,
                style: cloneData(
                    reciprocal.room.meta &&
                    reciprocal.room.meta.procedural &&
                    reciprocal.room.meta.procedural.style
                        ? reciprocal.room.meta.procedural.style
                        : null
                ),
                size: cloneData(reciprocal.room.size),
                colour: reciprocal.room.colour,
                theme: reciprocal.room.theme,
                exits: cloneData(reciprocal.room.exits),
                backgrounds: cloneData(reciprocal.room.backgrounds),
                extraBackgrounds: cloneData(reciprocal.room.extraBackgrounds),
                blocks: cloneData(reciprocal.room.blocks),
                questRole: reciprocal.room.questRole,
                questSector: cloneData(reciprocal.room.questSector),
                questCharm: cloneData(reciprocal.room.questCharm),
                questDressing: cloneData(reciprocal.room.questDressing),
                originalCharmRoom: cloneData(
                    reciprocal.room.questDressing &&
                    reciprocal.room.questDressing.staticDressing
                        ? reciprocal.room.questDressing.staticDressing.originalCharmRoom || null
                        : null
                ),
                questState: reciprocal.room.meta && reciprocal.room.meta.quest
                    ? cloneData(reciprocal.room.meta.quest.state)
                    : null,
                questReachability: reciprocal.room.meta && reciprocal.room.meta.quest
                    ? cloneData(reciprocal.room.meta.quest.reachability)
                    : null,
                stateRevision: room.state ? room.state.revision : null,
                entrySize: compiled.entrySize,
                byteCount: compiled.bytes.length,
                backgroundCount: compiled.backgroundCount,
                blockByteCount: compiled.blockByteCount,
                reciprocalExitAdjustments: reciprocal.adjustments,
            });
        }

        const capacity = KL_STAGE7_CUSTOM_BACKGROUNDS.baseAddr - KL_STAGE1.locationStart;
        if (KL_STAGE7_CUSTOM_BACKGROUNDS.endAddr > KL_STAGE1.locationEnd) {
            throw new Error(`Custom Stage 7 background buffer ends at ${KL_STAGE7_CUSTOM_BACKGROUNDS.endAddr.toString(16)} but location table ends at ${KL_STAGE1.locationEnd.toString(16)}.`);
        }
        if (bytes.length > capacity) {
            throw new Error(`Compiled Stage 7 sliding cross is ${bytes.length} bytes but only ${capacity} bytes are available before the custom background buffer.`);
        }

        return {
            title: `Stage 7 sliding cross centered at ${logicalCoordKey(centerCoord.x, centerCoord.y)}`,
            bytes,
            roomSummaries,
            roomCount: roomSummaries.length,
            capacity,
            customBackgrounds: {
                treeWallSize2Id: KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Id,
                treeWallSize2Addr: KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Addr,
                treeWallSize2Bytes: KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Bytes.length,
                treeWallSize3Id: KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Id,
                treeWallSize3Addr: KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Addr,
                treeWallSize3Bytes: KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Bytes.length,
                westFillerX: stage7WoodWallTuning.westFillerX,
            },
        };
    };

    function startKnightLore() {
        emu = JSSpeccyImpl(document.getElementById('jsspeccy'), {
            zoom: 2,
            sandbox: false,
            autoStart: false,
            openUrl: 'Knight Lore (1984)(Ultimate).z80',
        });
        const logicalMapLoadPromise = KL_STAGE45_MAP_URL
            ? loadLogicalMapFromUrl(KL_STAGE45_MAP_URL).catch(err => {
                console.error(err);
                return null;
            })
            : null;
        installKnightLoreDiagnostics(emu, logicalMapLoadPromise, {
            startAfterStartupPrime: true,
        });
    }

    function installKnightLoreDiagnostics(emu, logicalMapLoadPromise = null, options = {}) {
        const tbody = document.getElementById('stage1-diagnostics-body');
        const stage7StyleTbody = document.getElementById('stage7-style-body');
        const stage7StyleStatus = document.getElementById('stage7-style-status');
        const stage8QuestTbody = document.getElementById('stage8-quest-body');
        const stage8QuestStatus = document.getElementById('stage8-quest-status');
        const stage84C30Tbody = document.getElementById('stage84-c30-body');
        const stage84C30Status = document.getElementById('stage84-c30-status');
        const crossTbody = document.getElementById('stage2-cross-body');
        const stage2Status = document.getElementById('stage2-status');
        const logicalTbody = document.getElementById('stage4-logical-body');
        const stage4Status = document.getElementById('stage4-status');
        const stage7WestFillerXSlider = document.getElementById('stage7-west-filler-x-slider');
        const stage7WestFillerXValue = document.getElementById('stage7-west-filler-x-value');
        const stage7WestFillerXStatus = document.getElementById('stage7-west-filler-x-status');
        const stage7WestFillerRecordsBody = document.getElementById('stage7-west-filler-records-body');
        const rowEls = new Map();
        let sampleCount = 0;
        let frameCompletedCount = 0;
        let sampleInFlight = false;
        let startupPrimePending = false;
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
        let stage82CBubbleProbe = {
            mode: KL_STAGE82C_BUBBLE_MODE,
            requested: KL_STAGE82C_BUBBLE_REQUEST,
            desiredActive: KL_STAGE82C_BUBBLES_ENABLED,
            templateActive: null,
            templateZeroed: null,
            writes: 0,
            lastCoord: {x: 0, y: 0},
            lastRole: 'none',
            lastAction: 'waiting',
            lastTemplateBytes: [],
            lastLiveBytes: [],
            lastError: null,
        };
        let stage84CauldronGate = {
            enabled: KL_STAGE7_SLIDING_CROSS.enabled,
            allowed: false,
            desiredCompare: KL_STAGE84_C30.cauldronGateBlockedRoom,
            writes: 0,
            lastCoord: {x: 0, y: 0},
            lastRole: 'none',
            lastAction: 'waiting',
            lastReadback: [],
            lastError: null,
        };
        let stage84C31DisposableCharm = {
            enabled: KL_STAGE84_C31_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
            requested: KL_STAGE84_C31_ENABLED,
            recordIndex: KL_STAGE84_C30.disposableRecordIndex,
            recordAddr: KL_STAGE84_C30.staticObjectTableStart +
                KL_STAGE84_C30.disposableRecordIndex * KL_STAGE84_C30.staticObjectRecordSize,
            target: null,
            desiredBytes: [],
            lastReadback: [],
            carried: false,
            referencedInLiveSlot: false,
            writes: 0,
            lastAction: 'waiting',
            lastError: null,
        };
        let stage84C32CarryProbe = {
            enabled: KL_STAGE7_SLIDING_CROSS.enabled,
            currentlyCarrying: false,
            current: null,
            firstSeenCoord: null,
            lastSeenCoord: null,
            firstSeenSample: null,
            lastSeenSample: null,
            carriedCoordKeys: [],
            transitionsWhileCarried: 0,
            lastTransitionKey: null,
            lastTransition: null,
            lastAction: 'waiting for a carried item/charm pointer',
        };
        let stage84C33CauldronAcceptance = {
            enabled: KL_STAGE84_C33_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
            requested: KL_STAGE84_C33_ENABLED,
            completions: 0,
            dropEvents: 0,
            lastCoord: {x: 0, y: 0},
            lastSector: null,
            lastState: null,
            lastRequiredSprite: null,
            lastCarriedSprite: null,
            lastMatch: false,
            lastReady: false,
            lastDropSignal: 'none',
            lastDropSignalKind: 'none',
            lastPlayerForm: 'unknown',
            lastPickupDropPressed: 0,
            lastObjDroppingIntoCauldron: 0,
            lastObjectsPutInCauldron: null,
            lastCantDrop: 0,
            lastAccepted: null,
            lastAction: KL_STAGE84_C33_ENABLED
                ? 'waiting for carried charm and player drop at a logical cauldron'
                : 'disabled; add ?stage84c33=1 to enable drop-gated JS-side cauldron acceptance',
        };
        let stage84C34RequestOrderPatch = {
            enabled: KL_STAGE84_C34_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
            requested: KL_STAGE84_C34_ENABLED,
            writes: 0,
            lastCoord: {x: 0, y: 0},
            lastRole: 'none',
            lastSector: null,
            targetCoord: null,
            targetRole: 'none',
            targetSector: null,
            targetCompleted: false,
            targetReason: 'none',
            objectsPutInCauldron: 0,
            currentIndex: null,
            patchAddr: null,
            previousValue: null,
            desiredIndex: null,
            desiredSprite: null,
            tableBytes: [],
            lastAction: KL_STAGE84_C34_ENABLED
                ? 'waiting for logical cauldron request context'
                : 'disabled; add ?stage84c34=1 to patch the original requested-object order slot',
            lastError: null,
        };
        let stage84C35aTimingProbe = {
            enabled: true,
            lastCoord: {x: 0, y: 0},
            lastRole: 'none',
            currentSprite: 0,
            currentKind: 'empty',
            expectedRequestSprite: null,
            expectedRequestIndex: null,
            contextKey: null,
            resetReason: 'initial',
            bytes: [],
            lastSprite: null,
            lastSpriteFrame: null,
            lastSpriteSample: null,
            spriteChanges: 0,
            lastSpriteDeltaFrames: null,
            lastSpriteDeltaSamples: null,
            minSpriteDeltaFrames: null,
            maxSpriteDeltaFrames: null,
            totalSpriteDeltaFrames: 0,
            requestFlashes: 0,
            lastRequestFrame: null,
            lastRequestSample: null,
            lastRequestDeltaFrames: null,
            lastRequestDeltaSamples: null,
            minRequestDeltaFrames: null,
            maxRequestDeltaFrames: null,
            totalRequestDeltaFrames: 0,
            recentSprites: [],
            lastAction: 'waiting for live cauldron bubble/display slot samples',
        };
        let stage84C35bSlowdownProbe = {
            requested: KL_STAGE84_C35B_ENABLED,
            enabled: KL_STAGE84_C35B_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
            mode: KL_STAGE84_C35B_HUMAN_BUBBLES_ENABLED ? 'request+human-bubble' : 'request-flash-only',
            holdFrames: KL_STAGE84_C35B_HOLD_FRAMES,
            writes: 0,
            releases: 0,
            targetSprite: null,
            targetVisibleFrames: 0,
            writeSprite: null,
            writeKind: 'none',
            holdWrites: [],
            holdDetail: '-',
            lastCoord: {x: 0, y: 0},
            lastRole: 'none',
            lastPlayerForm: 'unknown',
            lastObservedSprite: 0,
            lastObservedKind: 'empty',
            lastWriteFrame: null,
            lastAction: KL_STAGE84_C35B_ENABLED
                ? 'waiting for human-form cauldron request display sprite'
                : 'disabled; add ?stage84c35b=1 to try opt-in display slowdown',
            lastError: null,
        };
        let stage84C35cRoutineThrottle = {
            requested: KL_STAGE84_C35C_ENABLED,
            enabled: KL_STAGE84_C35C_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
            period: KL_STAGE84_C35C_PERIOD,
            originalMotionCall: null,
            originalGraphicCall: null,
            originalRequestReset: null,
            currentMotionCall: [],
            currentGraphicCall: [],
            currentRequestReset: [],
            patchState: 'unknown',
            cycle: 0,
            patches: 0,
            restores: 0,
            lastCoord: {x: 0, y: 0},
            lastRole: 'none',
            lastPlayerForm: 'unknown',
            lastObservedSprite: 0,
            lastAction: KL_STAGE84_C35C_ENABLED
                ? 'waiting to read original bubble updater call bytes'
                : 'disabled; add ?stage84c35c=1 for the routine-level throttle probe',
            lastError: null,
        };
        let stage84C35eBubbleRespawnGuard = {
            requested: KL_STAGE84_C35E_REQUESTED,
            enabled: KL_STAGE84_C35E_REQUESTED && KL_STAGE7_SLIDING_CROSS.enabled,
            entrySnapshot: null,
            armedEntrySnapshot: null,
            previousEntrySnapshot: null,
            pendingDeath: null,
            lastSnapshot: null,
            corrections: 0,
            writes: 0,
            lastPatchedAddrs: [],
            lastWrongRoom: null,
            lastTrigger: 'none',
            lastBodyJump: null,
            lastCoord: {x: 0, y: 0},
            lastRole: 'none',
            lastPlayerForm: 'unknown',
            lastLives: null,
            lastAction: KL_STAGE84_C35E_REQUESTED
                ? 'armed; recording every logical-room entry for general death recovery'
                : 'disabled with ?stage84c35e=0',
            lastError: null,
        };
        let stage84C35fGameOverOriginReset = {
            requested: KL_STAGE84_C35F_REQUESTED,
            enabled: KL_STAGE84_C35F_REQUESTED && KL_STAGE7_SLIDING_CROSS.enabled,
            previousLives: null,
            currentLives: null,
            pendingReset: null,
            gameOverLatched: false,
            sawActiveGame: false,
            zeroAfterActiveGame: false,
            resets: 0,
            writes: 0,
            charmRecordWrites: 0,
            lastCharmRecordBefore: [],
            lastCharmRecordAfter: [],
            lastCharmResetAction: KL_STAGE84_C31_ENABLED
                ? 'waiting for game-over cleanup'
                : 'C3.1 disposable charm is not requested',
            lastPatchedAddrs: [],
            lastFromCoord: null,
            lastTrigger: 'none',
            lastAction: KL_STAGE84_C35F_REQUESTED
                ? 'armed; waiting for original lives underflow 0x00 -> 0xFF'
                : 'disabled with ?stage84c35f=0',
            lastError: null,
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
        const fmtStage7WestFillerX = value => `${hexByte(value)} (${value})`;
        const fmtXYZ = (x, y, z) => `X=${fmtByte(x)}  Y=${fmtByte(y)}  Z=${fmtByte(z)}`;
        const fmtBytes = (bytes, limit = 24) => {
            if (!bytes.length) return '(none)';
            const head = bytes.slice(0, limit).map(hexByte).join(' ');
            return bytes.length > limit ? `${head} ... (${bytes.length} bytes)` : head;
        };
        const sameBytes = (a, b) => (
            a.length === b.length && a.every((value, index) => value === b[index])
        );
        const renderStage7WestFillerControl = (message = null, previewValue = null) => {
            const value = clampStage7WestFillerX(
                previewValue === null ? stage7WoodWallTuning.westFillerX : previewValue
            );
            if (stage7WestFillerXSlider) stage7WestFillerXSlider.value = String(value);
            if (stage7WestFillerXValue) stage7WestFillerXValue.textContent = fmtStage7WestFillerX(value);
            if (stage7WestFillerRecordsBody) {
                const records = [
                    ...buildStage7TranslatedNorthWallRecords().map((record, index) => ({
                        ...record,
                        background: hexByte(KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Id),
                        recordNumber: index + 1,
                    })),
                    ...buildStage7TranslatedWestWallRecords(value).map((record, index) => ({
                        ...record,
                        background: hexByte(KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Id),
                        recordNumber: index + 1,
                    })),
                ];

                stage7WestFillerRecordsBody.innerHTML = records.map(record => {
                    const bytes = record.bytes;
                    return `
                        <tr class="state-warn">
                            <td>${record.background}</td>
                            <td>${record.recordNumber}</td>
                            <td>${record.label}</td>
                            <td>${hexByte(bytes[0])}</td>
                            <td>${hexByte(bytes[1])}</td>
                            <td>${hexByte(bytes[2])}</td>
                            <td>${hexByte(bytes[3])}</td>
                            <td>${hexByte(bytes[4])}/${hexByte(bytes[5])}</td>
                            <td>${hexByte(bytes[6])}/${hexByte(bytes[7])}</td>
                            <td>${fmtBytes(bytes, 8)}</td>
                        </tr>
                    `;
                }).join('');
            }
            if (stage7WestFillerXStatus) {
                stage7WestFillerXStatus.textContent = message || [
                    `Selector 1 custom ${hexByte(KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Id)} west wall X is ${fmtStage7WestFillerX(value)}.`,
                    `Slider range is ${hexByte(KL_STAGE7_WEST_FILLER_X.min)}..${hexByte(KL_STAGE7_WEST_FILLER_X.max)}.`,
                    `Custom ${hexByte(KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Id)} replaces stone-derived north wall records at Y ${hexByte(KL_STAGE7_NORTH_WALL_Y)}; custom ${hexByte(KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Id)} replaces stone-derived west wall records at the slider X.`,
                    'Release the slider to rewrite static data; re-enter a rectangular wooden room if the current screen was already drawn.',
                ].join(' ');
            }
        };
        const getNonZeroOffsets = bytes => Array.from(bytes, (value, offset) => ({offset, value}))
            .filter(item => item.value !== 0);
        const allZero = bytes => getNonZeroOffsets(bytes).length === 0;
        const fmtNonZeroOffsets = offsets => {
            if (!offsets.length) return 'all sampled bytes zero';
            const head = offsets
                .slice(0, 12)
                .map(item => `+${hexByte(item.offset)}=${hexByte(item.value)}`)
                .join(' ');
            return offsets.length > 12
                ? `${head} ... (${offsets.length} non-zero byte(s))`
                : head;
        };
        const fmtNamedId = (value, names) => {
            const name = names[value] || 'unknown';
            return `${hexByte(value)} ${name}`;
        };
        const fmtMechanicSprite = value => {
            if (value === undefined) return 'unread';
            const name = KL_ITEM_NAMES[value] || 'unknown sprite/object';
            return `${hexByte(value)} ${name}`;
        };
        const isStage84ItemSprite = value => value >= 0x60 && value <= 0x67;
        const isStage84QuestCharmSprite = value => value >= 0x60 && value <= 0x66;
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

        const readBytesFromRange = (range, addr, length) => {
            const index = addr - range.start;
            if (index < 0 || index + length > range.data.length) return [];
            return Array.from(range.data.slice(index, index + length));
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

        const writeStage7CustomBackgrounds = async () => {
            const size2 = KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Bytes;
            const size3 = KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Bytes;
            const size2Addr = KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Addr;
            const size3Addr = KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Addr;
            const offsetAddr = KL_STAGE7_CUSTOM_BACKGROUNDS.offsetTableAddr +
                KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Id * 2;

            await emu.writeMemory(size2Addr, Uint8Array.from(size2));
            await emu.writeMemory(size3Addr, Uint8Array.from(size3));
            await emu.writeMemory(offsetAddr, Uint8Array.from([
                size2Addr & 0xff,
                (size2Addr >> 8) & 0xff,
                size3Addr & 0xff,
                (size3Addr >> 8) & 0xff,
            ]));
        };

        const applyStage7WestFillerX = async rawValue => {
            const value = clampStage7WestFillerX(rawValue);
            stage7WoodWallTuning = {
                ...stage7WoodWallTuning,
                westFillerX: value,
            };
            refreshStage7CustomBackgrounds();
            renderStage7WestFillerControl(
                `Prepared selector 1 west wall X ${fmtStage7WestFillerX(value)}; custom background bytes rebuilt.`
            );

            if (!stage7SlidingCross.enabled) {
                renderStage7WestFillerControl(
                    `Set selector 1 west wall X to ${fmtStage7WestFillerX(value)}. Stage 7 sliding is disabled, so nothing was written to emulator memory.`
                );
                return;
            }

            if (stage7SlidingCross.inFlight) {
                renderStage7WestFillerControl(
                    `Set selector 1 west wall X to ${fmtStage7WestFillerX(value)}. Stage 7 is already writing a cross; move the slider again after this write finishes.`
                );
                return;
            }

            if (typeof emu.writeMemory !== 'function') {
                renderStage7WestFillerControl(
                    `Set selector 1 west wall X to ${fmtStage7WestFillerX(value)}, but writeMemory is not available yet. It will apply on the next Stage 7 compile.`
                );
                return;
            }

            stage7SlidingCross = {
                ...stage7SlidingCross,
                attempted: false,
                done: false,
                message: `Selector 1 west wall X changed to ${hexByte(value)}; recompiling the Stage 7 cross.`,
            };

            try {
                await applyStage7CrossInjection(`Selector 1 west wall X ${hexByte(value)}`);
                renderStage7WestFillerControl(
                    stage7SlidingCross.done
                        ? `Applied selector 1 west wall X ${fmtStage7WestFillerX(value)} to custom background ${hexByte(KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Id)}. Leave and re-enter a rectangular wooden room if this screen was already drawn.`
                        : `Queued selector 1 west wall X ${fmtStage7WestFillerX(value)}; ${stage7SlidingCross.message}`
                );
            } catch (err) {
                renderStage7WestFillerControl(
                    `Failed to apply selector 1 west wall X ${fmtStage7WestFillerX(value)}: ${err.message || err}`
                );
            }
        };

        if (stage7WestFillerXSlider) {
            stage7WestFillerXSlider.min = String(KL_STAGE7_WEST_FILLER_X.min);
            stage7WestFillerXSlider.max = String(KL_STAGE7_WEST_FILLER_X.max);
            stage7WestFillerXSlider.step = '1';
            stage7WestFillerXSlider.value = String(stage7WoodWallTuning.westFillerX);
            stage7WestFillerXSlider.addEventListener('input', () => {
                const value = clampStage7WestFillerX(stage7WestFillerXSlider.value);
                renderStage7WestFillerControl(
                    `Preview selector 1 west wall X ${fmtStage7WestFillerX(value)}. Release the slider to write it.`,
                    value
                );
            });
            stage7WestFillerXSlider.addEventListener('change', () => {
                applyStage7WestFillerX(stage7WestFillerXSlider.value).catch(err => {
                    renderStage7WestFillerControl(`Failed to apply west wall X: ${err.message || err}`);
                });
            });
        }
        renderStage7WestFillerControl();

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
                    let bytes = new Uint8Array(patch.length);
                    if (
                        patch.kind === 'cauldron-background' &&
                        KL_STAGE82C_CAULDRON_VISUAL_ENABLED
                    ) {
                        bytes = Uint8Array.from(KL_STAGE82C_ORIGINAL_CAULDRON.cauldronBackgroundBytes);
                    } else if (
                        patch.kind === 'cauldron-bubbles' &&
                        KL_STAGE82C_CAULDRON_VISUAL_ENABLED &&
                        KL_STAGE82C_BUBBLES_ENABLED
                    ) {
                        bytes = Uint8Array.from(KL_STAGE82C_ORIGINAL_CAULDRON.bubbleTemplateBytes);
                    }
                    await emu.writeMemory(patch.addr, bytes);
                }
                if (KL_STAGE82C_CAULDRON_VISUAL_ENABLED) {
                    await emu.writeMemory(
                        KL_STAGE82C_ORIGINAL_CAULDRON.offsetTableAddr,
                        Uint8Array.from(KL_STAGE82C_ORIGINAL_CAULDRON.offsetTableBytes)
                    );
                }
                const cauldronMode = KL_STAGE82C_CAULDRON_VISUAL_ENABLED
                    ? `restored original cauldron background 0x13; bubbles ${describeStage82CBubbleMode(KL_STAGE82C_BUBBLE_MODE)}`
                    : 'zeroed cauldron background and bubbles';
                stage2RoomCleanPatch = {
                    attempted: true,
                    done: true,
                    message: `Cleaned wizard background and ${cauldronMode} for room ${hexByte(KL_STAGE2.centerRoom)}.`,
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
                    status += KL_STAGE82C_CAULDRON_VISUAL_ENABLED && entry.backgrounds.includes(0x13)
                        ? ' Original cauldron id 0x13 is active for the Phase C visual probe.'
                        : ' Wizard/cauldron ids remain in the compact entry but expand to null records.';
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
                `Procedural: ${stats.procedural.algorithm}; seed ${stats.procedural.worldSeed}; chunk ${stats.procedural.chunkSize}x${stats.procedural.chunkSize}; chunks ${stats.procedural.generatedChunks}; styles ${(stats.procedural.biomes || []).length}; style regions ${stats.procedural.generatedBiomeRegions || 0}.`,
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

        const formatQuestCharm = charm => {
            if (!charm) return '-';
            const sprite = Number.isInteger(charm.sprite)
                ? `, ${hexByte(charm.sprite)}`
                : '';
            return `${charm.label} (#${charm.id + 1}${sprite})`;
        };

        const formatQuestAnchor = anchor => (
            anchor ? `${fmtLogicalCoord(anchor)} l(${anchor.localX}, ${anchor.localY})` : '-'
        );

        const formatQuestSector = room => {
            const sector = room.questSector;
            if (!sector) return '-';
            const local = sector.local ? ` l(${sector.local.x}, ${sector.local.y})` : '';
            return `s(${sector.x}, ${sector.y})${local}`;
        };

        const formatQuestState = state => {
            if (!state) return '-';
            return [
                state.status,
                `unvisited ${state.unvisited ? 'yes' : 'no'}`,
                `cauldron ${state.cauldronSeen ? 'seen' : 'no'}`,
                `charm ${state.charmSeen ? 'seen' : 'no'}`,
                `collected ${state.charmCollected ? 'yes' : 'no'}`,
                `completed ${state.completed ? 'yes' : 'no'}`,
                `rev ${state.revision}`,
            ].join('; ');
        };

        const formatQuestReachability = reachability => {
            if (!reachability || reachability.reachable === null) return '-';
            const anchorState = `anchors ${reachability.cauldronExists ? 'C' : '-'}${reachability.charmExists ? 'H' : '-'}`;
            const path = reachability.reachable
                ? `path ${reachability.pathLength}`
                : 'no path';
            return `${reachability.reachable ? 'OK' : 'BAD'}; ${anchorState}; ${path}; searched ${reachability.searchedRooms}; margin ${reachability.marginChunks} chunk(s)`;
        };

        const formatQuestStaticDressing = staticDressing => {
            if (!staticDressing) return null;
            const parts = [];
            if (staticDressing.forceSquare) parts.push('forced square');
            if (Number.isInteger(staticDressing.colour)) parts.push(`colour ${staticDressing.colour}`);
            if (staticDressing.originalCharmRoom) {
                const original = staticDressing.originalCharmRoom;
                parts.push([
                    `original interior ${original.originalRoomHex}`,
                    `spawn ${fmtXYZ(original.spawn.x, original.spawn.y, original.spawn.z)}`,
                    `${original.blockRunCount} run(s)`,
                    `${original.blockObjectCount} object(s)`,
                    'generated architecture',
                ].join('; '));
            }
            if (staticDressing.extraBackgrounds && staticDressing.extraBackgrounds.length) {
                parts.push(`extra bg ${staticDressing.extraBackgrounds.map(value => fmtNamedId(value, KL_BACKGROUND_NAMES)).join(', ')}`);
            }
            if (staticDressing.originalCauldronVisual) {
                parts.push(`original cauldron visual; bubbles ${describeStage82CBubbleMode(staticDressing.originalCauldronBubbleMode || 'disabled')}`);
            }
            if (staticDressing.blockRuns && staticDressing.blockRuns.length) {
                const blocks = staticDressing.blockRuns.map(run => (
                    `${fmtNamedId(run.type, KL_BLOCK_NAMES)} x${run.positions ? run.positions.length : 0}`
                )).join(', ');
                parts.push(`blocks ${blocks}`);
            }
            return parts.join('; ');
        };

        const formatQuestDressing = dressing => {
            if (!dressing) return 'ordinary; visual unchanged';
            const staticDressing = formatQuestStaticDressing(dressing.staticDressing);
            return [
                dressing.phase,
                dressing.profile,
                `hazard ${dressing.hazardLevel}`,
                dressing.visual,
                dressing.gameplayBytes,
                staticDressing,
            ].filter(Boolean).join('; ');
        };

        const getStage8CurrentCoord = () => (
            stage7SlidingCross && stage7SlidingCross.center
                ? stage7SlidingCross.center
                : {x: 0, y: 0}
        );

        const describeStage82CBubbleMode = mode => {
            if (mode === 'global') return 'global high-risk';
            if (mode === 'cauldron') return 'cauldron-gated probe';
            if (mode === 'invalid') return 'invalid';
            return 'disabled';
        };

        const getStage82CBubbleContext = () => {
            const coord = getStage8CurrentCoord();
            const room = logicalMap.getRoomAt(coord.x, coord.y);
            const role = room.questRole || 'none';
            const desiredActive = !!(
                KL_STAGE82C_CAULDRON_VISUAL_ENABLED &&
                (
                    KL_STAGE82C_BUBBLE_MODE === 'global' ||
                    (KL_STAGE82C_BUBBLE_MODE === 'cauldron' && role === 'cauldron')
                )
            );
            return {coord, room, role, desiredActive};
        };

        const getStage82CBubbleTemplateBytes = sample => {
            const range = sample.cleanRoomPatches.find(patch => patch.kind === 'cauldron-bubbles');
            return range ? range.bytes : [];
        };

        const getStage84CauldronGateContext = () => {
            const coord = getStage8CurrentCoord();
            const room = logicalMap.getRoomAt(coord.x, coord.y);
            const role = room.questRole || 'none';
            const allowed = role === 'cauldron';
            return {
                coord,
                room,
                role,
                allowed,
                desiredCompare: allowed
                    ? KL_STAGE84_C30.cauldronPhysicalRoom
                    : KL_STAGE84_C30.cauldronGateBlockedRoom,
            };
        };

        const updateStage84CauldronGate = async () => {
            const context = getStage84CauldronGateContext();
            const enabled = !!(stage7SlidingCross.enabled && typeof emu.writeMemory === 'function');
            const readback = [];

            stage84CauldronGate = {
                ...stage84CauldronGate,
                enabled,
                allowed: context.allowed,
                desiredCompare: context.desiredCompare,
                lastCoord: cloneData(context.coord),
                lastRole: context.role,
                lastError: null,
            };

            if (!enabled) {
                stage84CauldronGate = {
                    ...stage84CauldronGate,
                    lastAction: stage7SlidingCross.enabled
                        ? 'writeMemory unavailable'
                        : 'disabled because Stage 7 sliding is off',
                    lastReadback: [],
                };
                return;
            }

            try {
                let writes = 0;
                for (const patch of KL_STAGE84_C30.cauldronGatePatches) {
                    const result = await emu.readMemory(patch.opcodeAddr, 2);
                    const bytes = Array.from(result.data);
                    const opcode = bytes[0];
                    const currentCompare = bytes[1];
                    const item = {
                        ...patch,
                        opcode,
                        currentCompare,
                        desiredCompare: context.desiredCompare,
                        patched: currentCompare === context.desiredCompare,
                    };

                    if (opcode !== 0xfe) {
                        readback.push({
                            ...item,
                            error: `expected CP opcode 0xFE, got ${hexByte(opcode)}`,
                        });
                        continue;
                    }

                    if (currentCompare !== context.desiredCompare) {
                        await emu.writeMemory(
                            patch.immediateAddr,
                            Uint8Array.from([context.desiredCompare])
                        );
                        writes++;
                        item.currentCompare = context.desiredCompare;
                        item.patched = true;
                    }

                    readback.push(item);
                }

                stage84CauldronGate = {
                    ...stage84CauldronGate,
                    writes: stage84CauldronGate.writes + writes,
                    lastReadback: readback,
                    lastAction: writes
                        ? `${writes} compare byte(s) updated`
                        : 'no write needed',
                    lastError: readback.some(item => item.error)
                        ? readback.filter(item => item.error).map(item => item.error).join('; ')
                        : null,
                };
            } catch (err) {
                stage84CauldronGate = {
                    ...stage84CauldronGate,
                    lastReadback: readback,
                    lastAction: 'write failed',
                    lastError: `Failed cauldron acceptance gate write: ${err}`,
                };
            }
        };

        const getStage84C31ObjectIndex = charm => {
            if (charm && Number.isInteger(charm.sprite) && isStage84QuestCharmSprite(charm.sprite)) {
                return charm.sprite - 0x60;
            }
            const id = charm && Number.isInteger(charm.id) ? charm.id : 0;
            return id % 7;
        };

        const getStage84C31Sprite = charm => {
            if (charm && Number.isInteger(charm.sprite) && isStage84QuestCharmSprite(charm.sprite)) {
                return charm.sprite;
            }
            return 0x60 + getStage84C31ObjectIndex(charm);
        };

        const formatStage84ObjectIndex = index => (
            Number.isInteger(index) && index >= 0 && index <= 6
                ? `${index} -> ${fmtMechanicSprite(0x60 + index)}`
                : index === null || index === undefined
                    ? '-'
                    : `${index} (not a quest charm index)`
        );

        const makeStage84C31InactiveRecord = () => {
            const pos = KL_STAGE84_C30.disposablePosition;
            return [
                0x00,
                pos.x, pos.y, pos.z,
                KL_STAGE84_C30.disposableInactiveRoom,
                pos.x, pos.y, pos.z,
                KL_STAGE84_C30.disposableInactiveRoom,
            ];
        };

        const findStage84C31Target = compiled => {
            if (!compiled || !compiled.roomSummaries) return null;
            const candidates = compiled.roomSummaries.filter(item => item.questRole === 'charm');
            if (!candidates.length) return null;
            const target = candidates.find(item => item.role === 'center') || candidates[0];
            return {
                ...target,
                sprite: getStage84C31Sprite(target.questCharm),
                objectIndex: getStage84C31ObjectIndex(target.questCharm),
            };
        };

        const makeStage84C31ActiveRecord = target => {
            const pos = target.originalCharmRoom && target.originalCharmRoom.spawn
                ? target.originalCharmRoom.spawn
                : KL_STAGE84_C30.disposablePosition;
            return [
                target.sprite,
                pos.x, pos.y, pos.z,
                target.physicalRoomId,
                pos.x, pos.y, pos.z,
                target.physicalRoomId,
            ];
        };

        const scanStage84C31References = workRange => {
            const recordAddr = stage84C31DisposableCharm.recordAddr;
            const liveRefs = [];
            for (const slot of KL_STAGE84_C30.liveSlots) {
                const bytes = readBytesFromRange(workRange, slot.addr, KL_STAGE84_C30.liveSlotSize);
                const ptr = (bytes[16] || 0) | ((bytes[17] || 0) << 8);
                if (ptr === recordAddr) liveRefs.push(slot.label);
            }

            const inventoryBytes = readBytesFromRange(
                workRange,
                KL_STAGE84_C30.inventoryStart,
                KL_STAGE84_C30.inventoryEnd - KL_STAGE84_C30.inventoryStart
            );
            const carriedRefs = [];
            for (const slot of KL_STAGE84_C30.inventorySlots) {
                const offset = slot.offset;
                const ptr = (inventoryBytes[offset + 2] || 0) | ((inventoryBytes[offset + 3] || 0) << 8);
                if (ptr === recordAddr) carriedRefs.push(slot.label);
            }

            return {liveRefs, carriedRefs};
        };

        const updateStage84C31ObservedState = workRange => {
            if (!stage84C31DisposableCharm.enabled || !workRange) return;
            const refs = scanStage84C31References(workRange);
            stage84C31DisposableCharm = {
                ...stage84C31DisposableCharm,
                carried: refs.carriedRefs.length > 0,
                referencedInLiveSlot: refs.liveRefs.length > 0,
                lastAction: refs.carriedRefs.length
                    ? `record referenced by ${refs.carriedRefs.join(', ')}`
                    : stage84C31DisposableCharm.lastAction,
            };
        };

        const applyStage84C31DisposableCharm = async compiled => {
            if (!stage84C31DisposableCharm.requested) {
                stage84C31DisposableCharm = {
                    ...stage84C31DisposableCharm,
                    enabled: false,
                    target: null,
                    desiredBytes: [],
                    lastAction: 'disabled; add ?stage84c31=1 to seed one disposable charm object',
                };
                return;
            }

            if (!KL_STAGE7_SLIDING_CROSS.enabled || typeof emu.writeMemory !== 'function') {
                stage84C31DisposableCharm = {
                    ...stage84C31DisposableCharm,
                    enabled: false,
                    target: null,
                    desiredBytes: [],
                    lastAction: KL_STAGE7_SLIDING_CROSS.enabled
                        ? 'writeMemory unavailable'
                        : 'disabled because Stage 7 sliding is off',
                };
                return;
            }

            if (stage84C31DisposableCharm.carried) {
                stage84C31DisposableCharm = {
                    ...stage84C31DisposableCharm,
                    enabled: true,
                    lastAction: 'skipped static-record write while disposable object is carried',
                    lastError: null,
                };
                return;
            }

            const target = findStage84C31Target(compiled);
            const desiredBytes = target
                ? makeStage84C31ActiveRecord(target)
                : makeStage84C31InactiveRecord();

            try {
                const result = await emu.readMemory(
                    stage84C31DisposableCharm.recordAddr,
                    KL_STAGE84_C30.staticObjectRecordSize
                );
                const currentBytes = Array.from(result.data);
                if (!sameBytes(currentBytes, desiredBytes)) {
                    await emu.writeMemory(
                        stage84C31DisposableCharm.recordAddr,
                        Uint8Array.from(desiredBytes)
                    );
                }

                stage84C31DisposableCharm = {
                    ...stage84C31DisposableCharm,
                    enabled: true,
                    target,
                    desiredBytes,
                    lastReadback: desiredBytes,
                    writes: stage84C31DisposableCharm.writes + (sameBytes(currentBytes, desiredBytes) ? 0 : 1),
                    lastAction: target
                        ? `seeded ${fmtMechanicSprite(target.sprite)} in ${target.role} ${hexByte(target.physicalRoomId)} ${fmtLogicalCoord(target.logicalCoord)}`
                        : 'disabled disposable record; no charm room in current five-room cross',
                    lastError: null,
                };
            } catch (err) {
                stage84C31DisposableCharm = {
                    ...stage84C31DisposableCharm,
                    enabled: true,
                    lastError: `Failed disposable charm record write: ${err}`,
                    lastAction: 'write failed',
                };
            }
        };

        const forceStage84C31InactiveForNewGame = async reason => {
            if (!stage84C31DisposableCharm.requested) {
                return {
                    requested: false,
                    written: false,
                    bytesWritten: 0,
                    before: [],
                    after: [],
                    action: 'C3.1 disposable charm is not requested',
                };
            }

            const desiredBytes = makeStage84C31InactiveRecord();
            const result = await emu.readMemory(
                stage84C31DisposableCharm.recordAddr,
                KL_STAGE84_C30.staticObjectRecordSize
            );
            const currentBytes = Array.from(result.data);
            const written = !sameBytes(currentBytes, desiredBytes);
            if (written) {
                await emu.writeMemory(
                    stage84C31DisposableCharm.recordAddr,
                    Uint8Array.from(desiredBytes)
                );
            }
            const action = written
                ? `${reason}; forced disposable record inactive`
                : `${reason}; disposable record already inactive`;
            stage84C31DisposableCharm = {
                ...stage84C31DisposableCharm,
                enabled: true,
                target: null,
                desiredBytes,
                lastReadback: desiredBytes,
                carried: false,
                referencedInLiveSlot: false,
                writes: stage84C31DisposableCharm.writes + (written ? 1 : 0),
                lastAction: action,
                lastError: null,
            };
            return {
                requested: true,
                written,
                bytesWritten: written ? KL_STAGE84_C30.staticObjectRecordSize : 0,
                before: currentBytes,
                after: desiredBytes,
                action,
            };
        };

        const updateStage82CBubbleProbe = async (workRange, sample) => {
            const context = getStage82CBubbleContext();
            const templateBytes = getStage82CBubbleTemplateBytes(sample);
            const liveBytes = readBytesFromRange(
                workRange,
                KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr,
                KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotLength
            );
            const original = KL_STAGE82C_ORIGINAL_CAULDRON.bubbleTemplateBytes;
            const zeroBytes = new Array(original.length).fill(0);
            const desiredBytes = context.desiredActive ? original : zeroBytes;
            const templateActive = sameBytes(templateBytes, original);
            const templateZeroed = allZero(templateBytes);
            const canWrite = (
                KL_STAGE82C_CAULDRON_VISUAL_ENABLED &&
                KL_STAGE82C_BUBBLE_MODE !== 'invalid' &&
                typeof emu.writeMemory === 'function'
            );

            stage82CBubbleProbe = {
                ...stage82CBubbleProbe,
                desiredActive: context.desiredActive,
                templateActive,
                templateZeroed,
                lastCoord: cloneData(context.coord),
                lastRole: context.role,
                lastTemplateBytes: templateBytes,
                lastLiveBytes: liveBytes,
                lastError: null,
            };

            if (!canWrite || sameBytes(templateBytes, desiredBytes)) {
                stage82CBubbleProbe = {
                    ...stage82CBubbleProbe,
                    lastAction: canWrite
                        ? 'no write needed'
                        : KL_STAGE82C_BUBBLE_MODE === 'invalid'
                        ? `invalid mode "${stage82CBubbleProbe.requested}"`
                        : 'write unavailable or visual proof disabled',
                };
                return;
            }

            try {
                await emu.writeMemory(
                    KL_STAGE82C_ORIGINAL_CAULDRON.bubbleTemplateAddr,
                    Uint8Array.from(desiredBytes)
                );
                stage82CBubbleProbe = {
                    ...stage82CBubbleProbe,
                    writes: stage82CBubbleProbe.writes + 1,
                    templateActive: context.desiredActive,
                    templateZeroed: !context.desiredActive,
                    lastTemplateBytes: desiredBytes,
                    lastAction: context.desiredActive
                        ? `restored template for ${fmtLogicalCoord(context.coord)}`
                        : `zeroed template for ${fmtLogicalCoord(context.coord)}`,
                    lastError: null,
                };
            } catch (err) {
                stage82CBubbleProbe = {
                    ...stage82CBubbleProbe,
                    lastError: `Failed bubble-template gate write: ${err}`,
                    lastAction: 'write failed',
                };
            }
        };

        const renderStage82CBubbleProbeRow = () => {
            const mode = describeStage82CBubbleMode(stage82CBubbleProbe.mode);
            const templateState = stage82CBubbleProbe.templateActive
                ? 'template restored'
                : stage82CBubbleProbe.templateZeroed
                ? 'template zeroed'
                : 'template mixed/unknown';
            const desired = stage82CBubbleProbe.desiredActive ? 'desired active' : 'desired off';
            const live = stage82CBubbleProbe.lastLiveBytes.length
                ? fmtBytes(stage82CBubbleProbe.lastLiveBytes, 10)
                : '(unread)';
            const state = stage82CBubbleProbe.mode === 'invalid'
                ? 'bad'
                : stage82CBubbleProbe.desiredActive
                ? 'warn'
                : 'ok';
            const warning = stage82CBubbleProbe.mode === 'global'
                ? ' Global mode is intentionally high risk and was already observed to produce bubbles in every room.'
                : stage82CBubbleProbe.mode === 'cauldron'
                ? ' Gated mode is a timing probe; if bubbles leak after exit, the live slots probably need separate handling.'
                : '';
            setRow(
                'stage82CBubbles',
                `${mode}; ${desired}; ${templateState}`,
                `Current ${fmtLogicalCoord(stage82CBubbleProbe.lastCoord)} role ${stage82CBubbleProbe.lastRole}; requested "${stage82CBubbleProbe.requested}"; writes ${stage82CBubbleProbe.writes}; last action ${stage82CBubbleProbe.lastAction}; live ${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr)}: ${live}.${stage82CBubbleProbe.lastError ? ` ${stage82CBubbleProbe.lastError}` : ''}${warning}`,
                state
            );
        };

        const renderStage8QuestTable = () => {
            if (!stage8QuestTbody || !stage8QuestStatus) return;

            const currentCoord = getStage8CurrentCoord();
            const currentRoom = logicalMap.getRoomAt(currentCoord.x, currentCoord.y);
            const currentSector = logicalMap.getQuestSectorAt(currentCoord.x, currentCoord.y);
            const currentReachability = logicalMap.getQuestReachabilityAt(currentCoord.x, currentCoord.y);
            const quest = currentSector.quest || {exists: false};
            const anchors = quest.exists
                ? `cauldron ${formatQuestAnchor(quest.cauldron)}; charm ${formatQuestAnchor(quest.charm)}`
                : 'no quest anchors';
            const currentState = currentSector.state;
            const rows = [
                {
                    probe: 'current',
                    room: currentRoom,
                    role: currentRoom.questRole,
                    state: currentState,
                    reachability: currentReachability,
                    dressing: currentRoom.questDressing,
                    notes: `${currentRoom.source}; ${currentRoom.label}`,
                },
            ];

            if (quest.exists) {
                const cauldronRoom = logicalMap.getRoomAt(quest.cauldron.x, quest.cauldron.y);
                const charmRoom = logicalMap.getRoomAt(quest.charm.x, quest.charm.y);
                rows.push(
                    {
                        probe: 'cauldron',
                        room: cauldronRoom,
                        role: 'cauldron',
                        state: currentState,
                        reachability: currentReachability,
                        dressing: cauldronRoom.questDressing,
                        notes: `anchor placement ${quest.placement}; difficulty ${quest.difficulty}`,
                    },
                    {
                        probe: 'charm',
                        room: charmRoom,
                        role: 'charm',
                        state: currentState,
                        reachability: currentReachability,
                        dressing: charmRoom.questDressing,
                        notes: 'metadata only; charm type is global, not sector-bound',
                    }
                );
            }

            const apiProbeRoom = logicalMap.getRoomAt(12, -4);
            const apiProbeSector = logicalMap.getQuestSectorAt(12, -4);
            const apiProbeReachability = logicalMap.getQuestReachabilityAt(12, -4);
            rows.push({
                probe: 'API probe',
                room: apiProbeRoom,
                role: apiProbeRoom.questRole,
                state: apiProbeSector.state,
                reachability: apiProbeReachability,
                dressing: apiProbeRoom.questDressing,
                notes: 'window.KnightLoreInfinity.logicalMap.getQuestSectorAt(12, -4)',
            });

            stage8QuestStatus.textContent = [
                `Current ${fmtLogicalCoord(currentCoord)} -> sector (${currentSector.sectorX}, ${currentSector.sectorY}).`,
                quest.exists
                    ? `Required ${formatQuestCharm(quest.requiredCharm)}; ${anchors}.`
                    : 'This sector has no quest.',
                `Persistent sector state: ${formatQuestState(currentState)}.`,
                `Reachability: ${formatQuestReachability(currentReachability)}.`,
                KL_STAGE82C_CAULDRON_VISUAL_ENABLED
                    ? `Phase C visual proof is enabled: original cauldron background 0x13 is restored; bubbles ${describeStage82CBubbleMode(KL_STAGE82C_BUBBLE_MODE)}.`
                    : 'Phase B uses safe static room bytes only; no original object/item/cauldron memory is touched.',
                KL_STAGE84_C31_ENABLED
                    ? `C3.1 disposable charm probe requested: static object record ${KL_STAGE84_C30.disposableRecordIndex} may be reseeded; inventory, charm-order, and completion bytes are still not directly written.`
                    : 'C3.1 disposable charm probe is off.',
                KL_STAGE84_C36_ORIGINAL_CHARM_ROOMS_ENABLED
                    ? 'C3.6 original charm-room interiors are enabled: generated topology/architecture is preserved while one deterministic original special-object room supplies the interior block groups and charm XYZ.'
                    : 'C3.6 original charm-room interiors are off.',
                KL_STAGE84_C33_ENABLED
                    ? 'C3.3 drop-gated JS-side cauldron acceptance is on: matching carried charm sprites can complete the persistent sector state after a player drop action.'
                    : 'C3.3 JS-side cauldron acceptance is off.',
                KL_STAGE84_C34_ENABLED
                    ? 'C3.4 request-order patch is on: the active original objects_required slot may be patched for the current or adjacent logical cauldron.'
                    : 'C3.4 request-order patch is off.',
                `Diagnostics build: ${KL_DIAGNOSTICS_BUILD}.`,
            ].join(' ');

            stage8QuestTbody.innerHTML = rows.map(item => {
                const room = item.room;
                const roomQuest = room.meta && room.meta.quest ? room.meta.quest.quest : quest;
                const charm = roomQuest && roomQuest.requiredCharm ? roomQuest.requiredCharm : null;
                const state = item.reachability && item.reachability.reachable === false
                    ? 'bad'
                    : (item.role === 'cauldron' || item.role === 'charm' ? 'warn' : 'ok');
                return `
                    <tr class="state-${state}">
                        <td>${escapeHtml(item.probe)}</td>
                        <td>${escapeHtml(fmtLogicalCoord(room.coord))}</td>
                        <td>${escapeHtml(formatQuestSector(room))}</td>
                        <td>${escapeHtml(item.role || 'none')}</td>
                        <td>${escapeHtml(formatQuestCharm(charm))}</td>
                        <td>${escapeHtml(roomQuest && roomQuest.exists ? `cauldron ${formatQuestAnchor(roomQuest.cauldron)}; charm ${formatQuestAnchor(roomQuest.charm)}` : '-')}</td>
                        <td>${escapeHtml(formatQuestState(item.state))}</td>
                        <td>${escapeHtml(formatQuestReachability(item.reachability))}</td>
                        <td>${escapeHtml(formatQuestDressing(item.dressing || room.questDressing))}</td>
                        <td>${escapeHtml(item.notes)}</td>
                    </tr>
                `;
            }).join('');
        };

        const getStage84StaticRecordIndexForPtr = ptr => {
            if (
                ptr < KL_STAGE84_C30.staticObjectTableStart ||
                ptr >= KL_STAGE84_C30.staticObjectTableEnd
            ) return null;
            const offset = ptr - KL_STAGE84_C30.staticObjectTableStart;
            if (offset % KL_STAGE84_C30.staticObjectRecordSize !== 0) return null;
            return offset / KL_STAGE84_C30.staticObjectRecordSize;
        };

        const formatStage84Pointer = ptr => {
            if (!ptr) return `${hexWord(ptr)} null`;
            const recordIndex = getStage84StaticRecordIndexForPtr(ptr);
            return recordIndex === null
                ? `${hexWord(ptr)} outside static object table`
                : `${hexWord(ptr)} -> static object ${recordIndex}`;
        };

        const decodeStage84CarryState = workRange => {
            const values = KL_STAGE84_C30.stateBytes.map(item => ({
                ...item,
                value: readByte(workRange, item.addr),
            }));
            const bytes = readBytesFromRange(
                workRange,
                KL_STAGE84_C30.carryStateStart,
                KL_STAGE84_C30.carryStateEnd - KL_STAGE84_C30.carryStateStart
            );
            return {
                values,
                bytes,
                decode: values.map(item => (
                    `${item.label}=${item.value === undefined ? 'unread' : hexByte(item.value)}`
                )).join('; '),
                changed: values.some(item => item.value !== undefined && item.value !== 0),
            };
        };

        const getStage84CarryStateValue = (carryState, label) => {
            const item = carryState && carryState.values
                ? carryState.values.find(value => value.label === label)
                : null;
            return item && item.value !== undefined ? item.value : 0;
        };

        const decodeStage84PlayerForm = workRange => {
            const bodySprite = readByte(workRange, 0x5c08);
            const bodyOrientationSprite = readByte(workRange, 0x5c41);
            const bodyMirrorSprite = readByte(workRange, 0x5c45);
            const human = (
                (bodySprite >= 0x10 && bodySprite <= 0x1d) ||
                bodyOrientationSprite === 0x18 ||
                bodyOrientationSprite === 0x19 ||
                bodyMirrorSprite === 0x18 ||
                bodyMirrorSprite === 0x19
            );
            const wolf = (
                (bodySprite >= 0x30 && bodySprite <= 0x3f) ||
                bodyOrientationSprite === 0x1d ||
                bodyOrientationSprite === 0x1e ||
                bodyMirrorSprite === 0x1d ||
                bodyMirrorSprite === 0x1e
            );
            const transforming = bodySprite >= 0x5c && bodySprite <= 0x5f;
            const kind = human
                ? 'human'
                : wolf
                    ? 'wolf'
                    : transforming
                        ? 'transforming'
                        : 'unknown';
            return {
                kind,
                acceptDrop: kind === 'human' || kind === 'unknown',
                bodySprite,
                bodyOrientationSprite,
                bodyMirrorSprite,
                text: `${kind}; body ${hexByte(bodySprite || 0)}; 0x5C41 ${hexByte(bodyOrientationSprite || 0)}; 0x5C45 ${hexByte(bodyMirrorSprite || 0)}`,
            };
        };

        const decodeStage84InventorySlot = (bytes, slot) => {
            const offset = slot.offset;
            const graphic = bytes[offset] || 0;
            const flags = bytes[offset + 1] || 0;
            const ptr = (bytes[offset + 2] || 0) | ((bytes[offset + 3] || 0) << 8);
            const staticRecordIndex = getStage84StaticRecordIndexForPtr(ptr);
            const itemLike = isStage84ItemSprite(graphic);
            const empty = graphic === 0 && flags === 0 && ptr === 0;
            return {
                ...slot,
                graphic,
                flags,
                ptr,
                staticRecordIndex,
                itemLike,
                empty,
                decode: `${slot.label} ${hexWord(slot.addr)}: ${graphic ? fmtMechanicSprite(graphic) : 'empty'}; flags ${hexByte(flags)}; ptr ${formatStage84Pointer(ptr)}`,
            };
        };

        const decodeStage84InventoryState = workRange => {
            const bytes = readBytesFromRange(
                workRange,
                KL_STAGE84_C30.inventoryStart,
                KL_STAGE84_C30.inventoryEnd - KL_STAGE84_C30.inventoryStart
            );
            const slots = KL_STAGE84_C30.inventorySlots.map(slot => decodeStage84InventorySlot(bytes, slot));
            return {
                bytes,
                slots,
                decode: slots.map(slot => slot.decode).join('; '),
                changed: !allZero(bytes),
            };
        };

        const getStage84PrimaryCarriedSlot = inventoryState => {
            if (!inventoryState || !inventoryState.slots) return null;
            const active = inventoryState.slots.filter(slot => (
                !slot.empty &&
                (slot.itemLike || slot.ptr !== 0)
            ));
            if (!active.length) return null;
            return (
                active.find(slot => slot.label.startsWith('carried display') && slot.ptr) ||
                active.find(slot => slot.label.startsWith('carried display')) ||
                active.find(slot => slot.ptr) ||
                active[0]
            );
        };

        const getStage84C32CarriedSource = slot => {
            const fromDisposable = !!(slot && slot.ptr === stage84C31DisposableCharm.recordAddr);
            const target = fromDisposable ? stage84C31DisposableCharm.target : null;
            const sourceCoord = target && target.logicalCoord ? cloneData(target.logicalCoord) : null;
            const sourceSector = sourceCoord
                ? logicalMap.getQuestSectorAt(sourceCoord.x, sourceCoord.y)
                : null;
            const questCharm = target && target.questCharm
                ? cloneData(target.questCharm)
                : sourceSector && sourceSector.quest && sourceSector.quest.requiredCharm
                    ? cloneData(sourceSector.quest.requiredCharm)
                    : null;

            return {
                fromDisposable,
                target: target ? cloneData(target) : null,
                sourceCoord,
                sourceSector: sourceSector
                    ? {
                        x: sourceSector.sectorX,
                        y: sourceSector.sectorY,
                        key: sourceSector.key,
                    }
                    : null,
                questCharm,
                sourceLabel: fromDisposable
                    ? `C3.1 disposable record ${stage84C31DisposableCharm.recordIndex}`
                    : slot && slot.staticRecordIndex !== null
                        ? `original static object ${slot.staticRecordIndex}`
                        : 'no static-table source pointer',
            };
        };

        const updateStage84C32CarryProbe = (inventoryState, sample, currentCoord, currentRoom, currentSector) => {
            const slot = getStage84PrimaryCarriedSlot(inventoryState);
            if (!stage84C32CarryProbe.enabled) {
                stage84C32CarryProbe = {
                    ...stage84C32CarryProbe,
                    current: null,
                    currentlyCarrying: false,
                    lastAction: 'disabled because Stage 7 sliding is off',
                };
                return;
            }

            if (!slot) {
                const wasCarrying = stage84C32CarryProbe.currentlyCarrying;
                stage84C32CarryProbe = {
                    ...stage84C32CarryProbe,
                    current: null,
                    currentlyCarrying: false,
                    lastSeenCoord: cloneData(currentCoord),
                    lastSeenSample: sampleCount,
                    lastAction: wasCarrying
                        ? `carried object no longer observed at ${fmtLogicalCoord(currentCoord)}`
                        : 'no carried object observed',
                };
                return;
            }

            const source = getStage84C32CarriedSource(slot);
            const coordKey = logicalCoordKey(currentCoord.x, currentCoord.y);
            const signature = `${slot.graphic}:${slot.flags}:${slot.ptr}`;
            const previousSignature = stage84C32CarryProbe.current
                ? stage84C32CarryProbe.current.signature
                : null;
            const continuingCarry = stage84C32CarryProbe.currentlyCarrying &&
                previousSignature === signature;
            const baseCoordKeys = continuingCarry ? stage84C32CarryProbe.carriedCoordKeys : [];
            const carriedCoordKeys = baseCoordKeys.includes(coordKey)
                ? baseCoordKeys
                : [...baseCoordKeys, coordKey];
            const transition = sample && sample.stage7Action && sample.stage7Action.recentered
                ? sample.stage7Action
                : null;
            const transitionKey = transition
                ? `${transition.frame}:${transition.sample}:${transition.direction}:${logicalCoordKey(transition.newCenter.x, transition.newCenter.y)}`
                : null;
            const newTransition = transitionKey && transitionKey !== stage84C32CarryProbe.lastTransitionKey;
            const currentQuest = currentSector && currentSector.quest ? currentSector.quest : {exists: false};
            const exactMatch = !!(
                source.questCharm &&
                currentQuest.requiredCharm &&
                source.questCharm.id === currentQuest.requiredCharm.id
            );
            const spriteMatch = !!(
                currentQuest.requiredCharm &&
                getStage84C31Sprite(currentQuest.requiredCharm) === slot.graphic
            );

            stage84C32CarryProbe = {
                ...stage84C32CarryProbe,
                currentlyCarrying: true,
                current: {
                    slot: {...slot},
                    signature,
                    source,
                    currentCoord: cloneData(currentCoord),
                    currentRole: currentRoom.questRole || 'none',
                    currentQuest: cloneData(currentQuest),
                    exactMatch,
                    spriteMatch,
                    objectClass: isStage84QuestCharmSprite(slot.graphic) ? slot.graphic - 0x60 : null,
                },
                firstSeenCoord: continuingCarry
                    ? stage84C32CarryProbe.firstSeenCoord
                    : cloneData(currentCoord),
                lastSeenCoord: cloneData(currentCoord),
                firstSeenSample: continuingCarry
                    ? stage84C32CarryProbe.firstSeenSample
                    : sampleCount,
                lastSeenSample: sampleCount,
                carriedCoordKeys,
                transitionsWhileCarried: (continuingCarry ? stage84C32CarryProbe.transitionsWhileCarried : 0) + (newTransition ? 1 : 0),
                lastTransitionKey: transitionKey || (continuingCarry ? stage84C32CarryProbe.lastTransitionKey : null),
                lastTransition: transition
                    ? cloneData(transition)
                    : continuingCarry
                        ? stage84C32CarryProbe.lastTransition
                        : null,
                lastAction: `${fmtMechanicSprite(slot.graphic)} carried via ${formatStage84Pointer(slot.ptr)}`,
            };
        };

        const formatStage84C32Identity = current => {
            if (!current) return 'no carried item/charm observed';
            const slot = current.slot;
            return [
                `${slot.label}`,
                fmtMechanicSprite(slot.graphic),
                `object class ${current.objectClass === null ? 'unknown' : current.objectClass}`,
                `flags ${hexByte(slot.flags)}`,
                `ptr ${formatStage84Pointer(slot.ptr)}`,
                current.source.sourceLabel,
                `source charm ${formatQuestCharm(current.source.questCharm)}`,
            ].join('; ');
        };

        const formatStage84C32SourceRoom = current => {
            if (!current) return '-';
            const source = current.source;
            if (!source.target) return source.sourceLabel;
            return [
                source.target.label,
                fmtLogicalCoord(source.target.logicalCoord),
                `physical ${hexByte(source.target.physicalRoomId)}`,
                `seed role ${source.target.role}`,
            ].join('; ');
        };

        const formatStage84C32Stability = () => {
            const first = stage84C32CarryProbe.firstSeenCoord
                ? fmtLogicalCoord(stage84C32CarryProbe.firstSeenCoord)
                : '-';
            const last = stage84C32CarryProbe.lastSeenCoord
                ? fmtLogicalCoord(stage84C32CarryProbe.lastSeenCoord)
                : '-';
            const trail = stage84C32CarryProbe.carriedCoordKeys.length
                ? stage84C32CarryProbe.carriedCoordKeys.slice(-8).join(' -> ')
                : 'none';
            const transition = stage84C32CarryProbe.lastTransition
                ? `${stage84C32CarryProbe.lastTransition.direction} to ${fmtLogicalCoord(stage84C32CarryProbe.lastTransition.newCenter)}`
                : 'none observed';
            return `first ${first} at sample ${stage84C32CarryProbe.firstSeenSample || '-'}; last ${last} at sample ${stage84C32CarryProbe.lastSeenSample || '-'}; rooms ${stage84C32CarryProbe.carriedCoordKeys.length}; transitions ${stage84C32CarryProbe.transitionsWhileCarried}; last transition ${transition}; trail ${trail}`;
        };

        const formatStage84C32SectorMatch = current => {
            if (!current) return 'no carried item/charm observed';
            const required = current.currentQuest && current.currentQuest.requiredCharm
                ? current.currentQuest.requiredCharm
                : null;
            return [
                `current role ${current.currentRole}`,
                `current sector requires ${formatQuestCharm(required)}`,
                `carried exact source ${formatQuestCharm(current.source.questCharm)}`,
                `exact JS match ${current.exactMatch ? 'yes' : 'no'}`,
                `sprite-class match ${current.spriteMatch ? 'yes' : 'no'}`,
            ].join('; ');
        };

        const describeStage84C33AcceptedSource = current => {
            if (!current) return null;
            const source = current.source || {};
            return {
                slot: current.slot
                    ? {
                        label: current.slot.label,
                        sprite: current.slot.graphic,
                        ptr: current.slot.ptr,
                        staticRecordIndex: current.slot.staticRecordIndex,
                    }
                    : null,
                sourceLabel: source.sourceLabel || null,
                sourceCoord: source.sourceCoord ? cloneData(source.sourceCoord) : null,
                sourceSector: source.sourceSector ? cloneData(source.sourceSector) : null,
                sourceCharm: source.questCharm ? cloneData(source.questCharm) : null,
            };
        };

        const updateStage84C33CauldronAcceptance = (currentCoord, currentRoom, currentSector, carryState, workRange) => {
            const quest = currentSector && currentSector.quest ? currentSector.quest : {exists: false};
            const state = currentSector ? currentSector.state : null;
            const carried = stage84C32CarryProbe.current;
            const carriedSprite = carried && carried.slot ? carried.slot.graphic : null;
            const requiredSprite = quest.requiredCharm ? getStage84C31Sprite(quest.requiredCharm) : null;
            const atCauldron = currentRoom && currentRoom.questRole === 'cauldron';
            const carriedCharm = isStage84QuestCharmSprite(carriedSprite);
            const playerForm = decodeStage84PlayerForm(workRange);
            const pickupDropPressed = getStage84CarryStateValue(carryState, 'pickup_drop_pressed');
            const objDroppingIntoCauldron = getStage84CarryStateValue(carryState, 'obj_dropping_into_cauldron');
            const objectsPutInCauldron = getStage84CarryStateValue(carryState, 'objects_put_in_cauldron');
            const cantDrop = getStage84CarryStateValue(carryState, 'cant_drop');
            const pickupDropEdge = pickupDropPressed !== 0 && stage84C33CauldronAcceptance.lastPickupDropPressed === 0;
            const objDroppingEdge = objDroppingIntoCauldron !== 0 &&
                stage84C33CauldronAcceptance.lastObjDroppingIntoCauldron === 0;
            const objectsPutChanged = (
                stage84C33CauldronAcceptance.lastObjectsPutInCauldron !== null &&
                objectsPutInCauldron !== stage84C33CauldronAcceptance.lastObjectsPutInCauldron
            );
            const dropSignal = objDroppingEdge
                ? 'obj_dropping_into_cauldron edge'
                : objectsPutChanged
                    ? 'objects_put_in_cauldron changed'
                    : pickupDropEdge
                        ? 'pickup/drop edge'
                        : 'none';
            const dropSignalKind = objDroppingEdge || objectsPutChanged
                ? 'strong'
                : pickupDropEdge
                    ? 'input'
                    : 'none';
            const spriteMatch = !!(
                carried &&
                carriedCharm &&
                requiredSprite !== null &&
                carriedSprite === requiredSprite
            );
            const ready = !!(
                stage84C33CauldronAcceptance.requested &&
                KL_STAGE7_SLIDING_CROSS.enabled &&
                quest.exists &&
                atCauldron &&
                state &&
                !state.completed &&
                carried &&
                carriedCharm &&
                spriteMatch
            );
            const dropAllowed = dropSignalKind === 'strong' || (
                dropSignalKind === 'input' &&
                cantDrop === 0
            );
            const readyDropEvent = ready && playerForm.acceptDrop && dropAllowed;
            let nextState = state;
            let accepted = false;
            let action = stage84C33CauldronAcceptance.lastAction;
            let lastAccepted = stage84C33CauldronAcceptance.lastAccepted;

            if (!stage84C33CauldronAcceptance.requested) {
                action = 'disabled; add ?stage84c33=1 to enable drop-gated JS-side cauldron acceptance';
            } else if (!KL_STAGE7_SLIDING_CROSS.enabled) {
                action = 'disabled because Stage 7 sliding is off';
            } else if (!quest.exists) {
                action = 'current sector has no quest';
            } else if (!atCauldron) {
                action = `waiting for logical cauldron; current role ${currentRoom.questRole || 'none'}`;
            } else if (state && state.completed) {
                action = lastAccepted
                    ? `sector (${currentSector.sectorX}, ${currentSector.sectorY}) already completed; last accepted after ${lastAccepted.dropSignal}`
                    : `sector (${currentSector.sectorX}, ${currentSector.sectorY}) already completed`;
            } else if (!carried) {
                action = 'at logical cauldron, but no carried item/charm observed';
            } else if (!carriedCharm) {
                action = `at logical cauldron, but carried sprite ${fmtMechanicSprite(carriedSprite)} is not a quest charm`;
            } else if (!spriteMatch) {
                action = `at logical cauldron, but carried ${fmtMechanicSprite(carriedSprite)} does not match required ${fmtMechanicSprite(requiredSprite)}`;
            } else if (!playerForm.acceptDrop) {
                action = `ready, but player form is ${playerForm.kind}; drop in human form`;
            } else if (!dropAllowed) {
                action = dropSignalKind === 'input' && cantDrop !== 0
                    ? `ready, but original cant_drop is ${hexByte(cantDrop)}`
                    : 'ready; press pickup/drop in human form at the cauldron';
            } else {
                const result = logicalMap.markQuestCompletedAt(currentCoord.x, currentCoord.y, {
                    sample: sampleCount,
                    charm: quest.requiredCharm,
                    source: describeStage84C33AcceptedSource(carried),
                    dropSignal,
                    playerForm,
                });
                nextState = result.state;
                accepted = result.changed;
                if (accepted) {
                    lastAccepted = {
                        coord: cloneData(currentCoord),
                        sector: {
                            x: currentSector.sectorX,
                            y: currentSector.sectorY,
                            key: currentSector.key,
                        },
                        sample: sampleCount,
                        sprite: carriedSprite,
                        requiredCharm: quest.requiredCharm ? cloneData(quest.requiredCharm) : null,
                        source: describeStage84C33AcceptedSource(carried),
                        dropSignal,
                        playerForm,
                    };
                }
                action = result.changed
                    ? `completed sector (${currentSector.sectorX}, ${currentSector.sectorY}) with ${fmtMechanicSprite(carriedSprite)} after ${dropSignal}`
                    : `matching charm observed; sector (${currentSector.sectorX}, ${currentSector.sectorY}) was already complete`;
            }

            stage84C33CauldronAcceptance = {
                ...stage84C33CauldronAcceptance,
                enabled: KL_STAGE84_C33_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
                lastCoord: cloneData(currentCoord),
                lastSector: currentSector
                    ? {
                        x: currentSector.sectorX,
                        y: currentSector.sectorY,
                        key: currentSector.key,
                    }
                    : null,
                lastState: nextState ? cloneData(nextState) : null,
                lastRequiredSprite: requiredSprite,
                lastCarriedSprite: carriedSprite,
                lastMatch: spriteMatch,
                lastReady: ready,
                lastDropSignal: dropSignal,
                lastDropSignalKind: dropSignalKind,
                lastPlayerForm: playerForm.text,
                lastPickupDropPressed: pickupDropPressed,
                lastObjDroppingIntoCauldron: objDroppingIntoCauldron,
                lastObjectsPutInCauldron: objectsPutInCauldron,
                lastCantDrop: cantDrop,
                dropEvents: stage84C33CauldronAcceptance.dropEvents + (readyDropEvent ? 1 : 0),
                completions: stage84C33CauldronAcceptance.completions + (accepted ? 1 : 0),
                lastAccepted,
                lastAction: action,
            };
        };

        const formatStage84C33Acceptance = () => {
            const state = stage84C33CauldronAcceptance.lastState;
            return [
                `requested ${stage84C33CauldronAcceptance.requested ? 'yes' : 'no'}`,
                `enabled ${stage84C33CauldronAcceptance.enabled ? 'yes' : 'no'}`,
                `required ${stage84C33CauldronAcceptance.lastRequiredSprite === null ? '-' : fmtMechanicSprite(stage84C33CauldronAcceptance.lastRequiredSprite)}`,
                `carried ${stage84C33CauldronAcceptance.lastCarriedSprite === null ? '-' : fmtMechanicSprite(stage84C33CauldronAcceptance.lastCarriedSprite)}`,
                `sprite match ${stage84C33CauldronAcceptance.lastMatch ? 'yes' : 'no'}`,
                `ready ${stage84C33CauldronAcceptance.lastReady ? 'yes' : 'no'}`,
                `drop signal ${stage84C33CauldronAcceptance.lastDropSignal}`,
                `player ${stage84C33CauldronAcceptance.lastPlayerForm}`,
                `cant_drop ${hexByte(stage84C33CauldronAcceptance.lastCantDrop || 0)}`,
                `state ${state ? formatQuestState(state) : '-'}`,
                `ready drop events ${stage84C33CauldronAcceptance.dropEvents}`,
                `completions ${stage84C33CauldronAcceptance.completions}`,
                `last accepted ${stage84C33CauldronAcceptance.lastAccepted ? stage84C33CauldronAcceptance.lastAccepted.dropSignal : 'none'}`,
                `last action ${stage84C33CauldronAcceptance.lastAction}`,
            ].join('; ');
        };

        const formatStage84C33Room = () => {
            const sector = stage84C33CauldronAcceptance.lastSector;
            const coord = stage84C33CauldronAcceptance.lastCoord;
            const accepted = stage84C33CauldronAcceptance.lastAccepted;
            return [
                `logical ${fmtLogicalCoord(coord)}`,
                sector ? `sector (${sector.x}, ${sector.y})` : 'sector -',
                accepted ? `last accepted ${fmtLogicalCoord(accepted.coord)} at sample ${accepted.sample}` : 'no accepted charm yet',
            ].join('; ');
        };

        const updateStage84C32C33FromSnapshot = (workRange, sample) => {
            const currentCoord = getStage8CurrentCoord();
            const currentRoom = logicalMap.getRoomAt(currentCoord.x, currentCoord.y);
            const currentSector = logicalMap.getQuestSectorAt(currentCoord.x, currentCoord.y);
            const inventoryState = decodeStage84InventoryState(workRange);
            const carryState = decodeStage84CarryState(workRange);
            updateStage84C32CarryProbe(inventoryState, sample, currentCoord, currentRoom, currentSector);
            updateStage84C33CauldronAcceptance(currentCoord, currentRoom, currentSector, carryState, workRange);
        };

        const getStage84C34RequestPatchTarget = (currentCoord, currentRoom, currentSector) => {
            const currentQuest = currentSector && currentSector.quest
                ? currentSector.quest
                : {exists: false};
            if (currentRoom.questRole === 'cauldron' && currentQuest.exists) {
                return {
                    coord: currentCoord,
                    room: currentRoom,
                    sector: currentSector,
                    quest: currentQuest,
                    role: 'cauldron',
                    reason: 'current logical cauldron',
                    direction: null,
                };
            }

            for (const direction of KL_DIRECTIONS) {
                const delta = KL_DIRECTION_DELTAS[direction];
                const opposite = KL_OPPOSITE_DIRECTIONS[direction];
                const coord = {
                    x: currentCoord.x + delta.x,
                    y: currentCoord.y + delta.y,
                };
                const room = logicalMap.getRoomAt(coord.x, coord.y);
                const sector = logicalMap.getQuestSectorAt(coord.x, coord.y);
                const quest = sector && sector.quest ? sector.quest : {exists: false};
                const reachableFromCurrent = !!(
                    currentRoom.exits &&
                    currentRoom.exits[direction] &&
                    room.exits &&
                    room.exits[opposite]
                );
                if (room.questRole === 'cauldron' && quest.exists && reachableFromCurrent) {
                    return {
                        coord,
                        room,
                        sector,
                        quest,
                        role: 'adjacent-cauldron',
                        reason: `pre-armed adjacent ${direction} cauldron`,
                        direction,
                    };
                }
            }

            return null;
        };

        const updateStage84C34RequestOrderPatch = async workRange => {
            const currentCoord = getStage8CurrentCoord();
            const currentRoom = logicalMap.getRoomAt(currentCoord.x, currentCoord.y);
            const currentSector = logicalMap.getQuestSectorAt(currentCoord.x, currentCoord.y);
            const target = getStage84C34RequestPatchTarget(currentCoord, currentRoom, currentSector);
            const quest = target && target.quest ? target.quest : {exists: false};
            const targetState = target && target.sector ? target.sector.state : null;
            const role = currentRoom.questRole || 'none';
            const objectsPutInCauldron = getStage84CarryStateValue(
                decodeStage84CarryState(workRange),
                'objects_put_in_cauldron'
            );
            let tableBytes = stage84C34RequestOrderPatch.tableBytes;
            let lastAction = stage84C34RequestOrderPatch.lastAction;
            let lastError = null;
            let patchAddr = null;
            let previousValue = null;
            let desiredIndex = quest.requiredCharm ? getStage84C31ObjectIndex(quest.requiredCharm) : null;
            let desiredSprite = quest.requiredCharm ? getStage84C31Sprite(quest.requiredCharm) : null;
            let writes = 0;

            const setState = extra => {
                stage84C34RequestOrderPatch = {
                    ...stage84C34RequestOrderPatch,
                    enabled: KL_STAGE84_C34_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
                    lastCoord: cloneData(currentCoord),
                    lastRole: role,
                    lastSector: currentSector
                        ? {
                            x: currentSector.sectorX,
                            y: currentSector.sectorY,
                            key: currentSector.key,
                        }
                        : null,
                    targetCoord: target ? cloneData(target.coord) : null,
                    targetRole: target ? target.role : 'none',
                    targetSector: target && target.sector
                        ? {
                            x: target.sector.sectorX,
                            y: target.sector.sectorY,
                            key: target.sector.key,
                        }
                        : null,
                    targetCompleted: !!(targetState && targetState.completed),
                    targetReason: target ? target.reason : 'none',
                    objectsPutInCauldron,
                    currentIndex: objectsPutInCauldron >= 0 && objectsPutInCauldron < KL_STAGE84_C30.objectsRequiredLength
                        ? objectsPutInCauldron
                        : null,
                    patchAddr,
                    previousValue,
                    desiredIndex,
                    desiredSprite,
                    tableBytes,
                    writes: stage84C34RequestOrderPatch.writes + writes,
                    lastAction,
                    lastError,
                    ...extra,
                };
            };

            if (!stage84C34RequestOrderPatch.requested) {
                lastAction = 'disabled; add ?stage84c34=1 to patch the original requested-object order slot';
                setState({enabled: false});
                return;
            }

            if (!KL_STAGE7_SLIDING_CROSS.enabled || typeof emu.readMemory !== 'function') {
                lastAction = KL_STAGE7_SLIDING_CROSS.enabled
                    ? 'readMemory unavailable'
                    : 'disabled because Stage 7 sliding is off';
                setState({enabled: false});
                return;
            }

            try {
                const result = await emu.readMemory(
                    KL_STAGE84_C30.objectsRequiredAddr,
                    KL_STAGE84_C30.objectsRequiredLength
                );
                tableBytes = Array.from(result.data);
            } catch (err) {
                lastError = `Failed to read objects_required table: ${err}`;
                lastAction = 'read failed';
                setState({enabled: true});
                return;
            }

            if (typeof emu.writeMemory !== 'function') {
                lastAction = 'writeMemory unavailable';
                setState({enabled: false});
                return;
            }

            if (!target || !quest.exists) {
                lastAction = `waiting for current/adjacent logical cauldron; current role ${role}`;
                setState({enabled: true});
                return;
            }

            if (objectsPutInCauldron < 0 || objectsPutInCauldron >= KL_STAGE84_C30.objectsRequiredLength) {
                lastError = `objects_put_in_cauldron ${hexByte(objectsPutInCauldron)} is outside the 14-entry request table`;
                lastAction = 'refused to patch out-of-range request slot';
                setState({enabled: true});
                return;
            }

            patchAddr = KL_STAGE84_C30.objectsRequiredAddr + objectsPutInCauldron;
            previousValue = tableBytes[objectsPutInCauldron];

            if (targetState && targetState.completed) {
                lastAction = `${target.reason}: target sector already completed; request slot left unchanged`;
                setState({enabled: true});
                return;
            }

            if (!Number.isInteger(desiredIndex) || desiredIndex < 0 || desiredIndex > 6) {
                lastError = `Desired request index ${desiredIndex} is not in 0..6`;
                lastAction = 'refused invalid desired request index';
                setState({enabled: true});
                return;
            }

            if (previousValue !== desiredIndex) {
                try {
                    await emu.writeMemory(patchAddr, Uint8Array.from([desiredIndex]));
                    tableBytes = tableBytes.slice();
                    tableBytes[objectsPutInCauldron] = desiredIndex;
                    writes = 1;
                    lastAction = `${target.reason}: patched request slot ${objectsPutInCauldron} from ${formatStage84ObjectIndex(previousValue)} to ${formatStage84ObjectIndex(desiredIndex)}`;
                } catch (err) {
                    lastError = `Failed to patch objects_required slot: ${err}`;
                    lastAction = 'write failed';
                }
            } else {
                lastAction = `${target.reason}: request slot ${objectsPutInCauldron} already matches ${formatStage84ObjectIndex(desiredIndex)}`;
            }

            setState({enabled: true});
        };

        const formatStage84C34RequestPatch = () => {
            const patch = stage84C34RequestOrderPatch;
            return [
                `requested ${patch.requested ? 'yes' : 'no'}`,
                `enabled ${patch.enabled ? 'yes' : 'no'}`,
                `objects_put ${hexByte(patch.objectsPutInCauldron || 0)}`,
                `slot ${patch.currentIndex === null ? '-' : patch.currentIndex}`,
                `desired ${formatStage84ObjectIndex(patch.desiredIndex)}`,
                `previous ${formatStage84ObjectIndex(patch.previousValue)}`,
                `display sprite ${patch.desiredSprite === null ? '-' : fmtMechanicSprite(patch.desiredSprite)}`,
                `target completed ${patch.targetCompleted ? 'yes' : 'no'}`,
                `writes ${patch.writes}`,
                `last action ${patch.lastAction}`,
            ].join('; ');
        };

        const formatStage84C34Room = () => {
            const patch = stage84C34RequestOrderPatch;
            const sector = patch.targetSector;
            return [
                `current ${fmtLogicalCoord(patch.lastCoord)} role ${patch.lastRole}`,
                patch.targetCoord ? `target ${fmtLogicalCoord(patch.targetCoord)} ${patch.targetReason}` : 'target -',
                sector ? `sector (${sector.x}, ${sector.y})` : 'sector -',
                patch.patchAddr === null ? 'patch addr -' : `patch addr ${hexWord(patch.patchAddr)}`,
            ].join('; ');
        };

        const classifyStage84C35aSprite = sprite => {
            if (!sprite) return 'empty';
            if (sprite >= 0xa0 && sprite <= 0xa7) return 'bubble frame';
            if (sprite >= 0xa8 && sprite <= 0xae) return 'request flash';
            return 'other';
        };

        const formatStage84C35aDelta = (frames, samples) => (
            frames === null || samples === null
                ? '-'
                : `${frames} frame(s), ${samples} sample(s)`
        );

        const formatStage84C35aAverage = (total, count) => (
            count > 0 ? (total / count).toFixed(1) : '-'
        );

        const formatStage84C35aRange = (min, max) => (
            min === null || max === null ? '-' : `${min}..${max} frame(s)`
        );

        const updateStage84C35aMinMax = (min, max, value) => ({
            min: min === null ? value : Math.min(min, value),
            max: max === null ? value : Math.max(max, value),
        });

        const updateStage84C35aTimingProbe = workRange => {
            const coord = getStage8CurrentCoord();
            const room = logicalMap.getRoomAt(coord.x, coord.y);
            const sector = logicalMap.getQuestSectorAt(coord.x, coord.y);
            const quest = sector && sector.quest ? sector.quest : {exists: false};
            const expectedRequestIndex = quest.requiredCharm
                ? getStage84C31ObjectIndex(quest.requiredCharm)
                : null;
            const expectedRequestSprite = Number.isInteger(expectedRequestIndex)
                ? 0xa8 + expectedRequestIndex
                : null;
            const bytes = readBytesFromRange(
                workRange,
                KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr,
                KL_STAGE84_C30.liveSlotSize
            );
            const sprite = bytes[0] || 0;
            const kind = classifyStage84C35aSprite(sprite);
            const frame = frameCompletedCount;
            const sample = sampleCount;
            const role = room.questRole || 'none';
            const contextKey = [
                logicalCoordKey(coord.x, coord.y),
                role,
                expectedRequestSprite === null ? '-' : expectedRequestSprite,
            ].join(':');
            const rawPrevious = stage84C35aTimingProbe;
            const contextChanged = rawPrevious.contextKey !== null && rawPrevious.contextKey !== contextKey;
            const activeStarted = rawPrevious.currentKind === 'empty' && kind !== 'empty';
            const resetReason = contextChanged
                ? 'logical room/request context changed'
                : activeStarted
                    ? 'live slot became active'
                    : rawPrevious.resetReason;
            const previous = contextChanged || activeStarted
                ? {
                    ...rawPrevious,
                    lastSprite: null,
                    lastSpriteFrame: null,
                    lastSpriteSample: null,
                    spriteChanges: 0,
                    lastSpriteDeltaFrames: null,
                    lastSpriteDeltaSamples: null,
                    minSpriteDeltaFrames: null,
                    maxSpriteDeltaFrames: null,
                    totalSpriteDeltaFrames: 0,
                    requestFlashes: 0,
                    lastRequestFrame: null,
                    lastRequestSample: null,
                    lastRequestDeltaFrames: null,
                    lastRequestDeltaSamples: null,
                    minRequestDeltaFrames: null,
                    maxRequestDeltaFrames: null,
                    totalRequestDeltaFrames: 0,
                    recentSprites: [],
                }
                : rawPrevious;
            let next = {
                ...previous,
                enabled: true,
                lastCoord: cloneData(coord),
                lastRole: role,
                currentSprite: sprite,
                currentKind: kind,
                expectedRequestSprite,
                expectedRequestIndex,
                contextKey,
                resetReason,
                bytes,
            };

            const firstSprite = previous.lastSprite === null;
            const spriteChanged = firstSprite || sprite !== previous.lastSprite;
            if (spriteChanged) {
                const deltaFrames = firstSprite ? null : frame - previous.lastSpriteFrame;
                const deltaSamples = firstSprite ? null : sample - previous.lastSpriteSample;
                let minMax = {
                    min: previous.minSpriteDeltaFrames,
                    max: previous.maxSpriteDeltaFrames,
                };

                if (!firstSprite) {
                    minMax = updateStage84C35aMinMax(
                        previous.minSpriteDeltaFrames,
                        previous.maxSpriteDeltaFrames,
                        deltaFrames
                    );
                }

                next = {
                    ...next,
                    lastSprite: sprite,
                    lastSpriteFrame: frame,
                    lastSpriteSample: sample,
                    spriteChanges: previous.spriteChanges + (firstSprite ? 0 : 1),
                    lastSpriteDeltaFrames: deltaFrames,
                    lastSpriteDeltaSamples: deltaSamples,
                    minSpriteDeltaFrames: minMax.min,
                    maxSpriteDeltaFrames: minMax.max,
                    totalSpriteDeltaFrames: previous.totalSpriteDeltaFrames + (firstSprite ? 0 : deltaFrames),
                    recentSprites: [
                        ...previous.recentSprites,
                        `${frame}:${fmtMechanicSprite(sprite)}`,
                    ].slice(-14),
                };
            }

            const isRequestFlash = kind === 'request flash';
            const newRequestFlash = isRequestFlash && (
                previous.currentKind !== 'request flash' ||
                previous.currentSprite !== sprite
            );
            if (newRequestFlash) {
                const firstRequest = previous.lastRequestFrame === null;
                const deltaFrames = firstRequest ? null : frame - previous.lastRequestFrame;
                const deltaSamples = firstRequest ? null : sample - previous.lastRequestSample;
                let minMax = {
                    min: previous.minRequestDeltaFrames,
                    max: previous.maxRequestDeltaFrames,
                };

                if (!firstRequest) {
                    minMax = updateStage84C35aMinMax(
                        previous.minRequestDeltaFrames,
                        previous.maxRequestDeltaFrames,
                        deltaFrames
                    );
                }

                next = {
                    ...next,
                    requestFlashes: previous.requestFlashes + 1,
                    lastRequestFrame: frame,
                    lastRequestSample: sample,
                    lastRequestDeltaFrames: deltaFrames,
                    lastRequestDeltaSamples: deltaSamples,
                    minRequestDeltaFrames: minMax.min,
                    maxRequestDeltaFrames: minMax.max,
                    totalRequestDeltaFrames: previous.totalRequestDeltaFrames + (firstRequest ? 0 : deltaFrames),
                };
            }

            const expectedText = expectedRequestSprite === null
                ? 'no expected request sprite'
                : `expected ${fmtMechanicSprite(expectedRequestSprite)}`;
            next.lastAction = `${kind}; ${fmtMechanicSprite(sprite)}; ${expectedText}`;
            stage84C35aTimingProbe = next;
        };

        const getStage84C35aDynamicCandidates = workRange => {
            const candidates = [];
            for (let index = 0; index < KL_STAGE84_C30.dynamicProbeCount; index++) {
                const addr = KL_STAGE84_C30.dynamicStart + index * KL_STAGE84_C30.dynamicSlotSize;
                const bytes = readBytesFromRange(workRange, addr, 8);
                const sprite = bytes[0] || 0;
                if (sprite >= 0xa0 && sprite <= 0xae) {
                    candidates.push({
                        index,
                        addr,
                        sprite,
                        kind: classifyStage84C35aSprite(sprite),
                        bytes,
                    });
                }
            }
            return candidates;
        };

        const formatStage84C35aTiming = () => {
            const probe = stage84C35aTimingProbe;
            return [
                `current ${fmtMechanicSprite(probe.currentSprite)} (${probe.currentKind})`,
                `expected request ${probe.expectedRequestSprite === null ? '-' : fmtMechanicSprite(probe.expectedRequestSprite)}`,
                `sprite changes ${probe.spriteChanges}`,
                `last phase ${formatStage84C35aDelta(probe.lastSpriteDeltaFrames, probe.lastSpriteDeltaSamples)}`,
                `avg phase ${formatStage84C35aAverage(probe.totalSpriteDeltaFrames, probe.spriteChanges)} frame(s)`,
                `phase range ${formatStage84C35aRange(probe.minSpriteDeltaFrames, probe.maxSpriteDeltaFrames)}`,
                `request flashes ${probe.requestFlashes}`,
                `last flash gap ${formatStage84C35aDelta(probe.lastRequestDeltaFrames, probe.lastRequestDeltaSamples)}`,
                `avg flash gap ${formatStage84C35aAverage(probe.totalRequestDeltaFrames, Math.max(0, probe.requestFlashes - 1))} frame(s)`,
                `flash range ${formatStage84C35aRange(probe.minRequestDeltaFrames, probe.maxRequestDeltaFrames)}`,
                `reset ${probe.resetReason}`,
            ].join('; ');
        };

        const formatStage84C35aRoom = () => (
            [
                `logical ${fmtLogicalCoord(stage84C35aTimingProbe.lastCoord)}`,
                `role ${stage84C35aTimingProbe.lastRole}`,
                `frame ${frameCompletedCount}`,
                `sample ${sampleCount}`,
            ].join('; ')
        );

        const formatStage84C35aTrail = () => (
            stage84C35aTimingProbe.recentSprites.length
                ? stage84C35aTimingProbe.recentSprites.join(' -> ')
                : 'no sprite changes observed yet'
        );

        const formatStage84C35aDynamicCandidates = candidates => (
            candidates.length
                ? candidates.map(item => (
                    `${item.index}:${fmtMechanicSprite(item.sprite)} (${item.kind}) @${hexWord(item.addr)}`
                )).join('; ')
                : 'none in sampled dynamic records'
        );

        const getStage84C35bHoldCandidate = (sprite, playerForm, workRange) => {
            if (sprite >= 0xa8 && sprite <= 0xae) {
                return {
                    sprite,
                    kind: 'request flash',
                    writes: [{offset: 0, value: sprite}],
                    detail: 'sprite only',
                };
            }
            if (
                KL_STAGE84_C35B_HUMAN_BUBBLES_ENABLED &&
                playerForm.kind === 'human' &&
                sprite >= 0xa0 &&
                sprite <= 0xa3
            ) {
                const base = KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr;
                const z = readByte(workRange, base + 3);
                const dz = readByte(workRange, base + 11);
                if (z === undefined || dz === undefined) return null;
                return {
                    sprite,
                    kind: 'human bubble motion',
                    writes: [
                        {offset: 0, value: sprite},
                        {offset: 3, value: z},
                        {offset: 11, value: dz},
                    ],
                    detail: `sprite/Z/dZ; Z ${hexByte(z)}; dZ ${hexByte(dz)}`,
                };
            }
            return null;
        };

        const updateStage84C35bSlowdownProbe = async workRange => {
            const coord = getStage8CurrentCoord();
            const room = logicalMap.getRoomAt(coord.x, coord.y);
            const role = room.questRole || 'none';
            const playerForm = decodeStage84PlayerForm(workRange);
            const observedSprite = stage84C35aTimingProbe.currentSprite;
            const observedKind = stage84C35aTimingProbe.currentKind;
            const contextChanged = (
                stage84C35bSlowdownProbe.lastCoord.x !== coord.x ||
                stage84C35bSlowdownProbe.lastCoord.y !== coord.y ||
                stage84C35bSlowdownProbe.lastRole !== role ||
                stage84C35bSlowdownProbe.lastPlayerForm !== playerForm.kind
            );
            let targetSprite = contextChanged ? null : stage84C35bSlowdownProbe.targetSprite;
            let targetVisibleFrames = contextChanged ? 0 : stage84C35bSlowdownProbe.targetVisibleFrames;
            const holdCandidate = getStage84C35bHoldCandidate(observedSprite, playerForm, workRange);
            let writeSprite = holdCandidate ? holdCandidate.sprite : null;
            let writeKind = holdCandidate ? holdCandidate.kind : 'none';
            let holdWrites = contextChanged ? [] : stage84C35bSlowdownProbe.holdWrites;
            let holdDetail = contextChanged ? '-' : stage84C35bSlowdownProbe.holdDetail;
            let writes = 0;
            let releases = 0;
            let lastAction = stage84C35bSlowdownProbe.lastAction;
            let lastError = null;
            let lastWriteFrame = stage84C35bSlowdownProbe.lastWriteFrame;

            const setState = extra => {
                stage84C35bSlowdownProbe = {
                    ...stage84C35bSlowdownProbe,
                    enabled: KL_STAGE84_C35B_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
                    holdFrames: KL_STAGE84_C35B_HOLD_FRAMES,
                    writes: stage84C35bSlowdownProbe.writes + writes,
                    releases: stage84C35bSlowdownProbe.releases + releases,
                    targetSprite,
                    targetVisibleFrames,
                    writeSprite,
                    writeKind,
                    holdWrites,
                    holdDetail,
                    lastCoord: cloneData(coord),
                    lastRole: role,
                    lastPlayerForm: playerForm.kind,
                    lastObservedSprite: observedSprite,
                    lastObservedKind: observedKind,
                    lastWriteFrame,
                    lastAction,
                    lastError,
                    ...extra,
                };
            };

            if (!stage84C35bSlowdownProbe.requested) {
                lastAction = 'disabled; add ?stage84c35b=1 to try opt-in display slowdown';
                setState({enabled: false});
                return;
            }

            if (KL_STAGE84_C35C_ENABLED) {
                targetSprite = null;
                targetVisibleFrames = 0;
                writeSprite = null;
                writeKind = 'none';
                holdWrites = [];
                holdDetail = '-';
                lastAction = 'suspended because C3.5c routine-level throttle is enabled';
                setState({enabled: false});
                return;
            }

            if (!KL_STAGE7_SLIDING_CROSS.enabled || typeof emu.writeMemory !== 'function') {
                lastAction = KL_STAGE7_SLIDING_CROSS.enabled
                    ? 'writeMemory unavailable'
                    : 'disabled because Stage 7 sliding is off';
                setState({enabled: false});
                return;
            }

            if (role !== 'cauldron') {
                targetSprite = null;
                targetVisibleFrames = 0;
                writeSprite = null;
                writeKind = 'none';
                holdWrites = [];
                holdDetail = '-';
                lastAction = `waiting for logical cauldron; current role ${role}`;
                setState({enabled: true});
                return;
            }

            if (playerForm.kind !== 'human') {
                targetSprite = null;
                targetVisibleFrames = 0;
                writeSprite = null;
                writeKind = 'none';
                holdWrites = [];
                holdDetail = '-';
                lastAction = `hazard-safe pause; player ${playerForm.kind}; bubble logic left original`;
                setState({enabled: true});
                return;
            }

            if (writeSprite === null) {
                targetSprite = null;
                targetVisibleFrames = 0;
                writeKind = 'none';
                holdWrites = [];
                holdDetail = '-';
                const bubblePolicy = KL_STAGE84_C35B_HUMAN_BUBBLES_ENABLED
                    ? 'waiting for human 0xA0..0xA3 bubble or 0xA8..0xAE request flash'
                    : 'bubble frame left original; waiting for 0xA8..0xAE request flash';
                lastAction = `${bubblePolicy}; observed ${fmtMechanicSprite(observedSprite)} (${observedKind})`;
                setState({enabled: true});
                return;
            }

            if (targetSprite !== observedSprite) {
                targetSprite = observedSprite;
                targetVisibleFrames = 1;
                holdWrites = holdCandidate.writes;
                holdDetail = holdCandidate.detail;
            } else {
                targetVisibleFrames += 1;
            }

            if (targetVisibleFrames < KL_STAGE84_C35B_HOLD_FRAMES) {
                try {
                    for (const item of holdWrites) {
                        await emu.writeMemory(
                            KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr + item.offset,
                            Uint8Array.from([item.value])
                        );
                    }
                    writes = 1;
                    lastWriteFrame = frameCompletedCount;
                    lastAction = `holding ${writeKind} ${fmtMechanicSprite(targetSprite)} ${targetVisibleFrames}/${KL_STAGE84_C35B_HOLD_FRAMES}; rewrote ${holdDetail}`;
                } catch (err) {
                    lastError = `Failed C3.5b sprite hold write: ${err}`;
                    lastAction = 'write failed';
                }
            } else {
                const releasedSprite = targetSprite;
                const releasedKind = writeKind;
                const releasedFrames = targetVisibleFrames;
                releases = 1;
                targetSprite = null;
                targetVisibleFrames = 0;
                writeSprite = null;
                writeKind = 'none';
                holdWrites = [];
                holdDetail = '-';
                lastAction = `released ${releasedKind} ${fmtMechanicSprite(releasedSprite)} after ${releasedFrames}/${KL_STAGE84_C35B_HOLD_FRAMES} observed frame(s); next candidate starts a fresh hold cycle`;
            }

            setState({enabled: true});
        };

        const formatStage84C35bSlowdown = () => (
            [
                `requested ${stage84C35bSlowdownProbe.requested ? 'yes' : 'no'}`,
                `enabled ${stage84C35bSlowdownProbe.enabled ? 'yes' : 'no'}`,
                `mode ${stage84C35bSlowdownProbe.mode}`,
                `hold ${stage84C35bSlowdownProbe.holdFrames} frame(s)`,
                `player ${stage84C35bSlowdownProbe.lastPlayerForm}`,
                `observed ${fmtMechanicSprite(stage84C35bSlowdownProbe.lastObservedSprite)} (${stage84C35bSlowdownProbe.lastObservedKind})`,
                `target ${stage84C35bSlowdownProbe.targetSprite === null ? '-' : fmtMechanicSprite(stage84C35bSlowdownProbe.targetSprite)}`,
                `visible ${stage84C35bSlowdownProbe.targetVisibleFrames}/${stage84C35bSlowdownProbe.holdFrames}`,
                `write ${stage84C35bSlowdownProbe.writeSprite === null ? '-' : fmtMechanicSprite(stage84C35bSlowdownProbe.writeSprite)}`,
                `write kind ${stage84C35bSlowdownProbe.writeKind}`,
                `hold detail ${stage84C35bSlowdownProbe.holdDetail}`,
                `hold bytes ${stage84C35bSlowdownProbe.holdWrites.length ? stage84C35bSlowdownProbe.holdWrites.map(item => `+${item.offset}:${hexByte(item.value)}`).join(' ') : '-'}`,
                `writes ${stage84C35bSlowdownProbe.writes}`,
                `releases ${stage84C35bSlowdownProbe.releases}`,
                `last action ${stage84C35bSlowdownProbe.lastAction}`,
            ].join('; ')
        );

        const formatStage84C35bRoom = () => (
            [
                `logical ${fmtLogicalCoord(stage84C35bSlowdownProbe.lastCoord)}`,
                `role ${stage84C35bSlowdownProbe.lastRole}`,
                stage84C35bSlowdownProbe.lastWriteFrame === null
                    ? 'no write yet'
                    : `last write frame ${stage84C35bSlowdownProbe.lastWriteFrame}`,
            ].join('; ')
        );

        const KL_STAGE84_C35C_NOP_CALL = [0x00, 0x00, 0x00];
        const KL_STAGE84_C35C_EARLY_EXIT = [
            0xc3,
            KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateExitAddr & 0xff,
            KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateExitAddr >> 8,
        ];
        const KL_STAGE84_C35C_EXPECTED_REQUEST_RESET = [0xdd, 0x36, 0x00, 0xa0];
        const KL_STAGE84_C35C_NOP_RESET = [0x00, 0x00, 0x00, 0x00];
        const isStage84C35cPatchBytes = bytes => (
            sameBytes(bytes, KL_STAGE84_C35C_NOP_CALL) ||
            sameBytes(bytes, KL_STAGE84_C35C_EARLY_EXIT) ||
            sameBytes(bytes, KL_STAGE84_C35C_NOP_RESET)
        );

        const readStage84C35cCallBytes = async () => {
            const motion = await emu.readMemory(KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateMotionCallAddr, 3);
            const graphic = await emu.readMemory(KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateGraphicCallAddr, 3);
            const requestReset = await emu.readMemory(KL_STAGE82C_ORIGINAL_CAULDRON.requestDisplayResetAddr, 4);
            return {
                motion: Array.from(motion.data),
                graphic: Array.from(graphic.data),
                requestReset: Array.from(requestReset.data),
            };
        };

        const setStage84C35cPatchBytes = async (motionBytes, graphicBytes, requestResetBytes) => {
            await emu.writeMemory(
                KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateMotionCallAddr,
                Uint8Array.from(motionBytes)
            );
            await emu.writeMemory(
                KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateGraphicCallAddr,
                Uint8Array.from(graphicBytes)
            );
            await emu.writeMemory(
                KL_STAGE82C_ORIGINAL_CAULDRON.requestDisplayResetAddr,
                Uint8Array.from(requestResetBytes)
            );
        };

        const updateStage84C35cRoutineThrottle = async workRange => {
            const coord = getStage8CurrentCoord();
            const room = logicalMap.getRoomAt(coord.x, coord.y);
            const role = room.questRole || 'none';
            const playerForm = decodeStage84PlayerForm(workRange);
            const observedSprite = stage84C35aTimingProbe.currentSprite;
            let currentMotionCall = stage84C35cRoutineThrottle.currentMotionCall;
            let currentGraphicCall = stage84C35cRoutineThrottle.currentGraphicCall;
            let currentRequestReset = stage84C35cRoutineThrottle.currentRequestReset;
            let originalMotionCall = stage84C35cRoutineThrottle.originalMotionCall;
            let originalGraphicCall = stage84C35cRoutineThrottle.originalGraphicCall;
            let originalRequestReset = stage84C35cRoutineThrottle.originalRequestReset;
            let patchState = stage84C35cRoutineThrottle.patchState;
            let patches = 0;
            let restores = 0;
            let lastAction = stage84C35cRoutineThrottle.lastAction;
            let lastError = null;

            const setState = extra => {
                stage84C35cRoutineThrottle = {
                    ...stage84C35cRoutineThrottle,
                    enabled: KL_STAGE84_C35C_ENABLED && KL_STAGE7_SLIDING_CROSS.enabled,
                    period: KL_STAGE84_C35C_PERIOD,
                    originalMotionCall,
                    originalGraphicCall,
                    originalRequestReset,
                    currentMotionCall,
                    currentGraphicCall,
                    currentRequestReset,
                    patchState,
                    patches: stage84C35cRoutineThrottle.patches + patches,
                    restores: stage84C35cRoutineThrottle.restores + restores,
                    lastCoord: cloneData(coord),
                    lastRole: role,
                    lastPlayerForm: playerForm.kind,
                    lastObservedSprite: observedSprite,
                    lastAction,
                    lastError,
                    ...extra,
                };
            };

            if (!stage84C35cRoutineThrottle.requested) {
                lastAction = 'disabled; add ?stage84c35c=1 for the routine-level throttle probe';
                setState({enabled: false});
                return;
            }

            if (!KL_STAGE7_SLIDING_CROSS.enabled || typeof emu.readMemory !== 'function' || typeof emu.writeMemory !== 'function') {
                lastAction = KL_STAGE7_SLIDING_CROSS.enabled
                    ? 'readMemory/writeMemory unavailable'
                    : 'disabled because Stage 7 sliding is off';
                setState({enabled: false});
                return;
            }

            try {
                const readback = await readStage84C35cCallBytes();
                currentMotionCall = readback.motion;
                currentGraphicCall = readback.graphic;
                currentRequestReset = readback.requestReset;
                if (!originalMotionCall && !isStage84C35cPatchBytes(currentMotionCall)) {
                    originalMotionCall = currentMotionCall.slice();
                }
                if (!originalGraphicCall && !isStage84C35cPatchBytes(currentGraphicCall)) {
                    originalGraphicCall = currentGraphicCall.slice();
                }
                if (!originalRequestReset && !isStage84C35cPatchBytes(currentRequestReset)) {
                    originalRequestReset = currentRequestReset.slice();
                }
            } catch (err) {
                lastError = `Failed to read bubble updater call bytes: ${err}`;
                lastAction = 'read failed';
                setState({enabled: true});
                return;
            }

            if (!originalMotionCall || !originalGraphicCall || !originalRequestReset) {
                lastError = 'Cannot capture original call bytes; reload with C3.5c enabled before any other routine patch';
                lastAction = 'refused to patch without original bytes';
                setState({enabled: true});
                return;
            }

            if (!sameBytes(originalRequestReset, KL_STAGE84_C35C_EXPECTED_REQUEST_RESET)) {
                lastError = `Unexpected request reset bytes at ${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.requestDisplayResetAddr)}: ${fmtBytes(originalRequestReset, 4)}`;
                lastAction = 'refused to patch unexpected request reset instruction';
                setState({enabled: true});
                return;
            }

            const restoreOriginal = async reason => {
                if (
                    !sameBytes(currentMotionCall, originalMotionCall) ||
                    !sameBytes(currentGraphicCall, originalGraphicCall) ||
                    !sameBytes(currentRequestReset, originalRequestReset)
                ) {
                    await setStage84C35cPatchBytes(originalMotionCall, originalGraphicCall, originalRequestReset);
                    currentMotionCall = originalMotionCall.slice();
                    currentGraphicCall = originalGraphicCall.slice();
                    currentRequestReset = originalRequestReset.slice();
                    restores = 1;
                }
                patchState = 'original';
                lastAction = reason;
            };

            try {
                if (role !== 'cauldron') {
                    await restoreOriginal(`restored original updater; current role ${role}`);
                    setState({enabled: true});
                    return;
                }

                if (playerForm.kind !== 'human') {
                    await restoreOriginal(`restored original updater for player ${playerForm.kind}; wolf hazard left original`);
                    setState({enabled: true});
                    return;
                }

                const cycle = frameCompletedCount % KL_STAGE84_C35C_PERIOD;
                const skipThisFrame = cycle !== 0;
                const holdingRequest = observedSprite >= 0xa8 && observedSprite <= 0xae;
                if (skipThisFrame) {
                    if (holdingRequest) {
                        if (
                            !sameBytes(currentMotionCall, originalMotionCall) ||
                            !sameBytes(currentGraphicCall, originalGraphicCall) ||
                            !sameBytes(currentRequestReset, KL_STAGE84_C35C_NOP_RESET)
                        ) {
                            await setStage84C35cPatchBytes(originalMotionCall, originalGraphicCall, KL_STAGE84_C35C_NOP_RESET);
                            currentMotionCall = originalMotionCall.slice();
                            currentGraphicCall = originalGraphicCall.slice();
                            currentRequestReset = KL_STAGE84_C35C_NOP_RESET.slice();
                            patches = 1;
                        }
                        patchState = 'request-hold';
                        lastAction = `next frame holds request display; cycle ${cycle}/${KL_STAGE84_C35C_PERIOD - 1}; request reset patched to NOP`;
                    } else {
                        if (
                            !sameBytes(currentMotionCall, KL_STAGE84_C35C_EARLY_EXIT) ||
                            !sameBytes(currentGraphicCall, originalGraphicCall) ||
                            !sameBytes(currentRequestReset, originalRequestReset)
                        ) {
                            await setStage84C35cPatchBytes(KL_STAGE84_C35C_EARLY_EXIT, originalGraphicCall, originalRequestReset);
                            currentMotionCall = KL_STAGE84_C35C_EARLY_EXIT.slice();
                            currentGraphicCall = originalGraphicCall.slice();
                            currentRequestReset = originalRequestReset.slice();
                            patches = 1;
                        }
                        patchState = 'early-exit';
                        lastAction = `next frame throttled; cycle ${cycle}/${KL_STAGE84_C35C_PERIOD - 1}; motion call patched to JP ${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateExitAddr)}`;
                    }
                } else {
                    await restoreOriginal(`next frame original; cycle ${cycle}/${KL_STAGE84_C35C_PERIOD - 1}`);
                }
                setState({enabled: true, cycle});
            } catch (err) {
                lastError = `Failed to update bubble updater throttle patch: ${err}`;
                lastAction = 'write failed';
                setState({enabled: true});
            }
        };

        const formatStage84C35cRoutineThrottle = () => (
            [
                `requested ${stage84C35cRoutineThrottle.requested ? 'yes' : 'no'}`,
                `enabled ${stage84C35cRoutineThrottle.enabled ? 'yes' : 'no'}`,
                `period ${stage84C35cRoutineThrottle.period}`,
                `state ${stage84C35cRoutineThrottle.patchState}`,
                `cycle ${stage84C35cRoutineThrottle.cycle}/${Math.max(1, stage84C35cRoutineThrottle.period - 1)}`,
                `player ${stage84C35cRoutineThrottle.lastPlayerForm}`,
                `observed ${fmtMechanicSprite(stage84C35cRoutineThrottle.lastObservedSprite)}`,
                `patches ${stage84C35cRoutineThrottle.patches}`,
                `restores ${stage84C35cRoutineThrottle.restores}`,
                `last action ${stage84C35cRoutineThrottle.lastAction}`,
            ].join('; ')
        );

        const formatStage84C35cRoutineBytes = () => (
            [
                `motion ${fmtBytes(stage84C35cRoutineThrottle.currentMotionCall, 3)}`,
                `graphic ${fmtBytes(stage84C35cRoutineThrottle.currentGraphicCall, 3)}`,
                `request reset ${fmtBytes(stage84C35cRoutineThrottle.currentRequestReset, 4)}`,
                `original motion ${stage84C35cRoutineThrottle.originalMotionCall ? fmtBytes(stage84C35cRoutineThrottle.originalMotionCall, 3) : '-'}`,
                `original graphic ${stage84C35cRoutineThrottle.originalGraphicCall ? fmtBytes(stage84C35cRoutineThrottle.originalGraphicCall, 3) : '-'}`,
                `original request reset ${stage84C35cRoutineThrottle.originalRequestReset ? fmtBytes(stage84C35cRoutineThrottle.originalRequestReset, 4) : '-'}`,
            ].join('; ')
        );

        const formatStage84C35cRoutineRoom = () => (
            [
                `logical ${fmtLogicalCoord(stage84C35cRoutineThrottle.lastCoord)}`,
                `role ${stage84C35cRoutineThrottle.lastRole}`,
            ].join('; ')
        );

        const byteOr = (value, fallback = 0) => (
            Number.isInteger(value) ? value & 0xff : fallback & 0xff
        );

        const stage84C35eAxisDelta = (a, b) => (
            Math.abs(byteOr(a, 0) - byteOr(b, 0))
        );

        const measureStage84C35eBodyJump = (previous, current) => {
            if (!previous || !previous.body || !current || !current.body) {
                return {x: 0, y: 0, z: 0, max: 0, jumped: false};
            }
            const jump = {
                x: stage84C35eAxisDelta(previous.body.x, current.body.x),
                y: stage84C35eAxisDelta(previous.body.y, current.body.y),
                z: stage84C35eAxisDelta(previous.body.z, current.body.z),
            };
            jump.max = Math.max(jump.x, jump.y, jump.z);
            jump.jumped = jump.max >= 0x20;
            return jump;
        };

        const makeStage84C35eSnapshot = (workRange, sample) => {
            const coord = getStage8CurrentCoord();
            const room = logicalMap.getRoomAt(coord.x, coord.y);
            const role = room.questRole || 'none';
            const playerForm = decodeStage84PlayerForm(workRange);
            const lives = readByte(workRange, 0x5bba);
            const liveSprite = readByte(workRange, KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr);
            const transition = sample && sample.stage7Action && sample.stage7Action.recentered
                ? sample.stage7Action
                : stage7SlidingCross.lastTransition;
            const enteredByTransition = !!(
                transition &&
                transition.newCenter &&
                sameCoord(transition.newCenter, coord)
            );
            const entryDirection = enteredByTransition ? transition.direction : null;
            const entrySide = entryDirection ? KL_OPPOSITE_DIRECTIONS[entryDirection] : null;
            const entryTransitionKey = enteredByTransition
                ? `${transition.frame}:${transition.sample}:${transition.direction}:${logicalCoordKey(coord.x, coord.y)}`
                : `direct:${logicalCoordKey(coord.x, coord.y)}`;

            return {
                coord: cloneData(coord),
                role,
                roomLabel: room.label,
                physicalRoom: sample ? sample.room0 : null,
                playerForm: playerForm.kind,
                playerFormText: playerForm.text,
                lives: Number.isInteger(lives) ? lives : null,
                liveSprite: Number.isInteger(liveSprite) ? liveSprite : null,
                bubblesActive: !!(
                    KL_STAGE82C_CAULDRON_VISUAL_ENABLED &&
                    ['global', 'cauldron'].includes(KL_STAGE82C_BUBBLE_MODE) &&
                    role === 'cauldron'
                ),
                body: sample && sample.body ? cloneData(sample.body) : null,
                head: sample && sample.head ? cloneData(sample.head) : null,
                entryDirection,
                entrySide,
                entryTransitionKey,
                frame: frameCompletedCount,
                sample: sampleCount,
            };
        };

        const isStage84C35eArmedSnapshot = snapshot => !!(
            snapshot &&
            snapshot.physicalRoom === KL_STAGE7_SLIDING_CROSS.centerRoom &&
            snapshot.lives !== null
        );

        const isStage84C35eRecentSnapshot = snapshot => !!(
            snapshot &&
            Number.isInteger(snapshot.frame) &&
            frameCompletedCount - snapshot.frame <= 180
        );

        const isStage84C35eLikelyRespawnTarget = (entrySnapshot, context) => {
            if (!entrySnapshot || !context || sameCoord(entrySnapshot.coord, context.coord)) return false;
            if (!entrySnapshot.entryDirection) return true;
            const delta = KL_DIRECTION_DELTAS[entrySnapshot.entryDirection];
            if (!delta) return true;
            return (
                context.coord.x === entrySnapshot.coord.x + delta.x &&
                context.coord.y === entrySnapshot.coord.y + delta.y
            );
        };

        const updateStage84C35eBubbleRespawnState = (workRange, sample) => {
            const context = makeStage84C35eSnapshot(workRange, sample);
            let entrySnapshot = stage84C35eBubbleRespawnGuard.entrySnapshot;
            let armedEntrySnapshot = stage84C35eBubbleRespawnGuard.armedEntrySnapshot;
            let previousEntrySnapshot = stage84C35eBubbleRespawnGuard.previousEntrySnapshot;
            let pendingDeath = stage84C35eBubbleRespawnGuard.pendingDeath;
            let lastAction = stage84C35eBubbleRespawnGuard.lastAction;
            const justCorrected = !!(sample && sample.stage84C35eAction && sample.stage84C35eAction.corrected);
            const gameOverActive = context.lives !== null && context.lives >= 0x80;
            const unresolvedArmedLifeDrop = !!(
                armedEntrySnapshot &&
                armedEntrySnapshot.lives !== null &&
                context.lives !== null &&
                context.lives < armedEntrySnapshot.lives
            );

            if (gameOverActive) {
                entrySnapshot = null;
                armedEntrySnapshot = null;
                previousEntrySnapshot = null;
                pendingDeath = null;
                lastAction = 'game over delegated to C3.5f; ordinary death latch cleared';
            } else if (!stage84C35eBubbleRespawnGuard.requested) {
                lastAction = 'disabled with ?stage84c35e=0';
            } else if (!KL_STAGE7_SLIDING_CROSS.enabled) {
                lastAction = 'disabled because Stage 7 sliding is off';
            } else if (justCorrected) {
                lastAction = stage84C35eBubbleRespawnGuard.lastAction;
            } else if (context.physicalRoom === KL_STAGE7_SLIDING_CROSS.centerRoom) {
                const needsNewEntry = !entrySnapshot ||
                    !sameCoord(entrySnapshot.coord, context.coord) ||
                    entrySnapshot.entryTransitionKey !== context.entryTransitionKey;
                if (needsNewEntry && !unresolvedArmedLifeDrop) {
                    if (entrySnapshot) {
                        previousEntrySnapshot = {
                            ...cloneData(entrySnapshot),
                            frame: context.frame,
                            sample: context.sample,
                        };
                    }
                    entrySnapshot = cloneData(context);
                    armedEntrySnapshot = cloneData(context);
                    lastAction = `recorded room entry ${context.entrySide || 'unknown side'} at ${fmtLogicalCoord(context.coord)}`;
                } else if (!pendingDeath) {
                    if (!armedEntrySnapshot || !sameCoord(armedEntrySnapshot.coord, context.coord)) {
                        armedEntrySnapshot = cloneData(entrySnapshot || context);
                    } else if (!unresolvedArmedLifeDrop) {
                        armedEntrySnapshot = {
                            ...armedEntrySnapshot,
                            lives: armedEntrySnapshot.lives === null || context.lives === null
                                ? context.lives
                                : Math.max(armedEntrySnapshot.lives, context.lives),
                            frame: context.frame,
                            sample: context.sample,
                        };
                    }
                    lastAction = `armed room ${fmtLogicalCoord(context.coord)}; entry ${(entrySnapshot && entrySnapshot.entrySide) || 'unknown side'}; player ${context.playerForm}`;
                }
            } else if (!pendingDeath) {
                lastAction = `watching physical transition from ${fmtLogicalCoord(context.coord)}`;
            }

            if (
                previousEntrySnapshot &&
                Number.isInteger(previousEntrySnapshot.frame) &&
                frameCompletedCount - previousEntrySnapshot.frame > 180
            ) {
                previousEntrySnapshot = null;
            }

            if (pendingDeath && frameCompletedCount - pendingDeath.frame > 180) {
                pendingDeath = null;
                lastAction = 'expired stale pending death correction';
            }

            stage84C35eBubbleRespawnGuard = {
                ...stage84C35eBubbleRespawnGuard,
                enabled: KL_STAGE84_C35E_REQUESTED && KL_STAGE7_SLIDING_CROSS.enabled,
                entrySnapshot,
                armedEntrySnapshot,
                previousEntrySnapshot,
                pendingDeath,
                lastSnapshot: gameOverActive ? null : context,
                lastCoord: cloneData(context.coord),
                lastRole: context.role,
                lastPlayerForm: context.playerForm,
                lastLives: context.lives,
                lastAction,
            };
        };

        const applyStage84C35eBubbleRespawnGuard = async (workRange, sample) => {
            const context = makeStage84C35eSnapshot(workRange, sample);
            let pendingDeath = stage84C35eBubbleRespawnGuard.pendingDeath;
            let lastAction = stage84C35eBubbleRespawnGuard.lastAction;
            let lastError = null;

            const previous = stage84C35eBubbleRespawnGuard.lastSnapshot;
            const entrySnapshot = stage84C35eBubbleRespawnGuard.entrySnapshot;
            const armedEntrySnapshot = stage84C35eBubbleRespawnGuard.armedEntrySnapshot;
            const previousEntrySnapshot = stage84C35eBubbleRespawnGuard.previousEntrySnapshot;
            const bodyJump = measureStage84C35eBodyJump(previous, context);
            const entryBodyJump = measureStage84C35eBodyJump(entrySnapshot, context);
            const armedBodyJump = measureStage84C35eBodyJump(armedEntrySnapshot, context);
            const previousEntryBodyJump = measureStage84C35eBodyJump(previousEntrySnapshot, context);
            const lifeDropped = !!(
                previous &&
                previous.lives !== null &&
                context.lives !== null &&
                context.lives < previous.lives
            );

            if (context.lives !== null && context.lives >= 0x80) {
                stage84C35eBubbleRespawnGuard = {
                    ...stage84C35eBubbleRespawnGuard,
                    entrySnapshot: null,
                    armedEntrySnapshot: null,
                    previousEntrySnapshot: null,
                    pendingDeath: null,
                    lastSnapshot: null,
                    lastCoord: cloneData(context.coord),
                    lastRole: context.role,
                    lastPlayerForm: context.playerForm,
                    lastLives: context.lives,
                    lastAction: 'game over delegated to C3.5f; no same-room correction attempted',
                    lastError: null,
                };
                return null;
            }

            if (!stage84C35eBubbleRespawnGuard.requested) {
                stage84C35eBubbleRespawnGuard = {
                    ...stage84C35eBubbleRespawnGuard,
                    enabled: false,
                    lastCoord: cloneData(context.coord),
                    lastRole: context.role,
                    lastPlayerForm: context.playerForm,
                    lastLives: context.lives,
                    lastAction: 'disabled with ?stage84c35e=0',
                    lastError: null,
                };
                return null;
            }

            if (!KL_STAGE7_SLIDING_CROSS.enabled || typeof emu.writeMemory !== 'function') {
                stage84C35eBubbleRespawnGuard = {
                    ...stage84C35eBubbleRespawnGuard,
                    enabled: false,
                    lastCoord: cloneData(context.coord),
                    lastRole: context.role,
                    lastPlayerForm: context.playerForm,
                    lastLives: context.lives,
                    lastAction: KL_STAGE7_SLIDING_CROSS.enabled
                        ? 'writeMemory unavailable'
                        : 'disabled because Stage 7 sliding is off',
                    lastError: null,
                };
                return null;
            }

            const wrongPhysicalRoom = sample.room0 !== KL_STAGE7_SLIDING_CROSS.centerRoom
                ? sample.room0
                : null;
            const previousArmed = isStage84C35eArmedSnapshot(previous);
            const entryArmed = isStage84C35eArmedSnapshot(entrySnapshot) &&
                isStage84C35eRecentSnapshot(entrySnapshot);
            const entryLifeDroppedAfterShift = !!(
                entryArmed &&
                entrySnapshot.lives !== null &&
                context.lives !== null &&
                context.lives < entrySnapshot.lives &&
                isStage84C35eLikelyRespawnTarget(entrySnapshot, context)
            );
            const latchedEntryLifeDrop = !!(
                isStage84C35eArmedSnapshot(armedEntrySnapshot) &&
                isStage84C35eRecentSnapshot(armedEntrySnapshot) &&
                armedEntrySnapshot.lives !== null &&
                context.lives !== null &&
                context.lives < armedEntrySnapshot.lives
            );
            const previousEntryLifeDrop = !!(
                isStage84C35eArmedSnapshot(previousEntrySnapshot) &&
                Number.isInteger(previousEntrySnapshot.frame) &&
                frameCompletedCount - previousEntrySnapshot.frame <= 24 &&
                previousEntrySnapshot.lives !== null &&
                context.lives !== null &&
                context.lives < previousEntrySnapshot.lives &&
                isStage84C35eLikelyRespawnTarget(previousEntrySnapshot, context)
            );
            const formChangedFromWolf = !!(
                previous &&
                previous.playerForm === 'wolf' &&
                context.playerForm !== 'wolf'
            );
            const suspiciousBubbleRespawnJump = !!(
                previousArmed &&
                previous.bubblesActive &&
                formChangedFromWolf &&
                (
                    wrongPhysicalRoom !== null ||
                    bodyJump.jumped ||
                    lifeDropped
                )
            );
            const deathTrigger = previousEntryLifeDrop ||
                (previousArmed && lifeDropped) ||
                entryLifeDroppedAfterShift ||
                latchedEntryLifeDrop ||
                suspiciousBubbleRespawnJump;

            if (deathTrigger) {
                const trigger = previousEntryLifeDrop
                    ? 'life drop after recent room recenter'
                    : lifeDropped
                        ? 'general life drop'
                        : entryLifeDroppedAfterShift
                            ? 'entry life drop after recenter'
                            : latchedEntryLifeDrop
                                ? 'latched room-entry life drop'
                                : wrongPhysicalRoom !== null
                                    ? 'bubble respawn physical-room change'
                                    : 'bubble respawn body jump';
                const source = previousEntryLifeDrop
                    ? previousEntrySnapshot
                    : entryLifeDroppedAfterShift
                        ? entrySnapshot
                        : latchedEntryLifeDrop
                            ? armedEntrySnapshot
                            : previous;
                pendingDeath = {
                    coord: cloneData(source.coord),
                    entry: cloneData(previousEntryLifeDrop
                        ? previousEntrySnapshot
                        : entrySnapshot && sameCoord(entrySnapshot.coord, source.coord)
                            ? entrySnapshot
                            : armedEntrySnapshot && sameCoord(armedEntrySnapshot.coord, source.coord)
                                ? armedEntrySnapshot
                                : source),
                    previous: source,
                    lifeBefore: source.lives,
                    lifeAfter: context.lives,
                    trigger,
                    bodyJump: previousEntryLifeDrop
                        ? previousEntryBodyJump
                        : latchedEntryLifeDrop
                            ? armedBodyJump
                            : entryLifeDroppedAfterShift
                                ? entryBodyJump
                                : bodyJump,
                    frame: frameCompletedCount,
                    sample: sampleCount,
                };
                lastAction = `death detected in ${fmtLogicalCoord(source.coord)} by ${trigger}`;
            }

            if (!pendingDeath) {
                stage84C35eBubbleRespawnGuard = {
                    ...stage84C35eBubbleRespawnGuard,
                    enabled: true,
                    pendingDeath,
                    lastBodyJump: bodyJump,
                    lastCoord: cloneData(context.coord),
                    lastRole: context.role,
                    lastPlayerForm: context.playerForm,
                    lastLives: context.lives,
                    lastAction,
                    lastError: null,
                };
                return null;
            }

            const restorePoint = pendingDeath.entry || pendingDeath.previous;
            const body = restorePoint.body || {x: 0x80, y: 0x80, z: 0x80};
            const head = restorePoint.head || body;
            const needsCrossRefresh = !sameCoord(stage7SlidingCross.center, pendingDeath.coord);
            const patchAddrs = Array.from(new Set([
                KL_STAGE7_SLIDING_CROSS.currentRoomAddr,
                0x5c30,
                ...collectStage7RoomIdPatchAddrs(workRange, wrongPhysicalRoom),
            ])).sort((a, b) => a - b);

            try {
                const fromText = wrongPhysicalRoom === null
                    ? needsCrossRefresh
                        ? `logical ${fmtLogicalCoord(stage7SlidingCross.center)}`
                        : 'same physical room'
                    : `physical ${hexByte(wrongPhysicalRoom)}`;
                if (needsCrossRefresh) {
                    stage7SlidingCross = {
                        ...stage7SlidingCross,
                        center: cloneData(pendingDeath.coord),
                        done: false,
                        lastCompiled: null,
                        lastPatchedSlots: [],
                        message: `C3.5e detected death recenter into ${fromText}; restoring cross around ${fmtLogicalCoord(pendingDeath.coord)}.`,
                    };
                    renderStage7SlidingRow();
                    await applyStage7CrossInjection(`C3.5e restored death center to ${fmtLogicalCoord(pendingDeath.coord)}`);
                }

                for (const addr of patchAddrs) {
                    await emu.writeMemory(addr, Uint8Array.from([KL_STAGE7_SLIDING_CROSS.centerRoom]));
                }
                await emu.writeMemory(
                    KL_STAGE84_C30.playerBodyXyzAddr,
                    Uint8Array.from([byteOr(body.x, 0x80), byteOr(body.y, 0x80), byteOr(body.z, 0x80)])
                );
                await emu.writeMemory(
                    KL_STAGE84_C30.playerHeadXyzAddr,
                    Uint8Array.from([byteOr(head.x, body.x), byteOr(head.y, body.y), byteOr(head.z, body.z)])
                );
                const restoredEntry = {
                    ...cloneData(restorePoint),
                    playerForm: context.playerForm,
                    playerFormText: context.playerFormText,
                    physicalRoom: KL_STAGE7_SLIDING_CROSS.centerRoom,
                    bubblesActive: !!restorePoint.bubblesActive,
                    lives: context.lives,
                    frame: frameCompletedCount,
                    sample: sampleCount,
                };
                lastAction = `corrected death respawn from ${fromText} back to ${fmtLogicalCoord(pendingDeath.coord)} at entry ${restorePoint.entrySide || 'unknown side'}`;
                stage84C35eBubbleRespawnGuard = {
                    ...stage84C35eBubbleRespawnGuard,
                    enabled: true,
                    entrySnapshot: restoredEntry,
                    pendingDeath: null,
                    armedEntrySnapshot: restoredEntry,
                    previousEntrySnapshot: null,
                    corrections: stage84C35eBubbleRespawnGuard.corrections + 1,
                    writes: stage84C35eBubbleRespawnGuard.writes + patchAddrs.length + 2,
                    lastPatchedAddrs: patchAddrs,
                    lastWrongRoom: wrongPhysicalRoom,
                    lastTrigger: pendingDeath.trigger || 'unknown',
                    lastBodyJump: pendingDeath.bodyJump || bodyJump,
                    lastCoord: cloneData(pendingDeath.coord),
                    lastRole: restorePoint.role || 'none',
                    lastPlayerForm: context.playerForm,
                    lastLives: context.lives,
                    lastAction,
                    lastError: null,
                };
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    center: cloneData(pendingDeath.coord),
                    lastPatchedSlots: patchAddrs,
                    message: `${stage7SlidingCross.message} C3.5e corrected death respawn from ${fromText} back to the same logical room.`,
                };
                renderStage7SlidingRow();
                return {
                    corrected: true,
                    wrongPhysicalRoom,
                    coord: cloneData(pendingDeath.coord),
                    entry: cloneData(restorePoint),
                    patchedAddrs: patchAddrs,
                };
            } catch (err) {
                lastError = `Failed C3.5e general death respawn correction: ${err}`;
                stage84C35eBubbleRespawnGuard = {
                    ...stage84C35eBubbleRespawnGuard,
                    enabled: true,
                    pendingDeath,
                    lastWrongRoom: wrongPhysicalRoom,
                    lastTrigger: pendingDeath.trigger || 'unknown',
                    lastBodyJump: pendingDeath.bodyJump || bodyJump,
                    lastCoord: cloneData(context.coord),
                    lastRole: context.role,
                    lastPlayerForm: context.playerForm,
                    lastLives: context.lives,
                    lastAction: 'write failed',
                    lastError,
                };
                return {corrected: false, error: lastError};
            }
        };

        const clearStage84C35eForGameOver = lives => {
            stage84C35eBubbleRespawnGuard = {
                ...stage84C35eBubbleRespawnGuard,
                entrySnapshot: null,
                armedEntrySnapshot: null,
                previousEntrySnapshot: null,
                pendingDeath: null,
                lastSnapshot: null,
                lastCoord: {x: 0, y: 0},
                lastRole: 'none',
                lastLives: lives,
                lastTrigger: 'game over delegated to C3.5f',
                lastAction: 'game-over origin reset cleared ordinary death history',
                lastError: null,
            };
        };

        const applyStage84C35fGameOverOriginReset = async (workRange, sample) => {
            const currentLives = readByte(workRange, 0x5bba);
            const previousLives = stage84C35fGameOverOriginReset.previousLives;
            const fromCoord = getStage8CurrentCoord();
            let pendingReset = stage84C35fGameOverOriginReset.pendingReset;
            let gameOverLatched = stage84C35fGameOverOriginReset.gameOverLatched;
            let sawActiveGame = stage84C35fGameOverOriginReset.sawActiveGame;
            let zeroAfterActiveGame = stage84C35fGameOverOriginReset.zeroAfterActiveGame;
            let lastAction = stage84C35fGameOverOriginReset.lastAction;
            let lastError = null;

            if (!stage84C35fGameOverOriginReset.requested) {
                stage84C35fGameOverOriginReset = {
                    ...stage84C35fGameOverOriginReset,
                    enabled: false,
                    previousLives: currentLives,
                    currentLives,
                    lastAction: 'disabled with ?stage84c35f=0',
                    lastError: null,
                };
                return null;
            }

            if (!KL_STAGE7_SLIDING_CROSS.enabled || typeof emu.writeMemory !== 'function') {
                stage84C35fGameOverOriginReset = {
                    ...stage84C35fGameOverOriginReset,
                    enabled: false,
                    previousLives: currentLives,
                    currentLives,
                    lastAction: KL_STAGE7_SLIDING_CROSS.enabled
                        ? 'writeMemory unavailable'
                        : 'disabled because Stage 7 sliding is off',
                    lastError: null,
                };
                return null;
            }

            const signedUnderflow = previousLives !== null &&
                previousLives === 0x00 &&
                zeroAfterActiveGame &&
                currentLives === 0xff;
            const restartedAfterUnderflow = previousLives !== null &&
                previousLives >= 0x80 &&
                zeroAfterActiveGame &&
                currentLives >= 0x04 &&
                currentLives <= 0x05;
            const missedUnderflowFallback = previousLives !== null &&
                previousLives <= 0x01 &&
                zeroAfterActiveGame &&
                currentLives >= 0x04 &&
                currentLives <= 0x05;

            if (!pendingReset && !gameOverLatched && (
                signedUnderflow ||
                restartedAfterUnderflow ||
                missedUnderflowFallback
            )) {
                const trigger = signedUnderflow
                    ? `original lives underflow ${hexByte(previousLives)} -> ${hexByte(currentLives)}`
                    : restartedAfterUnderflow
                        ? `new-game refill after signed lives value ${hexByte(previousLives)} -> ${hexByte(currentLives)}`
                        : `missed-underflow fallback ${hexByte(previousLives)} -> ${hexByte(currentLives)}`;
                pendingReset = {
                    trigger,
                    fromCoord: cloneData(fromCoord),
                    frame: frameCompletedCount,
                    sample: sampleCount,
                };
                gameOverLatched = true;
                lastAction = `game over detected by ${trigger}; origin cross queued`;
            }

            if (!pendingReset && !gameOverLatched) {
                if (currentLives >= 0x01 && currentLives <= 0x05) {
                    sawActiveGame = true;
                    zeroAfterActiveGame = false;
                    lastAction = `watching active game; lives ${hexByte(currentLives)}`;
                } else if (currentLives === 0x00 && sawActiveGame) {
                    zeroAfterActiveGame = true;
                    lastAction = 'zero-life state observed after active play; waiting for signed underflow';
                }
            }

            if (
                gameOverLatched &&
                !pendingReset &&
                currentLives >= 0x01 &&
                currentLives <= 0x04
            ) {
                gameOverLatched = false;
                sawActiveGame = currentLives >= 0x01 && currentLives <= 0x05;
                zeroAfterActiveGame = false;
                let charmReset;
                try {
                    charmReset = await forceStage84C31InactiveForNewGame(
                        'C3.5f post-init cleanup'
                    );
                } catch (err) {
                    lastError = `Failed C3.5f post-init disposable charm cleanup: ${err}`;
                    gameOverLatched = true;
                    stage84C35fGameOverOriginReset = {
                        ...stage84C35fGameOverOriginReset,
                        enabled: true,
                        previousLives: currentLives,
                        currentLives,
                        gameOverLatched,
                        sawActiveGame,
                        zeroAfterActiveGame,
                        lastAction: 'new game active, but post-init charm cleanup failed',
                        lastError,
                    };
                    return {
                        suppressGeneralDeath: true,
                        suppressStage7: false,
                        released: true,
                        error: lastError,
                    };
                }
                clearStage84C35eForGameOver(currentLives);
                lastAction = `new game active with lives ${hexByte(currentLives)}; origin remains pre-armed; ${charmReset.action}`;
                stage84C35fGameOverOriginReset = {
                    ...stage84C35fGameOverOriginReset,
                    enabled: true,
                    previousLives: currentLives,
                    currentLives,
                    gameOverLatched,
                    sawActiveGame,
                    zeroAfterActiveGame,
                    writes: stage84C35fGameOverOriginReset.writes + charmReset.bytesWritten,
                    charmRecordWrites: stage84C35fGameOverOriginReset.charmRecordWrites + (charmReset.written ? 1 : 0),
                    lastCharmRecordBefore: charmReset.before,
                    lastCharmRecordAfter: charmReset.after,
                    lastCharmResetAction: charmReset.action,
                    lastAction,
                    lastError: null,
                };
                return {
                    suppressGeneralDeath: true,
                    suppressStage7: false,
                    released: true,
                };
            }

            if (!pendingReset) {
                stage84C35fGameOverOriginReset = {
                    ...stage84C35fGameOverOriginReset,
                    enabled: true,
                    previousLives: currentLives,
                    currentLives,
                    gameOverLatched,
                    sawActiveGame,
                    zeroAfterActiveGame,
                    lastAction,
                    lastError: null,
                };
                return gameOverLatched || currentLives >= 0x80
                    ? {suppressGeneralDeath: true, suppressStage7: true}
                    : null;
            }

            if (stage7SlidingCross.inFlight) {
                lastAction = `waiting for active Stage 7 write before resetting ${fmtLogicalCoord(pendingReset.fromCoord)} to origin`;
                stage84C35fGameOverOriginReset = {
                    ...stage84C35fGameOverOriginReset,
                    enabled: true,
                    previousLives: currentLives,
                    currentLives,
                    pendingReset,
                    gameOverLatched,
                    sawActiveGame,
                    zeroAfterActiveGame,
                    lastAction,
                    lastError: null,
                };
                return {
                    suppressGeneralDeath: true,
                    suppressStage7: true,
                    pending: true,
                };
            }

            try {
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    center: {x: 0, y: 0},
                    attempted: false,
                    done: false,
                    lastCompiled: null,
                    lastTransition: null,
                    lastPatchedSlots: [],
                    message: `C3.5f detected game over at ${fmtLogicalCoord(pendingReset.fromCoord)}; compiling the origin cross before the next game.`,
                };
                renderStage7SlidingRow();
                await applyStage7CrossInjection('C3.5f game-over reset to logical origin (0,0)');

                if (!stage7SlidingCross.done || stage7SlidingCross.lastError) {
                    lastError = stage7SlidingCross.lastError ||
                        'Stage 7 origin cross did not finish; retrying on the next completed frame';
                    stage84C35fGameOverOriginReset = {
                        ...stage84C35fGameOverOriginReset,
                        enabled: true,
                        previousLives: currentLives,
                        currentLives,
                        pendingReset,
                        gameOverLatched,
                        sawActiveGame,
                        zeroAfterActiveGame,
                        lastAction: 'origin cross write incomplete; retry queued',
                        lastError,
                    };
                    return {
                        suppressGeneralDeath: true,
                        suppressStage7: true,
                        pending: true,
                        error: lastError,
                    };
                }

                const charmReset = await forceStage84C31InactiveForNewGame(
                    'C3.5f pre-init cleanup'
                );
                const roomIdAddrs = [
                    KL_STAGE7_SLIDING_CROSS.currentRoomAddr,
                    0x5c30,
                ];
                for (const addr of roomIdAddrs) {
                    await emu.writeMemory(addr, Uint8Array.from([KL_STAGE7_SLIDING_CROSS.centerRoom]));
                }
                await emu.writeMemory(
                    KL_STAGE2.startLocationsAddr,
                    Uint8Array.from(KL_STAGE2.startLocationsPatched)
                );
                const patchedAddrs = [
                    ...roomIdAddrs,
                    ...KL_STAGE2.startLocationsPatched.map((value, index) => KL_STAGE2.startLocationsAddr + index),
                ];

                clearStage84C35eForGameOver(currentLives);
                lastAction = `reset ${fmtLogicalCoord(pendingReset.fromCoord)} to origin; pre-armed physical 0x88 cross and four 0x88 start choices; ${charmReset.action}`;
                stage84C35fGameOverOriginReset = {
                    ...stage84C35fGameOverOriginReset,
                    enabled: true,
                    previousLives: currentLives,
                    currentLives,
                    pendingReset: null,
                    gameOverLatched: true,
                    sawActiveGame,
                    zeroAfterActiveGame,
                    resets: stage84C35fGameOverOriginReset.resets + 1,
                    writes: stage84C35fGameOverOriginReset.writes + patchedAddrs.length + charmReset.bytesWritten,
                    charmRecordWrites: stage84C35fGameOverOriginReset.charmRecordWrites + (charmReset.written ? 1 : 0),
                    lastCharmRecordBefore: charmReset.before,
                    lastCharmRecordAfter: charmReset.after,
                    lastCharmResetAction: charmReset.action,
                    lastPatchedAddrs: patchedAddrs,
                    lastFromCoord: cloneData(pendingReset.fromCoord),
                    lastTrigger: pendingReset.trigger,
                    lastAction,
                    lastError: null,
                };
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    center: {x: 0, y: 0},
                    lastPatchedSlots: roomIdAddrs,
                    message: `${stage7SlidingCross.message} C3.5f pre-armed the next game at logical origin (0,0).`,
                };
                renderStage7SlidingRow();
                return {
                    reset: true,
                    suppressGeneralDeath: true,
                    suppressStage7: true,
                    coord: {x: 0, y: 0},
                    trigger: pendingReset.trigger,
                    patchedAddrs,
                };
            } catch (err) {
                lastError = `Failed C3.5f game-over origin reset: ${err}`;
                stage84C35fGameOverOriginReset = {
                    ...stage84C35fGameOverOriginReset,
                    enabled: true,
                    previousLives: currentLives,
                    currentLives,
                    pendingReset,
                    gameOverLatched,
                    sawActiveGame,
                    zeroAfterActiveGame,
                    lastAction: 'origin reset write failed; retry queued',
                    lastError,
                };
                return {
                    suppressGeneralDeath: true,
                    suppressStage7: true,
                    pending: true,
                    error: lastError,
                };
            }
        };

        const formatStage84C35eRespawnGuard = () => {
            const entry = stage84C35eBubbleRespawnGuard.entrySnapshot;
            const armedEntry = stage84C35eBubbleRespawnGuard.armedEntrySnapshot;
            const previousEntry = stage84C35eBubbleRespawnGuard.previousEntrySnapshot;
            const pending = stage84C35eBubbleRespawnGuard.pendingDeath;
            const entryBody = entry && entry.body ? entry.body : {x: 0, y: 0, z: 0};
            const armedAge = armedEntry && Number.isInteger(armedEntry.frame)
                ? Math.max(0, frameCompletedCount - armedEntry.frame)
                : null;
            const previousEntryAge = previousEntry && Number.isInteger(previousEntry.frame)
                ? Math.max(0, frameCompletedCount - previousEntry.frame)
                : null;
            const current = stage84C35eBubbleRespawnGuard.lastSnapshot;
            const currentBody = current && current.body ? current.body : null;
            const jump = stage84C35eBubbleRespawnGuard.lastBodyJump;
            return [
                `requested ${stage84C35eBubbleRespawnGuard.requested ? 'yes' : 'no'}`,
                `enabled ${stage84C35eBubbleRespawnGuard.enabled ? 'yes' : 'no'}`,
                `player ${stage84C35eBubbleRespawnGuard.lastPlayerForm}`,
                `lives ${stage84C35eBubbleRespawnGuard.lastLives === null ? '-' : hexByte(stage84C35eBubbleRespawnGuard.lastLives)}`,
                `current ${currentBody ? fmtXYZ(currentBody.x, currentBody.y, currentBody.z) : '-'}`,
                `entry ${entry ? `${fmtLogicalCoord(entry.coord)} ${entry.entrySide || 'unknown side'} ${fmtXYZ(entryBody.x, entryBody.y, entryBody.z)}` : 'none'}`,
                `armed entry ${armedEntry ? `${fmtLogicalCoord(armedEntry.coord)} ${armedEntry.entrySide || 'unknown side'} lives ${armedEntry.lives === null ? '-' : hexByte(armedEntry.lives)} age ${armedAge}` : 'none'}`,
                `previous entry ${previousEntry ? `${fmtLogicalCoord(previousEntry.coord)} ${previousEntry.entrySide || 'unknown side'} lives ${previousEntry.lives === null ? '-' : hexByte(previousEntry.lives)} age ${previousEntryAge}` : 'none'}`,
                `pending ${pending ? `${fmtLogicalCoord(pending.coord)} ${hexByte(pending.lifeBefore)}->${hexByte(pending.lifeAfter)} ${pending.trigger || ''}` : 'none'}`,
                `trigger ${stage84C35eBubbleRespawnGuard.lastTrigger}`,
                `jump ${jump ? `dx ${jump.x} dy ${jump.y} dz ${jump.z}` : '-'}`,
                `corrections ${stage84C35eBubbleRespawnGuard.corrections}`,
                `writes ${stage84C35eBubbleRespawnGuard.writes}`,
                `last action ${stage84C35eBubbleRespawnGuard.lastAction}`,
            ].join('; ');
        };

        const formatStage84C35eRespawnRoom = () => (
            [
                `logical ${fmtLogicalCoord(stage84C35eBubbleRespawnGuard.lastCoord)}`,
                `role ${stage84C35eBubbleRespawnGuard.lastRole}`,
                `last wrong room ${stage84C35eBubbleRespawnGuard.lastWrongRoom === null ? '-' : hexByte(stage84C35eBubbleRespawnGuard.lastWrongRoom)}`,
            ].join('; ')
        );

        const formatStage84C35eRespawnBytes = () => (
            stage84C35eBubbleRespawnGuard.lastPatchedAddrs.length
                ? `room-id writes ${stage84C35eBubbleRespawnGuard.lastPatchedAddrs.map(hexWord).join(' ')}; body ${hexWord(KL_STAGE84_C30.playerBodyXyzAddr)}..${hexWord(KL_STAGE84_C30.playerBodyXyzAddr + 2)}; head ${hexWord(KL_STAGE84_C30.playerHeadXyzAddr)}..${hexWord(KL_STAGE84_C30.playerHeadXyzAddr + 2)}`
                : '-'
        );

        const formatStage84C35fGameOverReset = () => (
            [
                `requested ${stage84C35fGameOverOriginReset.requested ? 'yes' : 'no'}`,
                `enabled ${stage84C35fGameOverOriginReset.enabled ? 'yes' : 'no'}`,
                `lives previous ${stage84C35fGameOverOriginReset.previousLives === null ? '-' : hexByte(stage84C35fGameOverOriginReset.previousLives)}`,
                `current ${stage84C35fGameOverOriginReset.currentLives === null ? '-' : hexByte(stage84C35fGameOverOriginReset.currentLives)}`,
                `latched ${stage84C35fGameOverOriginReset.gameOverLatched ? 'yes' : 'no'}`,
                `active game seen ${stage84C35fGameOverOriginReset.sawActiveGame ? 'yes' : 'no'}`,
                `zero-life armed ${stage84C35fGameOverOriginReset.zeroAfterActiveGame ? 'yes' : 'no'}`,
                `pending ${stage84C35fGameOverOriginReset.pendingReset ? stage84C35fGameOverOriginReset.pendingReset.trigger : 'none'}`,
                `resets ${stage84C35fGameOverOriginReset.resets}`,
                `writes ${stage84C35fGameOverOriginReset.writes}`,
                `charm record writes ${stage84C35fGameOverOriginReset.charmRecordWrites}`,
                `charm reset ${stage84C35fGameOverOriginReset.lastCharmResetAction}`,
                `trigger ${stage84C35fGameOverOriginReset.lastTrigger}`,
                `last action ${stage84C35fGameOverOriginReset.lastAction}`,
            ].join('; ')
        );

        const formatStage84C35fGameOverRoom = () => (
            [
                `current center ${fmtLogicalCoord(stage7SlidingCross.center)}`,
                `target origin (0, 0)`,
                `last reset from ${stage84C35fGameOverOriginReset.lastFromCoord ? fmtLogicalCoord(stage84C35fGameOverOriginReset.lastFromCoord) : '-'}`,
            ].join('; ')
        );

        const formatStage84C35fGameOverBytes = () => (
            [
                stage84C35fGameOverOriginReset.lastPatchedAddrs.length
                    ? `room/start writes ${stage84C35fGameOverOriginReset.lastPatchedAddrs.map(hexWord).join(' ')}`
                    : 'room/start writes -',
                `location table ${hexWord(KL_STAGE1.locationStart)}..${hexWord(KL_STAGE1.locationEnd - 1)} recompiled for origin cross`,
                stage84C35fGameOverOriginReset.lastCharmRecordAfter.length
                    ? `record 31 ${hexWord(stage84C31DisposableCharm.recordAddr)}: ${fmtBytes(stage84C35fGameOverOriginReset.lastCharmRecordBefore, 9)} -> ${fmtBytes(stage84C35fGameOverOriginReset.lastCharmRecordAfter, 9)}`
                    : 'record 31 cleanup not yet observed',
            ].join('; ')
        );

        const formatStage84RecordRefs = records => {
            if (!records.length) return 'none';
            const labels = records.slice(0, 10).map(record => (
                `${record.index}:${hexByte(record.sprite || 0)}@${hexByte(record.currentRoom || 0)}`
            ));
            return records.length > 10
                ? `${labels.join(' ')} ... (${records.length} record(s))`
                : labels.join(' ');
        };

        const formatStage84CauldronGateReadback = () => {
            if (!stage84CauldronGate.lastReadback.length) return 'unread';
            return stage84CauldronGate.lastReadback.map(item => (
                `${item.label} ${hexWord(item.opcodeAddr)}=${hexByte(item.opcode || 0)}/${hexByte(item.currentCompare || 0)} -> desired ${hexByte(item.desiredCompare)}${item.error ? ` (${item.error})` : ''}`
            )).join('; ');
        };

        const formatStage84C31Target = target => {
            if (!target) return 'none';
            const original = target.originalCharmRoom
                ? `; original interior ${target.originalCharmRoom.originalRoomHex}; spawn ${fmtXYZ(target.originalCharmRoom.spawn.x, target.originalCharmRoom.spawn.y, target.originalCharmRoom.spawn.z)}`
                : '';
            return `${target.role} ${hexByte(target.physicalRoomId)} ${fmtLogicalCoord(target.logicalCoord)} ${target.label}; ${formatQuestCharm(target.questCharm)} -> ${fmtMechanicSprite(target.sprite)}${original}`;
        };

        const decodeStage84Slot = (bytes, baseAddr) => {
            const sprite = bytes[0] || 0;
            const extraByte = bytes[8];
            const ptr = (bytes[16] || 0) | ((bytes[17] || 0) << 8);
            const nonZeroOffsets = getNonZeroOffsets(bytes);
            const empty = nonZeroOffsets.length === 0;
            const itemLike = sprite >= 0x60 && sprite <= 0x67;
            const cauldronDisplayLike = sprite >= 0xa0 && sprite <= 0xae;
            const kind = empty
                ? 'empty'
                : itemLike
                    ? 'item/charm'
                    : cauldronDisplayLike
                        ? 'cauldron bubble/display'
                        : 'unknown';
            const extraDecode = itemLike
                ? `room +8 ${extraByte === undefined ? 'unread' : hexByte(extraByte)}`
                : cauldronDisplayLike
                    ? `state/sprite +8 ${extraByte === undefined ? 'unread' : `${hexByte(extraByte)} ${fmtMechanicSprite(extraByte)}`}`
                    : `raw/state +8 ${extraByte === undefined ? 'unread' : hexByte(extraByte)}`;
            return {
                sprite,
                room: itemLike ? extraByte : undefined,
                extraByte,
                ptr,
                staticRecordIndex: getStage84StaticRecordIndexForPtr(ptr),
                kind,
                zero: empty,
                nonZeroOffsets,
                decode: [
                    `${kind}; ${fmtMechanicSprite(sprite)}`,
                    `XYZ ${fmtXYZ(bytes[1] || 0, bytes[2] || 0, bytes[3] || 0)}`,
                    `size ${fmtByte(bytes[4] || 0)}/${fmtByte(bytes[5] || 0)}/${fmtByte(bytes[6] || 0)}`,
                    `flags ${hexByte(bytes[7] || 0)}`,
                    extraDecode,
                    `ptr +16/+17 ${formatStage84Pointer(ptr)}`,
                    fmtNonZeroOffsets(nonZeroOffsets),
                ].join('; '),
                bytes: fmtBytes(bytes, 16),
                address: `${hexWord(baseAddr)}..${hexWord(baseAddr + bytes.length - 1)}`,
            };
        };

        const decodeStage84DynamicRecord = (workRange, addr) => {
            const bytes = readBytesFromRange(workRange, addr, 8);
            return {
                sprite: bytes[0],
                decode: [
                    fmtMechanicSprite(bytes[0]),
                    `XYZ ${fmtXYZ(bytes[1] || 0, bytes[2] || 0, bytes[3] || 0)}`,
                    `size ${fmtByte(bytes[4] || 0)}/${fmtByte(bytes[5] || 0)}/${fmtByte(bytes[6] || 0)}`,
                    `flags ${hexByte(bytes[7] || 0)}`,
                ].join('; '),
                bytes: fmtBytes(bytes, 8),
                address: `${hexWord(addr)}..${hexWord(addr + 7)}`,
                zero: allZero(bytes),
            };
        };

        const decodeStage84StaticObjectRecord = (itemObjectRange, index) => {
            const addr = KL_STAGE84_C30.staticObjectTableStart +
                index * KL_STAGE84_C30.staticObjectRecordSize;
            const bytes = readBytesFromRange(itemObjectRange, addr, KL_STAGE84_C30.staticObjectRecordSize);
            return {
                index,
                addr,
                bytes,
                sprite: bytes[0],
                startRoom: bytes[4],
                currentRoom: bytes[8],
                decode: [
                    `record ${index}`,
                    `graphic ${bytes[0] === undefined ? 'unread' : hexByte(bytes[0])}`,
                    `start XYZ ${fmtByte(bytes[1] || 0)}/${fmtByte(bytes[2] || 0)}/${fmtByte(bytes[3] || 0)}`,
                    `start room ${bytes[4] === undefined ? 'unread' : hexByte(bytes[4])}`,
                    `current XYZ ${fmtByte(bytes[5] || 0)}/${fmtByte(bytes[6] || 0)}/${fmtByte(bytes[7] || 0)}`,
                    `current room ${bytes[8] === undefined ? 'unread' : hexByte(bytes[8])}`,
                ].join('; '),
                address: `${hexWord(addr)}..${hexWord(addr + KL_STAGE84_C30.staticObjectRecordSize - 1)}`,
                zero: allZero(bytes),
            };
        };

        const renderStage84C30MechanicTable = (workRange, itemObjectRange, sample) => {
            if (!stage84C30Tbody || !stage84C30Status || !itemObjectRange) return;

            const currentCoord = getStage8CurrentCoord();
            const currentRoom = logicalMap.getRoomAt(currentCoord.x, currentCoord.y);
            const currentSector = logicalMap.getQuestSectorAt(currentCoord.x, currentCoord.y);
            const quest = currentSector.quest || {exists: false};
            const staticRecordCount = Math.floor(
                (KL_STAGE84_C30.staticObjectTableEnd - KL_STAGE84_C30.staticObjectTableStart) /
                KL_STAGE84_C30.staticObjectRecordSize
            );
            const staticRecords = Array.from({length: staticRecordCount}, (_, index) => (
                decodeStage84StaticObjectRecord(itemObjectRange, index)
            ));
            const nonZeroStaticRecordCount = staticRecords.filter(record => !record.zero).length;
            const currentRoomMatches = staticRecords.filter(record => (
                !record.zero && record.currentRoom === sample.room0
            ));
            const startRoomMatches = staticRecords.filter(record => (
                !record.zero && record.startRoom === sample.room0
            ));
            const carryState = decodeStage84CarryState(workRange);
            const inventoryState = decodeStage84InventoryState(workRange);
            const originalCauldronCheck = sample.room0 === KL_STAGE84_C30.cauldronPhysicalRoom;
            const logicalCauldron = currentRoom.questRole === 'cauldron';
            const c35aDynamicCandidates = getStage84C35aDynamicCandidates(workRange);
            const rows = [];
            const addRow = row => rows.push(row);

            addRow({
                state: 'ok',
                probe: 'context',
                address: '-',
                decode: `current ${fmtLogicalCoord(currentCoord)}; role ${currentRoom.questRole || 'none'}; physical ${hexByte(sample.room0)}`,
                room: quest.exists
                    ? `sector (${currentSector.sectorX}, ${currentSector.sectorY}); required ${formatQuestCharm(quest.requiredCharm)}`
                    : `sector (${currentSector.sectorX}, ${currentSector.sectorY}); no quest`,
                bytes: '-',
                notes: [
                    stage84C31DisposableCharm.requested
                        ? 'C3.1 may rewrite exactly one disposable static object-table record; C3.2 observes carried state.'
                        : 'C3.1 disposable charm probe is off.',
                    stage84C33CauldronAcceptance.requested
                        ? 'C3.3 may mark JS quest-sector state complete when a matching carried charm is dropped at a logical cauldron.'
                        : 'C3.3 JS-side cauldron acceptance is off.',
                    stage84C34RequestOrderPatch.requested
                        ? 'C3.4 may patch the original current request-order slot to match the JS sector charm.'
                        : 'C3.4 original request-order patch is off.',
                    'Original inventory, charm-order, and global completion bytes are not directly written.',
                ].join(' '),
            });

            addRow({
                state: originalCauldronCheck && !logicalCauldron ? 'warn' : originalCauldronCheck ? 'ok' : 'muted',
                probe: 'C3.0b cauldron room check',
                address: 'code compares physical room with 0x88',
                decode: `original drop check ${originalCauldronCheck ? 'TRUE' : 'false'}; physical ${hexByte(sample.room0)}; logical role ${currentRoom.questRole || 'none'}`,
                room: `logical ${fmtLogicalCoord(currentCoord)}; quest cauldron ${logicalCauldron ? 'yes' : 'no'}`,
                bytes: '-',
                notes: originalCauldronCheck && !logicalCauldron
                    ? 'Important: under Stage 7 recentering, original cauldron-drop code would treat this physical center as room 0x88 even when the logical room is not a quest cauldron. C3.0c gates that before C3.1 drop probes.'
                    : 'Original cauldron-drop code is hard-coded to physical room 0x88; this row compares that with the logical quest role.',
            });

            addRow({
                state: stage84CauldronGate.lastError
                    ? 'bad'
                    : stage84CauldronGate.allowed
                        ? 'ok'
                        : 'warn',
                probe: 'C3.0c cauldron acceptance gate',
                address: KL_STAGE84_C30.cauldronGatePatches
                    .map(patch => hexWord(patch.immediateAddr))
                    .join(' '),
                decode: `gate ${stage84CauldronGate.enabled ? 'enabled' : 'disabled'}; logical role ${stage84CauldronGate.lastRole}; allow original cauldron drop ${stage84CauldronGate.allowed ? 'yes' : 'no'}; compare byte ${hexByte(stage84CauldronGate.desiredCompare)}; ${formatStage84CauldronGateReadback()}`,
                room: `logical ${fmtLogicalCoord(stage84CauldronGate.lastCoord)}; physical ${hexByte(sample.room0)}`,
                bytes: '-',
                notes: stage84CauldronGate.lastError
                    ? stage84CauldronGate.lastError
                    : `Runtime gate for the two pickup/drop CP 0x88 checks. Outside logical cauldron rooms, compare immediates are changed to ${hexByte(KL_STAGE84_C30.cauldronGateBlockedRoom)}; inside logical cauldron rooms they are restored to ${hexByte(KL_STAGE84_C30.cauldronPhysicalRoom)}. Writes so far: ${stage84CauldronGate.writes}; last action: ${stage84CauldronGate.lastAction}.`,
            });

            const c31Record = staticRecords[KL_STAGE84_C30.disposableRecordIndex] || null;
            addRow({
                state: stage84C31DisposableCharm.lastError
                    ? 'bad'
                    : stage84C31DisposableCharm.enabled
                        ? stage84C31DisposableCharm.target ? 'warn' : 'muted'
                        : 'muted',
                probe: 'C3.1 disposable charm record',
                address: `${hexWord(stage84C31DisposableCharm.recordAddr)}..${hexWord(stage84C31DisposableCharm.recordAddr + KL_STAGE84_C30.staticObjectRecordSize - 1)}`,
                decode: `requested ${stage84C31DisposableCharm.requested ? 'yes' : 'no'}; enabled ${stage84C31DisposableCharm.enabled ? 'yes' : 'no'}; last seeded target ${formatStage84C31Target(stage84C31DisposableCharm.target)}; carried ${stage84C31DisposableCharm.carried ? 'yes' : 'no'}; live ref ${stage84C31DisposableCharm.referencedInLiveSlot ? 'yes' : 'no'}`,
                room: c31Record
                    ? `record current ${hexByte(c31Record.currentRoom || 0)}; start ${hexByte(c31Record.startRoom || 0)}`
                    : 'record unread',
                bytes: c31Record ? fmtBytes(c31Record.bytes, 9) : fmtBytes(stage84C31DisposableCharm.lastReadback, 9),
                notes: stage84C31DisposableCharm.lastError
                    ? stage84C31DisposableCharm.lastError
                    : `Opt-in with ?stage84c31=1. Uses static object record ${stage84C31DisposableCharm.recordIndex}; writes ${stage84C31DisposableCharm.writes}; last action: ${stage84C31DisposableCharm.lastAction}. The target is the last seeded source, not necessarily the current room. If you pick it up, pick it back up again before leaving after a non-cauldron drop during this disposable probe.`,
            });

            addRow({
                state: stage84C32CarryProbe.currentlyCarrying ? 'ok' : 'muted',
                probe: 'C3.2 carried identity',
                address: `${hexWord(KL_STAGE84_C30.inventoryStart)}..${hexWord(KL_STAGE84_C30.inventoryEnd - 1)}`,
                decode: formatStage84C32Identity(stage84C32CarryProbe.current),
                room: formatStage84C32SourceRoom(stage84C32CarryProbe.current),
                bytes: fmtBytes(inventoryState.bytes, 16),
                notes: 'Read-only carried-object identity probe. For the disposable charm, the important result is ptr 0x7109 -> static object 31 plus the sprite held in the carried display slot.',
            });

            addRow({
                state: stage84C32CarryProbe.currentlyCarrying
                    ? stage84C32CarryProbe.transitionsWhileCarried > 0 ? 'ok' : 'warn'
                    : 'muted',
                probe: 'C3.2 carry stability',
                address: 'logical recenter history',
                decode: formatStage84C32Stability(),
                room: `current ${fmtLogicalCoord(currentCoord)}; physical ${hexByte(sample.room0)}`,
                bytes: '-',
                notes: 'If transitions increase while the carried pointer stays stable, original carry state is surviving Stage 7 physical-room recentering.',
            });

            addRow({
                state: stage84C32CarryProbe.current
                    ? stage84C32CarryProbe.current.spriteMatch ? 'ok' : 'warn'
                    : 'muted',
                probe: 'C3.2 current-sector match',
                address: 'JS quest metadata vs carried item',
                decode: formatStage84C32SectorMatch(stage84C32CarryProbe.current),
                room: `logical ${fmtLogicalCoord(currentCoord)}; sector (${currentSector.sectorX}, ${currentSector.sectorY})`,
                bytes: '-',
                notes: 'This compares JS metadata only. The original cauldron requested-object display remains independent unless the C3.4 request-order patch is enabled.',
            });

            addRow({
                state: stage84C33CauldronAcceptance.requested
                    ? stage84C33CauldronAcceptance.lastState && stage84C33CauldronAcceptance.lastState.completed
                        ? 'ok'
                        : logicalCauldron
                            ? 'warn'
                            : 'muted'
                    : 'muted',
                probe: 'C3.3 cauldron acceptance',
                address: 'JS quest sector state',
                decode: formatStage84C33Acceptance(),
                room: formatStage84C33Room(),
                bytes: '-',
                notes: 'Opt-in with ?stage84c33=1. Accepts a player drop action at a logical cauldron when the carried quest charm sprite 0x60..0x66 matches the JS request. This proof marks JS persistent sector state only; it does not consume the object or write original order/completion bytes. The original cauldron display is independent unless C3.4 is enabled.',
            });

            addRow({
                state: stage84C34RequestOrderPatch.lastError
                    ? 'bad'
                    : stage84C34RequestOrderPatch.requested
                        ? logicalCauldron ? 'warn' : 'muted'
                        : 'muted',
                probe: 'C3.4 request-order patch',
                address: `${hexWord(KL_STAGE84_C30.objectsRequiredAddr)}..${hexWord(KL_STAGE84_C30.objectsRequiredAddr + KL_STAGE84_C30.objectsRequiredLength - 1)}`,
                decode: formatStage84C34RequestPatch(),
                room: formatStage84C34Room(),
                bytes: fmtBytes(stage84C34RequestOrderPatch.tableBytes, KL_STAGE84_C30.objectsRequiredLength),
                notes: stage84C34RequestOrderPatch.lastError
                    ? stage84C34RequestOrderPatch.lastError
                    : 'Opt-in with ?stage84c34=1. Patches only objects_required[objects_put_in_cauldron] for the current or directly adjacent logical cauldron, so the original cauldron reveal/acceptance path asks for the JS sector charm. This may let the original objects_put_in_cauldron counter increment on a correct drop; watch the C3.0b carry/control bytes row.',
            });

            addRow({
                state: stage84C35aTimingProbe.currentKind === 'request flash'
                    ? 'ok'
                    : stage84C35aTimingProbe.currentKind === 'bubble frame'
                        ? 'warn'
                        : 'muted',
                probe: 'C3.5a bubble/request timing',
                address: `${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr)}..${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr + KL_STAGE84_C30.liveSlotSize - 1)}`,
                decode: formatStage84C35aTiming(),
                room: formatStage84C35aRoom(),
                bytes: fmtBytes(stage84C35aTimingProbe.bytes, 18),
                notes: 'Read-only. Tracks the 0x5C68 live cauldron bubble/display slot. Use this as both the baseline and after-change cadence measurement for C3.5b.',
            });

            addRow({
                state: stage84C35bSlowdownProbe.lastError
                    ? 'bad'
                    : stage84C35bSlowdownProbe.requested
                        ? stage84C35bSlowdownProbe.lastRole === 'cauldron' ? 'warn' : 'muted'
                        : 'muted',
                probe: 'C3.5b slowdown experiment',
                address: `${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr)} sprite byte`,
                decode: formatStage84C35bSlowdown(),
                room: formatStage84C35bRoom(),
                bytes: '-',
                notes: stage84C35bSlowdownProbe.lastError
                    ? stage84C35bSlowdownProbe.lastError
                    : 'Opt-in with ?stage84c35b=1. Default mode writes only 0xA8..0xAE request sprites. Add ?stage84c35bbubbles=human to also hold harmless human-form 0xA0..0xA3 bubbles by holding sprite/Z/dZ bytes. All writes pause outside human form so wolf bubble collision remains original.',
            });

            addRow({
                state: stage84C35cRoutineThrottle.lastError
                    ? 'bad'
                    : stage84C35cRoutineThrottle.requested
                        ? stage84C35cRoutineThrottle.patchState === 'throttled' ? 'warn' : 'ok'
                        : 'muted',
                probe: 'C3.5c routine throttle',
                address: `${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateMotionCallAddr)} / ${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.bubbleUpdateGraphicCallAddr)} / ${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.requestDisplayResetAddr)}`,
                decode: formatStage84C35cRoutineThrottle(),
                room: formatStage84C35cRoutineRoom(),
                bytes: formatStage84C35cRoutineBytes(),
                notes: stage84C35cRoutineThrottle.lastError
                    ? stage84C35cRoutineThrottle.lastError
                    : 'Opt-in with ?stage84c35c=1. Routine-level probe patches the first original cauldron bubble updater call to JP the normal exit on selected human-form bubble frames, holds the request-display reset on request frames, then restores original bytes on active frames and whenever the player is not human.',
            });

            addRow({
                state: stage84C35eBubbleRespawnGuard.lastError
                    ? 'bad'
                    : stage84C35eBubbleRespawnGuard.corrections
                        ? 'ok'
                        : stage84C35eBubbleRespawnGuard.pendingDeath
                            ? 'warn'
                            : stage84C35eBubbleRespawnGuard.enabled
                                ? 'ok'
                                : 'muted',
                probe: 'C3.5e general death respawn guard',
                address: `${hexWord(KL_STAGE7_SLIDING_CROSS.currentRoomAddr)} / ${hexWord(KL_STAGE84_C30.playerBodyXyzAddr)} / ${hexWord(KL_STAGE84_C30.playerHeadXyzAddr)}`,
                decode: formatStage84C35eRespawnGuard(),
                room: formatStage84C35eRespawnRoom(),
                bytes: formatStage84C35eRespawnBytes(),
                notes: stage84C35eBubbleRespawnGuard.lastError
                    ? stage84C35eBubbleRespawnGuard.lastError
                    : 'Enabled by default with Stage 7 sliding; add ?stage84c35e=0 to disable. Records every logical-room entry, detects a general life loss, suppresses the death-induced physical-neighbour slide, and restores the same logical room at its recorded entrance.',
            });

            addRow({
                state: stage84C35fGameOverOriginReset.lastError
                    ? 'bad'
                    : stage84C35fGameOverOriginReset.pendingReset
                        ? 'warn'
                        : stage84C35fGameOverOriginReset.resets
                            ? 'ok'
                            : stage84C35fGameOverOriginReset.enabled
                                ? 'ok'
                                : 'muted',
                probe: 'C3.5f game-over origin reset',
                address: `${hexWord(0x5bba)} / ${hexWord(KL_STAGE7_SLIDING_CROSS.currentRoomAddr)} / ${hexWord(KL_STAGE2.startLocationsAddr)} / ${hexWord(stage84C31DisposableCharm.recordAddr)}`,
                decode: formatStage84C35fGameOverReset(),
                room: formatStage84C35fGameOverRoom(),
                bytes: formatStage84C35fGameOverBytes(),
                notes: stage84C35fGameOverOriginReset.lastError
                    ? stage84C35fGameOverOriginReset.lastError
                    : 'Enabled by default with Stage 7 sliding; add ?stage84c35f=0 to disable. Detects the original signed lives underflow 0x00 -> 0xFF, recompiles the physical cross around logical (0,0), reasserts all four 0x88 start choices, and clears disposable static record 31 before and after original new-game initialization. Player XYZ remains owned by the original restart routine.',
            });

            addRow({
                state: stage84C35aTimingProbe.recentSprites.length ? 'ok' : 'muted',
                probe: 'C3.5a recent sprite trail',
                address: `${hexWord(KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr)} sprite byte`,
                decode: formatStage84C35aTrail(),
                room: `expected request ${stage84C35aTimingProbe.expectedRequestSprite === null ? '-' : fmtMechanicSprite(stage84C35aTimingProbe.expectedRequestSprite)}`,
                bytes: '-',
                notes: 'Read-only trail of observed sprite changes. Look for 0xA0..0xA3 bubble frames interrupted by 0xA8..0xAE requested-object flashes.',
            });

            addRow({
                state: c35aDynamicCandidates.length ? 'warn' : 'muted',
                probe: 'C3.5a dynamic display candidates',
                address: `${hexWord(KL_STAGE84_C30.dynamicStart)}..${hexWord(KL_STAGE84_C30.dynamicStart + KL_STAGE84_C30.dynamicProbeCount * KL_STAGE84_C30.dynamicSlotSize - 1)}`,
                decode: formatStage84C35aDynamicCandidates(c35aDynamicCandidates),
                room: `logical ${fmtLogicalCoord(currentCoord)}; physical ${hexByte(sample.room0)}`,
                bytes: c35aDynamicCandidates.length ? fmtBytes(c35aDynamicCandidates[0].bytes, 8) : '-',
                notes: 'Supporting read-only scan of expanded dynamic records for 0xA0..0xAE sprites. 0x5C68 remains the primary timing candidate unless this row shows a clearer display record.',
            });

            addRow({
                state: carryState.changed ? 'warn' : 'muted',
                probe: 'C3.0b carry/control bytes',
                address: `${hexWord(KL_STAGE84_C30.carryStateStart)}..${hexWord(KL_STAGE84_C30.carryStateEnd - 1)}`,
                decode: carryState.decode,
                room: `current physical ${hexByte(sample.room0)}`,
                bytes: fmtBytes(carryState.bytes, 24),
                notes: 'Read-only state bytes: pickup/drop latch, carried-change flag, user input, lives, objects_put_in_cauldron, all_objs_in_cauldron, obj_dropping_into_cauldron, and cant_drop.',
            });

            addRow({
                state: inventoryState.changed ? 'warn' : 'muted',
                probe: 'C3.0b inventory/carried queue',
                address: `${hexWord(KL_STAGE84_C30.inventoryStart)}..${hexWord(KL_STAGE84_C30.inventoryEnd - 1)}`,
                decode: inventoryState.decode,
                room: `current physical ${hexByte(sample.room0)}`,
                bytes: fmtBytes(inventoryState.bytes, 16),
                notes: 'Inventory handoff plus the three 4-byte carried-object display entries. Pointers should point into 0x6FF2..0x7111 when carrying a real special object.',
            });

            addRow({
                state: currentRoomMatches.length ? 'warn' : 'muted',
                probe: 'C3.0b static records for current room',
                address: `${hexWord(KL_STAGE84_C30.staticObjectTableStart)}..${hexWord(KL_STAGE84_C30.staticObjectTableEnd - 1)}`,
                decode: `current-room matches ${currentRoomMatches.length}: ${formatStage84RecordRefs(currentRoomMatches)}; start-room matches ${startRoomMatches.length}: ${formatStage84RecordRefs(startRoomMatches)}`,
                room: `physical ${hexByte(sample.room0)}; logical ${fmtLogicalCoord(currentCoord)}`,
                bytes: '-',
                notes: 'find_special_objs_here copies static records whose current room equals the physical room into 0x5C48/0x5C68. This row tells us whether an original item can appear in the active center.',
            });

            for (const slot of KL_STAGE84_C30.liveSlots) {
                const bytes = readBytesFromRange(workRange, slot.addr, KL_STAGE84_C30.liveSlotSize);
                const decoded = decodeStage84Slot(bytes, slot.addr);
                const interesting = !decoded.zero || decoded.room === sample.room0;
                const roomText = decoded.zero
                    ? `empty slot; current physical ${hexByte(sample.room0)}`
                    : decoded.kind === 'item/charm'
                        ? `item room ${hexByte(decoded.room)}; current physical ${hexByte(sample.room0)}${decoded.room === sample.room0 ? '; matches current' : ''}`
                        : decoded.kind === 'cauldron bubble/display'
                            ? `bubble/display state +8 ${hexByte(decoded.extraByte)} (${fmtMechanicSprite(decoded.extraByte)}); current physical ${hexByte(sample.room0)}`
                            : `raw/state +8 ${decoded.extraByte === undefined ? 'unread' : hexByte(decoded.extraByte)}; current physical ${hexByte(sample.room0)}`;
                addRow({
                    state: interesting ? 'warn' : 'muted',
                    probe: slot.label,
                    address: decoded.address,
                    decode: decoded.decode,
                    room: roomText,
                    bytes: decoded.bytes,
                    notes: slot.addr === KL_STAGE82C_ORIGINAL_CAULDRON.liveBubbleSlotAddr
                        ? 'Shared with cauldron bubbles/item-display candidates; +8 is not assumed to be a room unless a real item/charm sprite is observed. The decode lists non-zero offsets and the +16/+17 static-table pointer.'
                        : 'Candidate original item/charm live slot; watch this during pickup/carry/drop probes. The decode lists non-zero offsets and the +16/+17 static-table pointer.',
                });
            }

            for (let index = 0; index < KL_STAGE84_C30.dynamicProbeCount; index++) {
                const addr = KL_STAGE84_C30.dynamicStart + index * KL_STAGE84_C30.dynamicSlotSize;
                const decoded = decodeStage84DynamicRecord(workRange, addr);
                addRow({
                    state: decoded.zero ? 'muted' : 'ok',
                    probe: `dynamic ${index}`,
                    address: decoded.address,
                    decode: decoded.decode,
                    room: `current ${fmtLogicalCoord(currentCoord)} / physical ${hexByte(sample.room0)}`,
                    bytes: decoded.bytes,
                    notes: 'First 8 bytes of a 0x20 expanded room/object record from RetrieveScreen working memory.',
                });
            }

            for (const decoded of staticRecords) {
                const currentMatch = decoded.currentRoom === sample.room0 || decoded.startRoom === sample.room0;
                const itemCode = decoded.sprite >= 0x60 && decoded.sprite <= 0x67;
                addRow({
                    state: currentMatch ? 'warn' : itemCode ? 'ok' : decoded.zero ? 'muted' : 'ok',
                    probe: `static object ${decoded.index}`,
                    address: decoded.address,
                    decode: decoded.decode,
                    room: `start ${decoded.startRoom === undefined ? '-' : hexByte(decoded.startRoom)}; current ${decoded.currentRoom === undefined ? '-' : hexByte(decoded.currentRoom)}${currentMatch ? '; current physical-room match' : ''}`,
                    bytes: fmtBytes(decoded.bytes, 9),
                    notes: 'Original 9-byte static object table record at 0x6FF2+n*9. Watch for changes after leaving rooms with moved/dropped items.',
                });
            }

            stage84C30Status.textContent = [
                `C3.0-C3.6 mechanic diagnostics at ${fmtLogicalCoord(currentCoord)} (${currentRoom.questRole || 'none'}).`,
                quest.exists ? `Required ${formatQuestCharm(quest.requiredCharm)}.` : 'No quest in current sector.',
                `Sampling carry state ${hexWord(KL_STAGE84_C30.carryStateStart)}..${hexWord(KL_STAGE84_C30.carryStateEnd - 1)}, ${KL_STAGE84_C30.liveSlots.length} live slots, ${KL_STAGE84_C30.dynamicProbeCount} dynamic records, and ${staticRecordCount} raw static object records (${nonZeroStaticRecordCount} currently non-zero).`,
                `C3.1 disposable record ${stage84C31DisposableCharm.recordIndex} is ${stage84C31DisposableCharm.requested ? 'requested' : 'off'}; last action: ${stage84C31DisposableCharm.lastAction}.`,
                `C3.2 carried state: ${stage84C32CarryProbe.lastAction}.`,
                `C3.3 JS acceptance: ${stage84C33CauldronAcceptance.lastAction}.`,
                `C3.4 request patch: ${stage84C34RequestOrderPatch.lastAction}.`,
                `C3.5a timing: ${stage84C35aTimingProbe.lastAction}.`,
                `C3.5b slowdown: ${stage84C35bSlowdownProbe.lastAction}.`,
                `C3.5c routine throttle: ${stage84C35cRoutineThrottle.lastAction}.`,
                `C3.5e death guard: ${stage84C35eBubbleRespawnGuard.lastAction}.`,
                `C3.5f origin reset: ${stage84C35fGameOverOriginReset.lastAction}.`,
                `Diagnostics build: ${KL_DIAGNOSTICS_BUILD}.`,
            ].join(' ');

            stage84C30Tbody.innerHTML = rows.map(row => `
                <tr class="state-${row.state}">
                    <td>${escapeHtml(row.probe)}</td>
                    <td>${escapeHtml(row.address)}</td>
                    <td>${escapeHtml(row.decode)}</td>
                    <td>${escapeHtml(row.room)}</td>
                    <td>${escapeHtml(row.bytes)}</td>
                    <td>${escapeHtml(row.notes)}</td>
                </tr>
            `).join('');
        };

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

        const formatStage7Style = item => {
            const style = item.style || {};
            if (!style.biome) return `${item.source}; no generated style`;
            const region = style.region
                ? ` r(${style.region.x},${style.region.y})`
                : '';
            return `${style.biome}${region}`;
        };

        const formatStage7Shape = item => (
            `sel ${item.size.selector}; ${item.size.x}/${item.size.y}/${item.size.z}`
        );

        const formatStage7CompileInfo = item => {
            const backgrounds = item.backgrounds && item.backgrounds.length
                ? fmtBytes(item.backgrounds, 8)
                : '(none)';
            const overlay = item.reciprocalExitAdjustments && item.reciprocalExitAdjustments.length
                ? `overlay ${item.reciprocalExitAdjustments.map(adjustment => `${adjustment.type} ${adjustment.direction}`).join('; ')}`
                : 'overlay none';
            const experiment = item.theme === 'tree' && item.size.selector !== 0
                ? `; custom tree wall; west wall X ${hexByte(stage7WoodWallTuning.westFillerX)}`
                : '';
            return `entry ${item.entrySize}; ${item.byteCount} bytes; bg ${item.backgroundCount}: ${backgrounds}; ${overlay}${experiment}`;
        };

        const renderStage7StyleTable = () => {
            if (!stage7StyleTbody || !stage7StyleStatus) return;

            const setStage7StyleMessage = (message, state = 'muted') => {
                stage7StyleStatus.textContent = `${message} Diagnostics build: ${KL_DIAGNOSTICS_BUILD}.`;
                stage7StyleTbody.innerHTML = `
                    <tr class="state-${state}">
                        <td colspan="10">${escapeHtml(message)}</td>
                    </tr>
                `;
            };

            if (!stage7SlidingCross.enabled) {
                setStage7StyleMessage('Stage 7 sliding cross is disabled; add ?stage7sliding=1 to see generated cross properties.');
                return;
            }

            if (stage7SlidingCross.mapLoadPending) {
                setStage7StyleMessage('Waiting for optional logical map JSON load before compiling the Stage 7 cross.', 'warn');
                return;
            }

            if (stage7SlidingCross.lastError) {
                setStage7StyleMessage(stage7SlidingCross.lastError, 'bad');
                return;
            }

            const compiled = stage7SlidingCross.lastCompiled;
            if (!compiled) {
                setStage7StyleMessage('Waiting for the first Stage 7 physical cross compilation.', 'warn');
                return;
            }

            const adjustmentCount = compiled.roomSummaries.reduce((count, item) => (
                count + (item.reciprocalExitAdjustments || []).length
            ), 0);
            const styleNames = Array.from(new Set(
                compiled.roomSummaries
                    .map(item => item.style && item.style.biome)
                    .filter(Boolean)
            ));
            const transition = stage7SlidingCross.lastTransition
                ? ` Last move ${stage7SlidingCross.lastTransition.direction}.`
                : '';
            stage7StyleStatus.textContent = [
                `Center ${fmtLogicalCoord(stage7SlidingCross.center)}; generation ${stage7SlidingCross.generation}.`,
                `Styles in cross: ${styleNames.length ? styleNames.join(', ') : 'authored/no generated style'}.`,
                adjustmentCount
                    ? `Reciprocal overlay adjustments: ${adjustmentCount}.`
                    : 'Reciprocal overlay: no changes.',
                transition,
                `Diagnostics build: ${KL_DIAGNOSTICS_BUILD}.`,
            ].join(' ');

            stage7StyleTbody.innerHTML = compiled.roomSummaries.map(item => {
                const adjustments = item.reciprocalExitAdjustments || [];
                const experimentalTreeRectangle = item.theme === 'tree' && item.size.selector !== 0;
                const state = adjustments.length || experimentalTreeRectangle ? 'warn' : 'ok';
                return `
                    <tr class="state-${state}">
                        <td>${escapeHtml(item.role)}</td>
                        <td>${hexByte(item.physicalRoomId)}</td>
                        <td>${escapeHtml(fmtLogicalCoord(item.logicalCoord))}</td>
                        <td>${escapeHtml(item.label)}<br>${escapeHtml(item.source)}</td>
                        <td>${escapeHtml(formatStage7Style(item))}</td>
                        <td>${escapeHtml(formatStage7Shape(item))}</td>
                        <td>${escapeHtml(`${item.theme}; attr ${item.colour}`)}</td>
                        <td>${escapeHtml(formatLogicalExits({exits: item.exits}))}</td>
                        <td>${escapeHtml(formatLogicalBlocks({blocks: item.blocks || []}))}</td>
                        <td>${escapeHtml(formatStage7CompileInfo(item))}</td>
                    </tr>
                `;
            }).join('');
        };

        const renderStage7SlidingRow = () => {
            renderStage8QuestTable();
            renderStage7StyleTable();

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
                await writeStage7CustomBackgrounds();
                await applyStage84C31DisposableCharm(compiled);
                logicalMap.markVisited(stage7SlidingCross.center.x, stage7SlidingCross.center.y);
                stage7SlidingCross = {
                    ...stage7SlidingCross,
                    done: true,
                    inFlight: false,
                    lastError: null,
                    lastCompiled: compiled,
                    generation: stage7SlidingCross.generation + 1,
                    message: `${reason}; erased ${hexWord(KL_STAGE1.locationStart)}..${hexWord(KL_STAGE1.locationEnd - 1)}, wrote ${compiled.bytes.length}/${compiled.capacity} room bytes, and installed custom tree-wall backgrounds at ${hexWord(KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize2Addr)} and ${hexWord(KL_STAGE7_CUSTOM_BACKGROUNDS.treeWallSize3Addr)}.`,
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

        const annotateStage7SampleRoomFields = (sample, staticRange) => {
            const entry = decodeLocationEntry(staticRange, sample.room0);
            sample.attrOk = false;
            sample.sizeOk = false;
            if (!entry) return;

            const decodedSize = decodeSize(staticRange, entry.selector);
            sample.attrOk = (sample.attrWork & 0x07) === entry.attr;
            sample.sizeOk = (
                decodedSize.x === sample.sizeX &&
                decodedSize.y === sample.sizeY &&
                decodedSize.z === sample.sizeZ
            );
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
                lastCompiled: null,
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
                frame: frameCompletedCount,
                sample: sampleCount,
                source: sample.source,
                direction,
                fromRoom: sample.room0,
                viaPhysicalRoom: sample.room0,
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
                if (stage7SlidingCross.enabled) {
                    await applyStage7CrossInjection('Initial Stage 7 physical cross injection');
                    await applyStage2RoomCleanPatch();
                } else {
                    await applyStage2RoomCleanPatch();
                    await applyStage5StaticMapInjection();
                    // Dormant by default. Open index.html?stage3test=1 to run
                    // this fixed-size one-room injection before the next
                    // retrieve_screen rebuild.
                    await applyStage3OneRoomInjectionTest();
                }

                const readDiagnosticSnapshot = async () => {
                    const [workRange, staticRange, itemObjectRange, startLocationsRange, ...cleanRoomRanges] = await Promise.all([
                        readRange(KL_STAGE1.workStart, KL_STAGE1.workEnd),
                        readRange(KL_STAGE1.staticStart, KL_STAGE1.staticEnd),
                        readRange(KL_STAGE84_C30.staticObjectTableStart, KL_STAGE84_C30.staticObjectTableEnd),
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
                        itemObjectRange,
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

                let {workRange, staticRange, itemObjectRange, sample} = await readDiagnosticSnapshot();
                let stage7Action = null;

                if (stage7SlidingCross.enabled) {
                    annotateStage7SampleRoomFields(sample, staticRange);
                    const gameOverAction = await applyStage84C35fGameOverOriginReset(workRange, sample);
                    if (gameOverAction && gameOverAction.reset) {
                        ({workRange, staticRange, itemObjectRange, sample} = await readDiagnosticSnapshot());
                        sample.stage84C35fAction = gameOverAction;
                        annotateStage7SampleRoomFields(sample, staticRange);
                    }
                    if (!gameOverAction || !gameOverAction.suppressGeneralDeath) {
                        const respawnAction = await applyStage84C35eBubbleRespawnGuard(workRange, sample);
                        if (respawnAction && respawnAction.corrected) {
                            ({workRange, staticRange, itemObjectRange, sample} = await readDiagnosticSnapshot());
                            sample.stage84C35eAction = respawnAction;
                            annotateStage7SampleRoomFields(sample, staticRange);
                        }
                    }
                    if (!gameOverAction || !gameOverAction.suppressStage7) {
                        updateTransition(sample);
                        stage7Action = await handleStage7SlidingTransition(sample, workRange);
                        if (stage7Action && stage7Action.recentered) {
                            ({workRange, staticRange, itemObjectRange, sample} = await readDiagnosticSnapshot());
                            sample.stage7Action = stage7Action;
                            annotateStage7SampleRoomFields(sample, staticRange);
                            const postRecenterRespawnAction = await applyStage84C35eBubbleRespawnGuard(workRange, sample);
                            if (postRecenterRespawnAction && postRecenterRespawnAction.corrected) {
                                ({workRange, staticRange, itemObjectRange, sample} = await readDiagnosticSnapshot());
                                sample.stage7Action = stage7Action;
                                sample.stage84C35eAction = postRecenterRespawnAction;
                                annotateStage7SampleRoomFields(sample, staticRange);
                            }
                        }
                    }
                }
                await updateStage82CBubbleProbe(workRange, sample);
                await updateStage84CauldronGate();
                updateStage84C31ObservedState(workRange);
                updateStage84C32C33FromSnapshot(workRange, sample);
                await updateStage84C34RequestOrderPatch(workRange);
                updateStage84C35aTimingProbe(workRange);
                await updateStage84C35bSlowdownProbe(workRange);
                await updateStage84C35cRoutineThrottle(workRange);
                updateStage84C35eBubbleRespawnState(workRange, sample);

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
                renderStage82CBubbleProbeRow();
                renderStage2Cross(staticRange, sample);
                renderStage4LogicalMap();
                renderStage84C30MechanicTable(workRange, itemObjectRange, sample);
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
        const runStartupPrime = async () => {
            startupPrimePending = true;
            try {
                if (logicalMapLoadPromise) {
                    await logicalMapLoadPromise.catch(() => null);
                }
                await sample('startup-prime');
            } finally {
                startupPrimePending = false;
            }

            if (options.startAfterStartupPrime && typeof emu.start === 'function') {
                if (!stage7SlidingCross.enabled || stage7SlidingCross.done) {
                    emu.start();
                } else {
                    setRow(
                        'sampler',
                        'Startup prime held',
                        `Execution is still paused because the Stage 7 physical cross was not injected. ${stage7SlidingCross.lastError || stage7SlidingCross.message}`,
                        stage7SlidingCross.lastError ? 'bad' : 'warn'
                    );
                }
            }
        };

        if (typeof emu.onReady === 'function') {
            setRow(
                'sampler',
                'Startup prime pending',
                'The emulator is loaded paused; the runtime will inject the initial physical cross before starting execution.',
                'warn'
            );
            emu.onReady(() => {
                runStartupPrime().catch(err => {
                    setRow('sampler', 'Startup prime error', String(err), 'bad');
                    startupPrimePending = false;
                    if (options.startAfterStartupPrime && typeof emu.start === 'function') {
                        emu.start();
                    }
                });
            });
        } else {
            runStartupPrime().catch(err => {
                setRow('sampler', 'Startup prime error', String(err), 'bad');
            });
        }

        window.setInterval(() => {
            if (frameCompletedCount === 0 && !startupPrimePending) {
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
        getQuestSector: logicalMap.getQuestSectorAt,
        getQuestRoomInfo: logicalMap.getQuestRoomInfoAt,
        getQuestReachability: logicalMap.getQuestReachabilityAt,
        compileLogicalRoom: logicalMap.compileRoom,
        loadLogicalMapDocument,
        loadLogicalMapFromUrl,
    };
}
