const SLOT_START = 0x5c88;
const SLOT_END = 0x6108;
const SLOT_SIZE = 0x20;
const CENTER_ROOM = 0x88;
const BALL_SPRITES = [0xb6, 0xb7];
const BALL_WIDTH = 7;
const BALL_DEPTH = 7;
const BALL_HEIGHT = 0x0c;
const BALL_DZ = 4;
const GUARD_TOP_SPRITES = [0x1e, 0x1f];
const GUARD_BODY_SPRITES = [
    0x90, 0x91, 0x92, 0x93, 0x94, 0x95,
    0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d,
];
const DEATH_SPARKLE_START = 0x70;
const DEATH_SPARKLE_END = 0x77;
const INVALID_SPRITE = 0x01;

const FACING = [
    {index: 0, name: 'west', dx: -2, dy: 0, x: -1, y: 0},
    {index: 1, name: 'east', dx: 2, dy: 0, x: 1, y: 0},
    {index: 2, name: 'north', dx: 0, dy: 2, x: 0, y: 1},
    {index: 3, name: 'south', dx: 0, dy: -2, x: 0, y: -1},
];

const byte = value => ((Number(value) || 0) & 0xff);
const signedByte = value => (byte(value) & 0x80 ? byte(value) - 0x100 : byte(value));
const hexByte = value => `0x${byte(value).toString(16).toUpperCase().padStart(2, '0')}`;
const hexWord = value => `0x${(Number(value) & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
const fmtCoord = coord => coord ? `(${coord.x}, ${coord.y})` : '-';
const fmtBytes = values => Array.from(values || []).map(hexByte).join(' ');

const readByte = (range, addr) => {
    if (!range || !range.data || addr < range.start || addr >= range.end) return undefined;
    return range.data[addr - range.start];
};

const readRecord = (range, addr) => {
    const values = [];
    for (let offset = 0; offset < SLOT_SIZE; offset++) {
        values.push(readByte(range, addr + offset) || 0);
    }
    return values;
};

const isPlayerReady = sprite => (
    (sprite >= 0x10 && sprite <= 0x15) ||
    (sprite >= 0x18 && sprite <= 0x1d) ||
    (sprite >= 0x30 && sprite <= 0x35) ||
    (sprite >= 0x38 && sprite <= 0x3d)
);

const rangesOverlap = (aMin, aMax, bMin, bMax) => aMin < bMax && bMin < aMax;

const recordIntersectsBall = (record, candidate) => {
    if (!record || !record[0] || (record[7] & 0x02)) return false;

    return (
        Math.abs(record[1] - candidate.x) < record[4] + BALL_WIDTH + 2 &&
        Math.abs(record[2] - candidate.y) < record[5] + BALL_DEPTH + 2 &&
        rangesOverlap(
            record[3],
            record[3] + record[6] + 2,
            candidate.z,
            candidate.z + BALL_HEIGHT + 2
        )
    );
};

const findBallSlots = range => {
    const balls = [];
    const free = [];

    for (let addr = SLOT_START; addr < SLOT_END; addr += SLOT_SIZE) {
        const sprite = readByte(range, addr) || 0;
        if (BALL_SPRITES.includes(sprite)) balls.push(addr);
        if (sprite === 0) free.push(addr);
    }

    return {balls, free};
};

const decodeMotionRecord = (range, addr) => {
    const record = readRecord(range, addr);
    return {
        addr,
        record,
        sprite: record[0],
        x: record[1],
        y: record[2],
        z: record[3],
        width: record[4],
        depth: record[5],
        height: record[6],
        flags: record[7],
        room: record[8],
        dx: signedByte(record[9]),
        dy: signedByte(record[10]),
        dz: signedByte(record[11]),
        collisionFlags: record[12],
        objectFlags: record[13],
    };
};

export const findKnightLoreSquareGuardPairs = range => {
    const pairs = [];
    for (let topAddr = SLOT_START; topAddr + SLOT_SIZE < SLOT_END; topAddr += SLOT_SIZE) {
        const top = decodeMotionRecord(range, topAddr);
        if (!GUARD_TOP_SPRITES.includes(top.sprite)) continue;

        const bodyAddr = topAddr + SLOT_SIZE;
        const body = decodeMotionRecord(range, bodyAddr);
        if (!GUARD_BODY_SPRITES.includes(body.sprite)) continue;
        pairs.push({topAddr, bodyAddr, top, body});
    }
    return pairs;
};

export const buildKnightLoreGuardDeathPatch = guard => {
    if (!guard || !guard.top || !guard.body) return null;
    const bytes = [
        ...guard.top.record,
        ...guard.body.record.slice(0, 8),
    ];
    bytes[0] = DEATH_SPARKLE_START;
    bytes[7] = byte(bytes[7] | 0x32);
    bytes[SLOT_SIZE] = INVALID_SPRITE;
    bytes[SLOT_SIZE + 7] = byte(bytes[SLOT_SIZE + 7] | 0x32);
    return bytes;
};

export const decodeKnightLorePlayerFacing = (sprite, flags) => {
    const index = (sprite & 0x08 ? 1 : 0) | (flags & 0x40 ? 2 : 0);
    return {...FACING[index]};
};

export const buildKnightLoreBallRecord = ({x, y, z, dx, dy, dz = BALL_DZ} = {}) => {
    const record = new Array(SLOT_SIZE).fill(0);
    record[0] = 0xb6;
    record[1] = byte(x);
    record[2] = byte(y);
    record[3] = byte(z);
    record[4] = BALL_WIDTH;
    record[5] = BALL_DEPTH;
    record[6] = BALL_HEIGHT;
    record[7] = 0x10;
    record[8] = CENTER_ROOM;
    record[9] = byte(dx);
    record[10] = byte(dy);
    record[11] = byte(dz);
    return record;
};

export const findKnightLoreBallSpawn = ({workRange, facing, playerRecord, roomSizeX, roomSizeY} = {}) => {
    if (!workRange || !facing || !playerRecord || !playerRecord[0]) return null;

    const xMin = 128 - roomSizeX + BALL_WIDTH + 2;
    const xMax = 128 + roomSizeX - BALL_WIDTH - 2;
    const yMin = 128 - roomSizeY + BALL_DEPTH + 2;
    const yMax = 128 + roomSizeY - BALL_DEPTH - 2;
    const distances = [20, 24, 16, 28, 32];
    const activeRecords = [];

    for (let addr = 0x5c08; addr < SLOT_END; addr += SLOT_SIZE) {
        const record = readRecord(workRange, addr);
        if (record[0]) activeRecords.push({addr, record});
    }

    for (const distance of distances) {
        const candidate = {
            x: playerRecord[1] + facing.x * distance,
            y: playerRecord[2] + facing.y * distance,
            z: Math.min(0xff - BALL_HEIGHT, Math.max(0x80, playerRecord[3] + 8)),
            distance,
        };
        if (
            candidate.x < xMin || candidate.x > xMax ||
            candidate.y < yMin || candidate.y > yMax
        ) continue;
        if (activeRecords.some(item => recordIntersectsBall(item.record, candidate))) continue;
        return candidate;
    }

    return null;
};

const decodeLiveBall = (range, addr) => {
    if (!addr) return null;
    const decoded = decodeMotionRecord(range, addr);
    return BALL_SPRITES.includes(decoded.sprite) ? decoded : null;
};

const collisionAxes = flags => [
    flags & 0x01 ? 'X' : '',
    flags & 0x02 ? 'Y' : '',
    flags & 0x04 ? 'Z' : '',
].filter(Boolean).join('') || '-';

export const getKnightLorePairedCollisionEvidence = (ball, guard) => {
    const ballAxes = ball.collisionFlags & 0x03;
    const guardAxes = guard.collisionFlags & 0x03;
    const xGap = Math.abs(ball.x - guard.x);
    const yGap = Math.abs(ball.y - guard.y);
    const xLimit = ball.width + guard.width + Math.max(Math.abs(ball.dx), Math.abs(guard.dx)) + 1;
    const yLimit = ball.depth + guard.depth + Math.max(Math.abs(ball.dy), Math.abs(guard.dy)) + 1;
    const zOverlap = rangesOverlap(
        ball.z - Math.abs(ball.dz) - 1,
        ball.z + ball.height + Math.abs(ball.dz) + 1,
        guard.z - Math.abs(guard.dz) - 1,
        guard.z + guard.height + Math.abs(guard.dz) + 1
    );
    const spatialContact = xGap <= xLimit && yGap <= yLimit && zOverlap;
    const deadlyBall = !!(ball.objectFlags & 0x80);
    const pairedHit = !!(ballAxes && guardAxes && spatialContact);
    const inferredHit = !!(!pairedHit && deadlyBall && spatialContact);

    return {
        hit: pairedHit || inferredHit,
        pairedHit,
        inferredHit,
        spatialContact,
        deadlyBall,
        ballAxes,
        guardAxes,
        xGap,
        yGap,
        xLimit,
        yLimit,
        zOverlap,
    };
};

export function createKnightLoreBallProbe({
    emu,
    enabled = false,
    killEnabled = false,
    statusElement = null,
    bodyElement = null,
    build = 'unknown',
} = {}) {
    let fireRequested = false;
    let activeSlot = null;
    let currentContext = null;
    let shots = 0;
    let writes = 0;
    let rejected = 0;
    let lastBall = null;
    let lastSpawn = null;
    let lastFacing = null;
    let lastCoord = null;
    let lastGuards = [];
    let lastCollision = null;
    let collisionEdges = 0;
    let fastFrames = 0;
    let fastReads = 0;
    let fastReadsPending = 0;
    let maxFastReadsPending = 0;
    let lastFastRead = null;
    let lastFastError = null;
    let kills = 0;
    let killWrites = 0;
    let killRepairs = 0;
    let killVerifications = 0;
    let lastKill = null;
    let killError = null;
    let killInFlight = false;
    let guardContextKey = null;
    let lastAction = enabled
        ? 'waiting for a stable generated guard room'
        : 'disabled; add ?stage9ballprobe=1';
    let lastError = null;
    const trail = [];
    const collisionEvents = [];
    const guardContactStates = new Map();

    const makeCell = (text, className = '') => {
        const cell = document.createElement('td');
        cell.textContent = text;
        if (className) cell.className = className;
        return cell;
    };

    const addRow = (label, address, decode, context, bytes, notes, state = 'ok') => {
        if (!bodyElement) return;
        const row = document.createElement('tr');
        row.className = state === 'ok' ? '' : `state-${state}`;
        [label, address, decode, context, bytes, notes].forEach(value => {
            row.appendChild(makeCell(value));
        });
        bodyElement.appendChild(row);
    };

    const render = () => {
        if (statusElement) {
            statusElement.textContent = enabled
                ? `Press B in a generated guard room to queue one disposable live ball. Guard kill ${killEnabled ? 'armed' : 'off'}; shots ${shots}; collision events ${collisionEdges}; kills ${kills}; repairs ${killRepairs}; rejected ${rejected}; ball writes ${writes}; kill writes ${killWrites}. ${lastAction}. Diagnostics build: ${build}.`
                : `Probe disabled; add ?stage9ballprobe=1. Diagnostics build: ${build}.`;
        }
        if (!bodyElement) return;
        bodyElement.textContent = '';

        const context = currentContext;
        addRow(
            'control',
            'host key B',
            enabled
                ? `${fireRequested ? 'shot queued' : 'idle'}; ${context && context.canFire ? 'ready' : 'not ready'}`
                : 'disabled',
            `${fmtCoord(context && context.coord)}; ${context && context.guardRoom ? 'guard room' : 'ordinary room'}`,
            '-',
            lastError || lastAction,
            lastError ? 'bad' : context && context.canFire ? 'ok' : 'muted'
        );

        addRow(
            'allocation',
            activeSlot ? `${hexWord(activeSlot)}..${hexWord(activeSlot + SLOT_SIZE - 1)}` : `${hexWord(SLOT_START)}..${hexWord(SLOT_END - 1)}`,
            activeSlot
                ? `live slot ${Math.floor((activeSlot - 0x5c08) / SLOT_SIZE)}; shots ${shots}; writes ${writes}`
                : `${context ? context.freeSlotCount : 0} free room-object slot(s); no active probe ball`,
            lastSpawn
                ? `spawn ${fmtCoord({x: lastSpawn.x, y: lastSpawn.y})} Z=${hexByte(lastSpawn.z)}; source ${fmtCoord(lastCoord)}`
                : fmtCoord(context && context.coord),
            '-',
            'Only slots 4..39 are considered. Static location data and original updater code are untouched.',
            activeSlot ? 'ok' : 'muted'
        );

        addRow(
            'live ball',
            lastBall ? hexWord(lastBall.addr) : '-',
            lastBall
                ? `${hexByte(lastBall.sprite)}; XYZ ${hexByte(lastBall.x)}/${hexByte(lastBall.y)}/${hexByte(lastBall.z)}; dXYZ ${lastBall.dx}/${lastBall.dy}/${lastBall.dz}`
                : 'no 0xB6/0xB7 record observed',
            lastFacing
                ? `shot ${lastFacing.name}; initial dX=${lastFacing.dx}, dY=${lastFacing.dy}, dZ=${BALL_DZ}`
                : '-',
            lastBall ? fmtBytes(lastBall.record.slice(0, 14)) : '-',
            lastBall
                ? `+12 ${hexByte(lastBall.collisionFlags)} X/Y/Z collision bits ${(lastBall.collisionFlags & 1) ? 'X' : '-'}${(lastBall.collisionFlags & 2) ? 'Y' : '-'}${(lastBall.collisionFlags & 4) ? 'Z' : '-'}; +13 ${hexByte(lastBall.objectFlags)} deadly-out ${(lastBall.objectFlags & 0x80) ? 'yes' : 'no'}, dead ${(lastBall.objectFlags & 0x40) ? 'yes' : 'no'}, deadly-in ${(lastBall.objectFlags & 0x20) ? 'yes' : 'no'}`
                : 'The original updater should alternate 0xB6/0xB7 and set +13 deadly bits after the first update.',
            lastBall ? 'ok' : 'muted'
        );

        const guardPair = lastGuards.length === 1 ? lastGuards[0] : null;
        addRow(
            'square guard pair',
            guardPair
                ? `${hexWord(guardPair.topAddr)} / ${hexWord(guardPair.bodyAddr)}`
                : '-',
            guardPair
                ? `top ${hexByte(guardPair.top.sprite)} XYZ ${guardPair.top.x}/${guardPair.top.y}/${guardPair.top.z} dXYZ ${guardPair.top.dx}/${guardPair.top.dy}/${guardPair.top.dz}; +12 ${hexByte(guardPair.top.collisionFlags)} (${collisionAxes(guardPair.top.collisionFlags)}); +13 ${hexByte(guardPair.top.objectFlags)} dead ${(guardPair.top.objectFlags & 0x40) ? 'yes' : 'no'}`
                : `${lastGuards.length} square guard pair(s) observed`,
            fmtCoord(context && context.coord),
            guardPair
                ? `${fmtBytes(guardPair.top.record.slice(0, 14))} / ${fmtBytes(guardPair.body.record.slice(0, 14))}`
                : '-',
            'The 0x1E/0x1F top record participates in 3D collision. Its paired body uses 0x90..0x95 west-facing or 0x98..0x9D east-facing leg frames and has the ignore-in-3D flag.',
            guardPair ? 'ok' : 'muted'
        );

        addRow(
            'high-frequency collision sampler',
            activeSlot && lastGuards.length === 1
                ? `${hexWord(Math.min(activeSlot, lastGuards[0].topAddr))}..${hexWord(Math.max(activeSlot + SLOT_SIZE, lastGuards[0].bodyAddr + SLOT_SIZE) - 1)}`
                : '-',
            `completed frames ${fastFrames}; compact reads ${fastReads}; pending ${fastReadsPending}; peak pending ${maxFastReadsPending}; no frame-drop lock`,
            lastFastRead
                ? `${fmtCoord(lastFastRead.coord)}; frame ${lastFastRead.frame}; ${lastFastRead.length} byte(s)`
                : fmtCoord(context && context.coord),
            '-',
            lastFastError || 'Runs independently after every frameCompleted event so one-frame +12 collision flags are not lost behind the full diagnostics snapshot.',
            lastFastError ? 'bad' : fastReads ? 'ok' : 'muted'
        );

        addRow(
            'ball/guard collision event',
            lastCollision
                ? `${hexWord(lastCollision.ballAddr)} / ${hexWord(lastCollision.guardAddr)}`
                : '-',
            lastCollision
                ? `event ${collisionEdges} at frame ${lastCollision.frame}; ${lastCollision.kind}; ball +12 ${hexByte(lastCollision.ballCollisionFlags)} (${collisionAxes(lastCollision.ballCollisionFlags)}) +13 ${hexByte(lastCollision.ballObjectFlags)}; guard +12 ${hexByte(lastCollision.guardCollisionFlags)} (${collisionAxes(lastCollision.guardCollisionFlags)}) +13 ${hexByte(lastCollision.guardObjectFlags)}`
                : 'no paired or inferred ball/guard collision observed yet',
            lastCollision
                ? `${fmtCoord(lastCollision.coord)}; ball ${lastCollision.ballXYZ}; guard ${lastCollision.guardXYZ}`
                : fmtCoord(context && context.coord),
            lastCollision
                ? `gap X ${lastCollision.xGap}/${lastCollision.xLimit}; Y ${lastCollision.yGap}/${lastCollision.yLimit}; Z overlap ${lastCollision.zOverlap ? 'yes' : 'no'}`
                : '-',
            lastCollision
                ? lastCollision.inferred
                    ? `The paired one-frame +12 signal was missed, so contact was inferred from the ball's original deadly-out flag and swept 3D bounds. Guard-kill transition ${killEnabled ? 'enabled' : 'disabled'}.`
                    : `Both live records carried transient +12 X/Y collision flags in the same completed-frame sample while their bounds touched. Guard-kill transition ${killEnabled ? 'enabled' : 'disabled'}.`
                : 'Preferred contact proof is paired ball/guard X/Y bits in +12. If either transient flag is missed, an active deadly ball entering the guard swept 3D bounds is accepted as a conservative fallback.',
            lastCollision ? 'warn' : 'muted'
        );

        addRow(
            'guard death-sparkle transition',
            lastKill
                ? `${hexWord(lastKill.topAddr)}..${hexWord(lastKill.bodyAddr + 7)}`
                : '-',
            [
                `requested ${killEnabled ? 'yes' : 'no'}`,
                `kills ${kills}`,
                `writes ${killWrites}`,
                `same-shot repairs ${killRepairs}`,
                `verifications ${killVerifications}`,
                lastKill ? `state ${lastKill.state}` : 'no transition yet',
                lastKill && lastKill.verification ? `verification ${lastKill.verification}` : '',
                lastKill && lastKill.topSprite !== null ? `top ${hexByte(lastKill.topSprite)}` : '',
                lastKill && lastKill.bodySprite !== null ? `body ${hexByte(lastKill.bodySprite)}` : '',
            ].filter(Boolean).join('; '),
            lastKill
                ? `${fmtCoord(lastKill.coord)}; frame ${lastKill.frame}`
                : fmtCoord(context && context.coord),
            lastKill && lastKill.patchBytes.length
                ? fmtBytes(lastKill.patchBytes.slice(0, 14))
                : '-',
            killError || (
                killEnabled
                    ? 'On paired collision, the top becomes original death sparkles 0x70..0x77 and then invalid 0x01; the renderer clears 0x01 to 0x00. A same-shot latch reasserts the transition if that guard reappears while the same ball remains active; a later room visit is unaffected.'
                    : 'Opt in with ?stage9ballkill=1 after enabling ?stage9ballprobe=1. No guard record is changed while disabled.'
            ),
            killError ? 'bad' : lastKill ? 'warn' : 'muted'
        );

        addRow(
            'recent trail',
            activeSlot ? `${hexWord(activeSlot)} +1..+13` : '-',
            trail.length
                ? trail.map(item => `${item.frame}:${hexByte(item.sprite)}@${item.x},${item.y},${item.z} d${item.dx},${item.dy},${item.dz}`).join(' -> ')
                : 'no live movement samples yet',
            fmtCoord(context && context.coord),
            '-',
            'The trail records changed position, velocity, sprite, or collision/deadly flags from completed-frame snapshots.',
            trail.length ? 'ok' : 'muted'
        );
    };

    const onKeyDown = event => {
        if (!enabled || event.code !== 'KeyB' || event.repeat) return;
        const target = event.target;
        if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) return;
        if (event.altKey || event.ctrlKey || event.metaKey) return;

        event.preventDefault();
        event.stopPropagation();

        if (!currentContext || !currentContext.canFire) {
            rejected++;
            lastAction = currentContext ? currentContext.reason : 'no current memory snapshot';
            render();
            return;
        }

        fireRequested = true;
        lastAction = `queued ${currentContext.facing.name} shot from ${fmtCoord(currentContext.coord)}`;
        render();
    };

    window.addEventListener('keydown', onKeyDown, true);
    render();

    const recordBallSample = (observed, frame) => {
        if (!observed) return;
        const changed = !lastBall || [
            'sprite', 'x', 'y', 'z', 'dx', 'dy', 'dz', 'collisionFlags', 'objectFlags',
        ].some(key => observed[key] !== lastBall[key]);
        if (changed) {
            trail.push({frame, ...observed});
            if (trail.length > 12) trail.shift();
        }
        lastBall = observed;
    };

    const updateLastKillObservation = (topSprite, bodySprite, contextKey, source) => {
        if (!lastKill) return;
        lastKill.topSprite = topSprite === undefined ? null : topSprite;
        lastKill.bodySprite = bodySprite === undefined ? null : bodySprite;
        if (contextKey !== lastKill.contextKey) {
            lastKill.state = 'left killed room; a later visit may restore the guard';
        } else if (topSprite >= DEATH_SPARKLE_START && topSprite <= DEATH_SPARKLE_END) {
            lastKill.state = `original sparkle frame ${hexByte(topSprite)} observed by ${source}`;
        } else if (topSprite === 0 && bodySprite === 0) {
            lastKill.state = `sparkles complete; guard pair cleared by ${source}`;
        } else if (
            (topSprite === 0 || topSprite === INVALID_SPRITE) &&
            (bodySprite === 0 || bodySprite === INVALID_SPRITE)
        ) {
            lastKill.state = `terminal invalid sprites observed by ${source}`;
        } else if (GUARD_TOP_SPRITES.includes(topSprite) && GUARD_BODY_SPRITES.includes(bodySprite)) {
            lastKill.state = lastKill.shot === shots && lastKill.ballAddr === activeSlot
                ? `live guard reappeared during the same shot; correction pending (${source})`
                : `guard restored for a later room visit (${source})`;
        } else {
            lastKill.state = `unexpected sprites ${hexByte(topSprite || 0)}/${hexByte(bodySprite || 0)} observed by ${source}`;
        }
    };

    const verifyLastKillWrite = async contextKey => {
        if (!lastKill || typeof emu.readMemory !== 'function') return;
        const result = await emu.readMemory(lastKill.topAddr, SLOT_SIZE + 8);
        killVerifications++;
        const topSprite = result.data[0];
        const bodySprite = result.data[SLOT_SIZE];
        updateLastKillObservation(topSprite, bodySprite, contextKey, 'post-write verification');
        const deathActive = (
            (topSprite >= DEATH_SPARKLE_START && topSprite <= DEATH_SPARKLE_END) ||
            topSprite === INVALID_SPRITE || topSprite === 0
        ) && (bodySprite === INVALID_SPRITE || bodySprite === 0);
        lastKill.verification = deathActive
            ? `${hexByte(topSprite)}/${hexByte(bodySprite)} death state confirmed`
            : `${hexByte(topSprite)}/${hexByte(bodySprite)} live pair returned`;
    };

    const repairSameShotGuard = async ({guard, observed, frame, contextKey}) => {
        if (!lastKill || killInFlight || lastKill.repairs >= 4) return false;
        const patch = buildKnightLoreGuardDeathPatch(guard);
        killInFlight = true;
        try {
            await emu.writeMemory(guard.topAddr, Uint8Array.from(patch));
            killWrites++;
            killRepairs++;
            lastKill.repairs++;
            lastKill.patchBytes = patch.slice();
            lastKill.state = `same-shot restoration corrected at frame ${frame}`;
            lastKill.verification = 'repair written; verification pending';
            lastAction = `reasserted guard death sparkles after same-shot restoration ${lastKill.repairs}/4; ball ${hexWord(observed.addr)} remains active`;
            await verifyLastKillWrite(contextKey);
            killError = null;
            return true;
        } catch (error) {
            killError = String(error);
            lastAction = 'same-shot guard death repair failed';
            return false;
        } finally {
            killInFlight = false;
            render();
        }
    };

    const processCollisionSnapshot = async ({observed, guards, coord, frame, contextKey}) => {
        for (const guard of guards) {
            const evidence = observed
                ? getKnightLorePairedCollisionEvidence(observed, guard.top)
                : {hit: false};
            const previousContact = guardContactStates.get(guard.topAddr) || false;
            if (evidence.hit && !previousContact) {
                const collisionKind = evidence.pairedHit
                    ? `paired collision flags ball ${collisionAxes(evidence.ballAxes)} / guard ${collisionAxes(evidence.guardAxes)}`
                    : `inferred deadly-ball swept contact; flags ball ${collisionAxes(evidence.ballAxes)} / guard ${collisionAxes(evidence.guardAxes)}`;
                const event = {
                    frame,
                    coord: coord ? {x: coord.x, y: coord.y} : null,
                    ballAddr: observed.addr,
                    guardAddr: guard.topAddr,
                    kind: collisionKind,
                    inferred: evidence.inferredHit,
                    ballCollisionFlags: observed.collisionFlags,
                    ballObjectFlags: observed.objectFlags,
                    guardCollisionFlags: guard.top.collisionFlags,
                    guardObjectFlags: guard.top.objectFlags,
                    ballXYZ: `${observed.x}/${observed.y}/${observed.z}`,
                    guardXYZ: `${guard.top.x}/${guard.top.y}/${guard.top.z}`,
                    xGap: evidence.xGap,
                    yGap: evidence.yGap,
                    xLimit: evidence.xLimit,
                    yLimit: evidence.yLimit,
                    zOverlap: evidence.zOverlap,
                };
                collisionEdges++;
                lastCollision = event;
                collisionEvents.push(event);
                if (collisionEvents.length > 12) collisionEvents.shift();
                lastAction = `observed original ball/guard ${event.kind} at frame ${frame}`;
                if (killEnabled && !killInFlight) {
                    if (typeof emu.writeMemory !== 'function') {
                        killError = 'JSSpeccy writeMemory is unavailable for guard transition';
                    } else {
                        const patch = buildKnightLoreGuardDeathPatch(guard);
                        killInFlight = true;
                        try {
                            await emu.writeMemory(guard.topAddr, Uint8Array.from(patch));
                            kills++;
                            killWrites++;
                            killError = null;
                            lastKill = {
                                frame,
                                contextKey,
                                shot: shots,
                                ballAddr: observed.addr,
                                coord: coord ? {x: coord.x, y: coord.y} : null,
                                topAddr: guard.topAddr,
                                bodyAddr: guard.bodyAddr,
                                topSprite: DEATH_SPARKLE_START,
                                bodySprite: INVALID_SPRITE,
                                state: 'seeded original death sparkles',
                                verification: 'write acknowledged; verification pending',
                                repairs: 0,
                                patchBytes: patch.slice(),
                            };
                            await verifyLastKillWrite(contextKey);
                            lastAction = `converted guard ${hexWord(guard.topAddr)} to original death sparkles; ball ${hexWord(observed.addr)} left active`;
                        } catch (error) {
                            killError = String(error);
                            lastAction = 'guard death-sparkle write failed';
                        } finally {
                            killInFlight = false;
                        }
                    }
                }
                render();
            }
            guardContactStates.set(guard.topAddr, !!evidence.hit);
        }
    };

    const captureFrame = ({coord} = {}) => {
        fastFrames++;
        if (
            !enabled || typeof emu.readMemory !== 'function' || !activeSlot ||
            !currentContext || !currentContext.guardRoom
        ) return;

        const contextKey = coord ? `${coord.x},${coord.y}` : '-';
        const currentCoordKey = currentContext.coord
            ? `${currentContext.coord.x},${currentContext.coord.y}`
            : '-';
        if (contextKey !== guardContextKey || contextKey !== currentCoordKey) return;
        const sameShotKill = !!(
            lastKill && lastKill.contextKey === contextKey &&
            lastKill.shot === shots && lastKill.ballAddr === activeSlot
        );
        const cachedGuard = lastGuards.length === 1
            ? lastGuards[0]
            : sameShotKill
                ? {topAddr: lastKill.topAddr, bodyAddr: lastKill.bodyAddr}
                : null;
        if (!cachedGuard) return;
        const ballAddr = activeSlot;
        const start = Math.min(ballAddr, cachedGuard.topAddr);
        const end = Math.max(ballAddr + SLOT_SIZE, cachedGuard.bodyAddr + SLOT_SIZE);
        const frame = fastFrames;
        fastReadsPending++;
        maxFastReadsPending = Math.max(maxFastReadsPending, fastReadsPending);
        emu.readMemory(start, end - start).then(async result => {
            fastReads++;
            lastFastRead = {
                frame,
                coord: coord ? {x: coord.x, y: coord.y} : null,
                length: end - start,
            };
            lastFastError = null;
            if (contextKey !== guardContextKey || activeSlot !== ballAddr) return;

            const range = {start, end, data: result.data};
            const observed = decodeLiveBall(range, ballAddr);
            const top = decodeMotionRecord(range, cachedGuard.topAddr);
            const body = decodeMotionRecord(range, cachedGuard.bodyAddr);
            const guards = GUARD_TOP_SPRITES.includes(top.sprite) && GUARD_BODY_SPRITES.includes(body.sprite)
                ? [{topAddr: cachedGuard.topAddr, bodyAddr: cachedGuard.bodyAddr, top, body}]
                : [];
            recordBallSample(observed, frame);
            updateLastKillObservation(top.sprite, body.sprite, contextKey, 'compact sampler');
            if (!guards.length) {
                guardContactStates.set(cachedGuard.topAddr, false);
                return;
            }
            lastGuards = guards;
            if (
                sameShotKill && observed && frame > lastKill.frame &&
                lastKill.repairs < 4
            ) {
                await repairSameShotGuard({guard: guards[0], observed, frame, contextKey});
                guardContactStates.set(cachedGuard.topAddr, false);
                return;
            }
            await processCollisionSnapshot({observed, guards, coord, frame, contextKey});
        }).catch(error => {
            lastFastError = String(error);
            lastAction = 'high-frequency collision read failed';
            render();
        }).finally(() => {
            fastReadsPending--;
        });
    };

    const update = async ({workRange, coord, logicalRoom, physicalRoom, frame = 0} = {}) => {
        if (!workRange) return;

        const contextKey = coord ? `${coord.x},${coord.y}` : '-';
        if (contextKey !== guardContextKey) {
            guardContactStates.clear();
            lastGuards = [];
            guardContextKey = contextKey;
        }
        if (lastKill) {
            const topSprite = readByte(workRange, lastKill.topAddr);
            const bodySprite = readByte(workRange, lastKill.bodyAddr);
            updateLastKillObservation(topSprite, bodySprite, contextKey, 'full diagnostics snapshot');
        }
        const slots = findBallSlots(workRange);
        let observed = activeSlot ? decodeLiveBall(workRange, activeSlot) : null;
        if (!observed && slots.balls.length) {
            activeSlot = slots.balls[0];
            observed = decodeLiveBall(workRange, activeSlot);
            if (!lastBall) lastAction = `observed existing live ball at ${hexWord(activeSlot)}`;
        }
        if (activeSlot && !observed) {
            lastAction = `ball slot ${hexWord(activeSlot)} became inactive`;
            activeSlot = null;
            lastBall = null;
        }

        recordBallSample(observed, frame);

        const guards = findKnightLoreSquareGuardPairs(workRange);
        lastGuards = guards;

        const playerRecord = readRecord(workRange, 0x5c08);
        const facing = decodeKnightLorePlayerFacing(playerRecord[0], playerRecord[7]);
        const guardRoom = !!(
            logicalRoom && logicalRoom.meta && logicalRoom.meta.procedural &&
            logicalRoom.meta.procedural.guardRoom && logicalRoom.meta.procedural.guardRoom.selected
        );
        const roomStable = physicalRoom === CENTER_ROOM && (playerRecord[12] & 0xf0) === 0;
        const completionActive = (readByte(workRange, 0x5bc3) || 0) !== 0;
        const spawn = findKnightLoreBallSpawn({
            workRange,
            facing,
            playerRecord,
            roomSizeX: readByte(workRange, 0x5bab) || 64,
            roomSizeY: readByte(workRange, 0x5bac) || 64,
        });
        const freeSlot = slots.free[0] || null;
        const canFire = !!(
            enabled && guardRoom && roomStable && isPlayerReady(playerRecord[0]) &&
            !completionActive && !observed && !slots.balls.length && freeSlot && spawn
        );
        const reason = !enabled
            ? 'probe disabled'
            : !guardRoom
                ? 'enter one of the orange generated guard rooms'
                : !roomStable
                    ? 'wait for room entry/recentering to settle'
                    : !isPlayerReady(playerRecord[0])
                        ? `player sprite ${hexByte(playerRecord[0])} is not controllable`
                        : completionActive
                            ? 'original ending sequence owns runtime memory'
                            : observed || slots.balls.length
                                ? 'one bouncing ball is already active'
                                : !freeSlot
                                    ? 'no free 32-byte room-object slot'
                                    : !spawn
                                        ? 'no collision-free forward spawn position'
                                        : 'ready; press B';

        currentContext = {
            coord: coord ? {x: coord.x, y: coord.y} : null,
            logicalRoom,
            guardRoom,
            physicalRoom,
            facing,
            freeSlot,
            freeSlotCount: slots.free.length,
            spawn,
            canFire,
            reason,
        };

        if (fireRequested) {
            fireRequested = false;
            if (!canFire) {
                rejected++;
                lastAction = reason;
            } else if (typeof emu.writeMemory !== 'function') {
                rejected++;
                lastError = 'JSSpeccy writeMemory is unavailable';
                lastAction = lastError;
            } else {
                const record = buildKnightLoreBallRecord({
                    x: spawn.x,
                    y: spawn.y,
                    z: spawn.z,
                    dx: facing.dx,
                    dy: facing.dy,
                    dz: BALL_DZ,
                });
                try {
                    await emu.writeMemory(freeSlot, Uint8Array.from(record));
                    activeSlot = freeSlot;
                    shots++;
                    writes++;
                    lastSpawn = {...spawn};
                    lastFacing = {...facing};
                    lastCoord = coord ? {x: coord.x, y: coord.y} : null;
                    lastBall = {
                        ...decodeLiveBall({start: freeSlot, end: freeSlot + SLOT_SIZE, data: Uint8Array.from(record)}, freeSlot),
                    };
                    trail.length = 0;
                    trail.push({frame, ...lastBall});
                    lastError = null;
                    lastAction = `seeded disposable ball at ${hexWord(freeSlot)}; original updater owns the next frame`;
                } catch (error) {
                    rejected++;
                    lastError = String(error);
                    lastAction = 'ball record write failed';
                }
            }
        } else if (!observed && !activeSlot && lastAction === 'waiting for a stable generated guard room') {
            lastAction = reason;
        }

        render();
    };

    return {
        captureFrame,
        update,
        render,
        destroy() {
            window.removeEventListener('keydown', onKeyDown, true);
        },
        getState() {
            return {
                enabled,
                fireRequested,
                activeSlot,
                shots,
                writes,
                rejected,
                lastBall,
                lastSpawn,
                lastFacing,
                lastCoord,
                lastGuards,
                lastCollision,
                collisionEdges,
                collisionEvents: collisionEvents.slice(),
                fastFrames,
                fastReads,
                fastReadsPending,
                maxFastReadsPending,
                lastFastRead,
                lastFastError,
                killEnabled,
                kills,
                killWrites,
                killRepairs,
                killVerifications,
                lastKill,
                killError,
                lastAction,
                lastError,
                trail: trail.slice(),
                currentContext,
            };
        },
    };
}

export const KNIGHT_LORE_BALL_PROBE_CONSTANTS = {
    slotStart: SLOT_START,
    slotEnd: SLOT_END,
    slotSize: SLOT_SIZE,
    centerRoom: CENTER_ROOM,
    ballSprites: BALL_SPRITES.slice(),
    guardTopSprites: GUARD_TOP_SPRITES.slice(),
    guardBodySprites: GUARD_BODY_SPRITES.slice(),
    deathSparkleStart: DEATH_SPARKLE_START,
    deathSparkleEnd: DEATH_SPARKLE_END,
    invalidSprite: INVALID_SPRITE,
};
