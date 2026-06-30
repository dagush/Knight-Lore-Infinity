import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const asmPath = path.join(rootDir, 'Docs', 'knightlore.asm');
const outPath = path.join(rootDir, 'SRC', 'static', 'maps', 'knight-lore-original-map.json');

const LOCATION_TABLE_START = 0x6251;
const LOCATION_TABLE_END = 0x6bd1;
const MAP_FORMAT = 'knight-lore-infinity-logical-map-v1';

const BACKGROUND_NAMES = [
    'arch north', 'arch east', 'arch south', 'arch west',
    'tree arch north', 'tree arch east', 'tree arch south', 'tree arch west',
    'portcullis north', 'portcullis east', 'portcullis south', 'portcullis west',
    'wall size 1', 'wall size 2', 'wall size 3', 'tree room size 1',
    'tree filler west', 'tree filler north', 'wizard', 'cauldron',
    'high arch east', 'high arch south', 'high arch east base', 'high arch south base',
];

const hexByte = value => `0x${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;

const parseByteToken = token => {
    const trimmed = token.trim();
    if (!trimmed) return null;
    const value = Number.parseInt(trimmed, 0);
    if (!Number.isInteger(value) || value < 0 || value > 0xff) {
        throw new Error(`Invalid byte token "${token}".`);
    }
    return value;
};

const extractLocationTableBytes = asmText => {
    const start = asmText.indexOf('location_tbl:');
    const end = asmText.indexOf('block_type_tbl:');
    if (start < 0 || end < 0 || end <= start) {
        throw new Error('Could not find location_tbl..block_type_tbl in Docs/knightlore.asm.');
    }

    const bytes = [];
    for (const line of asmText.slice(start, end).split(/\r?\n/)) {
        const code = line.split(';')[0];
        const dbIndex = code.indexOf('DB');
        if (dbIndex < 0) continue;
        const values = code.slice(dbIndex + 2).split(',');
        for (const token of values) {
            const value = parseByteToken(token);
            if (value !== null) bytes.push(value);
        }
    }
    return bytes;
};

const decodeBlockRuns = bytes => {
    const blocks = [];
    let cursor = 0;

    while (cursor < bytes.length) {
        const header = bytes[cursor++];
        const type = header >> 3;
        const count = (header & 0x07) + 1;
        const positions = [];

        for (let index = 0; index < count && cursor < bytes.length; index++) {
            const raw = bytes[cursor++];
            positions.push({
                x: raw & 0x07,
                y: (raw >> 3) & 0x07,
                z: (raw >> 6) & 0x03,
            });
        }

        blocks.push({
            type,
            positions,
        });
    }

    return blocks;
};

const decodeRoom = (tableBytes, cursor) => {
    const id = tableBytes[cursor];
    const entrySize = tableBytes[cursor + 1];
    const entryEnd = cursor + 1 + entrySize;
    const entryBytes = tableBytes.slice(cursor, entryEnd);
    const header = tableBytes[cursor + 2];
    const selector = header >> 3;
    const colour = header & 0x07;
    const backgrounds = [];
    let scan = cursor + 3;

    while (scan < entryEnd && tableBytes[scan] !== 0xff) {
        backgrounds.push(tableBytes[scan]);
        scan++;
    }

    const foundBackgroundTerminator = tableBytes[scan] === 0xff;
    const blockBytes = foundBackgroundTerminator ? tableBytes.slice(scan + 1, entryEnd) : [];
    const coord = {
        x: (id & 0x0f) - 0x08,
        y: (id >> 4) - 0x08,
    };
    const label = hexByte(id);
    const aliases = [];
    if (id === 0x88 || backgrounds.includes(0x12) || backgrounds.includes(0x13)) {
        aliases.push('cauldron');
    }

    return {
        room: {
            label,
            aliases,
            title: id === 0x88 ? 'Original Knight Lore cauldron room' : `Original Knight Lore room ${label}`,
            coord,
            originalRoomId: id,
            size: {selector},
            colour,
            exits: {
                north: backgrounds.includes(0x00) || backgrounds.includes(0x04) ? 'arch' : false,
                east: backgrounds.includes(0x01) || backgrounds.includes(0x05) ? 'arch' : false,
                south: backgrounds.includes(0x02) || backgrounds.includes(0x06) ? 'arch' : false,
                west: backgrounds.includes(0x03) || backgrounds.includes(0x07) ? 'arch' : false,
            },
            backgrounds,
            blocks: decodeBlockRuns(blockBytes),
            objects: [],
            items: [],
            meta: {
                originalRoomHex: label,
                locationEntryAddress: LOCATION_TABLE_START + cursor,
                locationEntrySize: entrySize,
                locationEntryBytes: entryBytes,
                foundBackgroundTerminator,
                backgroundNames: backgrounds.map(value => BACKGROUND_NAMES[value] || 'unknown'),
            },
        },
        nextCursor: entryEnd,
    };
};

const main = () => {
    const asmText = fs.readFileSync(asmPath, 'utf8');
    const tableBytes = extractLocationTableBytes(asmText);
    const expectedLength = LOCATION_TABLE_END - LOCATION_TABLE_START;
    if (tableBytes.length !== expectedLength) {
        throw new Error(`Location table length mismatch: got ${tableBytes.length}, expected ${expectedLength}.`);
    }

    const rooms = [];
    let cursor = 0;
    while (cursor < tableBytes.length) {
        const decoded = decodeRoom(tableBytes, cursor);
        rooms.push(decoded.room);
        cursor = decoded.nextCursor;
    }

    const document = {
        format: MAP_FORMAT,
        title: 'Knight Lore original room dump',
        generatedFrom: 'Docs/knightlore.asm location_tbl',
        coordinateConvention: 'north is y + 1; south is y - 1; room 0x88 is logical (0, 0)',
        origin: {label: '0x88', coord: {x: 0, y: 0}},
        notes: [
            'Room order is not semantically important; the original engine scans by room id.',
            'Labels preserve original room ids. Friendly aliases are optional and may be user-edited.',
            'This dump stores compact background ids and block runs so rooms can be copied into custom maps.',
        ],
        rooms,
    };

    fs.mkdirSync(path.dirname(outPath), {recursive: true});
    fs.writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`);
    console.log(`Wrote ${rooms.length} rooms to ${path.relative(rootDir, outPath)}.`);
};

main();
