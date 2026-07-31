const DIRECTIONS = ['north', 'east', 'south', 'west'];

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

const manhattanDistance = (left, right) => (
    Math.abs(left.x - right.x) + Math.abs(left.y - right.y)
);

const positionBlocksEntryStrip = (position, direction) => {
    if (direction === 'north') {
        return position.x >= 3 && position.x <= 4 && position.y >= 5;
    }
    if (direction === 'south') {
        return position.x >= 3 && position.x <= 4 && position.y <= 2;
    }
    if (direction === 'east') {
        return position.y >= 3 && position.y <= 4 && position.x >= 5;
    }
    if (direction === 'west') {
        return position.y >= 3 && position.y <= 4 && position.x <= 2;
    }
    return false;
};

const isClearOfExits = (position, exits) => (
    !DIRECTIONS.some(direction => (
        exits && exits[direction] && positionBlocksEntryStrip(position, direction)
    ))
);

const createEightQueenSolutions = () => {
    const solutions = [];
    const columns = [];

    const placeQueen = row => {
        if (row === 8) {
            solutions.push(columns.slice());
            return;
        }

        for (let column = 0; column < 8; column++) {
            if (columns.includes(column)) continue;
            const diagonalConflict = columns.some((existingColumn, existingRow) => (
                Math.abs(existingColumn - column) === row - existingRow
            ));
            if (diagonalConflict) continue;
            columns[row] = column;
            placeQueen(row + 1);
            columns.length = row;
        }
    };

    placeQueen(0);
    return solutions;
};

const EIGHT_QUEEN_SOLUTIONS = createEightQueenSolutions();

export const GUARD_ROOM_BLOCK_TYPE = 0x0d;

export function planGuardRoomsForSector({
    worldSeed,
    sector,
    existingRooms,
    roomsPerSector = 2,
    excludedCoords = [],
} = {}) {
    const quest = sector && sector.quest;
    const targetCount = Math.max(0, Math.floor(Number(roomsPerSector) || 0));
    const assignments = new Map();
    const excluded = new Set(excludedCoords.map(coord => coordKey(coord.x, coord.y)));
    const anchors = quest && quest.exists
        ? [
            {role: 'cauldron', coord: quest.cauldron},
            {role: 'charm', coord: quest.charm},
        ]
        : [];
    const available = (existingRooms || []).filter(room => !excluded.has(coordKey(room.x, room.y)));

    for (let index = 0; index < targetCount && available.length && anchors.length; index++) {
        const anchor = anchors[index % anchors.length];
        const ranked = available
            .map(room => ({
                room,
                distance: manhattanDistance(room, anchor.coord),
                tie: hashInts(
                    worldSeed,
                    sector.sectorX,
                    sector.sectorY,
                    room.x,
                    room.y,
                    index,
                    anchor.role === 'cauldron' ? 0xca11 : 0xc4a2,
                    0x6a17
                ),
            }))
            .sort((left, right) => (
                left.distance - right.distance ||
                left.tie - right.tie ||
                left.room.y - right.room.y ||
                left.room.x - right.room.x
            ));
        const selected = ranked[0];
        const key = coordKey(selected.room.x, selected.room.y);
        assignments.set(key, {
            selected: true,
            anchorRole: anchor.role,
            anchor: {x: anchor.coord.x, y: anchor.coord.y},
            distance: selected.distance,
            assignmentIndex: index,
        });
        excluded.add(key);
        available.splice(available.findIndex(room => coordKey(room.x, room.y) === key), 1);
    }

    return {
        enabled: targetCount > 0,
        sector: sector ? {x: sector.sectorX, y: sector.sectorY} : null,
        targetCount,
        assignedCount: assignments.size,
        candidateCount: (existingRooms || []).length,
        policy: 'nearest ordinary generated room to each quest anchor with deterministic hash tie-breaking',
        assignments,
    };
}

export function createGuardRoomDressing({worldSeed, x, y, exits, theme, assignment} = {}) {
    if (!assignment || !assignment.selected) return null;

    const guardPosition = {x: 6, y: 1, z: 0};
    const queenPattern = EIGHT_QUEEN_SOLUTIONS
        .map((columns, solutionIndex) => {
            const positions = columns.map((column, row) => ({x: column, y: row, z: 0}));
            if (positions.some(position => (
                position.x === guardPosition.x && position.y === guardPosition.y
            ))) return null;
            const removedPositions = positions.filter(position => !isClearOfExits(position, exits));
            return {
                solutionIndex,
                positions,
                removedPositions,
                keptPositions: positions.filter(position => isClearOfExits(position, exits)),
                rank: hashInts(worldSeed, x, y, solutionIndex, 0x6a1d),
            };
        })
        .filter(Boolean)
        .sort((left, right) => (
            left.removedPositions.length - right.removedPositions.length ||
            left.rank - right.rank ||
            left.solutionIndex - right.solutionIndex
        ))[0];
    const selectedPositions = queenPattern ? queenPattern.keptPositions : [];
    const obstacleTypes = theme === 'tree' ? [0x05, 0x00] : [0x05, 0x03, 0x00];
    const grouped = new Map();

    selectedPositions.forEach((position, index) => {
        const type = index === 0
            ? 0x05
            : obstacleTypes[hashInts(worldSeed, x, y, index, 0x6a1a) % obstacleTypes.length];
        if (!grouped.has(type)) grouped.set(type, []);
        grouped.get(type).push(position);
    });

    const obstacleRuns = Array.from(grouped.entries()).map(([type, positions]) => ({
        type,
        positions,
    }));
    const obstacleTypeIds = Array.from(grouped.keys());

    return {
        forceSquare: true,
        guardType: GUARD_ROOM_BLOCK_TYPE,
        guardPosition,
        pattern: '8-queens',
        queenSolutionCount: EIGHT_QUEEN_SOLUTIONS.length,
        queenSolutionIndex: queenPattern ? queenPattern.solutionIndex : null,
        originalQueenPositions: queenPattern ? queenPattern.positions : [],
        removedQueenCount: queenPattern ? queenPattern.removedPositions.length : 0,
        removedQueenPositions: queenPattern ? queenPattern.removedPositions : [],
        obstacleCount: selectedPositions.length,
        obstacleTypeIds,
        entranceClearance: 'choose a minimum-conflict 8-queens solution, remove queens inside active three-cell doorway strips, and exclude the guard spawn square',
        blocks: [
            ...obstacleRuns,
            {type: GUARD_ROOM_BLOCK_TYPE, positions: [guardPosition]},
        ],
    };
}
