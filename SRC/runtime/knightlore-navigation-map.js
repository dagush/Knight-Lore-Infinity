const DEFAULT_CELL_SIZE = 22;
const MIN_CELL_SIZE = 12;
const MAX_CELL_SIZE = 44;
const VIEW_PADDING = 2;

const coordKey = (x, y) => `${x},${y}`;
const sectorKey = sector => `${sector.sectorX},${sector.sectorY}`;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const roomExists = room => !(
    room && room.meta && room.meta.procedural && room.meta.procedural.exists === false
);

const getQuest = sector => sector && sector.quest && sector.quest.exists
    ? sector.quest
    : null;

const getGuardRoom = room => (
    room && room.meta && room.meta.procedural && room.meta.procedural.guardRoom
);

const drawDiamond = (context, x, y, radius) => {
    context.beginPath();
    context.moveTo(x, y - radius);
    context.lineTo(x + radius, y);
    context.lineTo(x, y + radius);
    context.lineTo(x - radius, y);
    context.closePath();
};

export function createKnightLoreNavigationMap(options) {
    const root = options && options.root;
    const logicalMap = options && options.logicalMap;
    if (!root || !logicalMap) return null;

    const canvas = root.querySelector('[data-navigation-canvas]');
    const canvasWrap = root.querySelector('[data-navigation-canvas-wrap]');
    const tooltip = root.querySelector('[data-navigation-tooltip]');
    const status = root.querySelector('[data-navigation-status]');
    const coordReadout = root.querySelector('[data-navigation-coord]');
    const followControl = root.querySelector('[data-navigation-follow]');
    const modeButtons = Array.from(root.querySelectorAll('[data-navigation-mode]'));
    const actionButtons = Array.from(root.querySelectorAll('[data-navigation-action]'));
    if (!canvas || !canvasWrap) return null;

    const context = canvas.getContext('2d');
    const state = {
        mode: 'visited',
        cellSize: DEFAULT_CELL_SIZE,
        current: {x: 0, y: 0},
        center: {x: 0, y: 0},
        follow: true,
        drag: null,
        hover: null,
        snapshot: null,
        frameRequest: 0,
        lastReason: 'initial',
        persistenceStable: true,
    };

    const getCanvasSize = () => ({
        width: Math.max(1, canvasWrap.clientWidth),
        height: Math.max(1, canvasWrap.clientHeight),
    });

    const resizeCanvas = () => {
        const {width, height} = getCanvasSize();
        const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const pixelWidth = Math.round(width * ratio);
        const pixelHeight = Math.round(height * ratio);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        return {width, height};
    };

    const worldToCanvas = (coord, size) => ({
        x: size.width / 2 + (coord.x - state.center.x) * state.cellSize,
        y: size.height / 2 - (coord.y - state.center.y) * state.cellSize,
    });

    const canvasToWorld = (x, y, size) => ({
        x: state.center.x + (x - size.width / 2) / state.cellSize,
        y: state.center.y - (y - size.height / 2) / state.cellSize,
    });

    const getViewportBounds = size => {
        const halfColumns = Math.ceil(size.width / state.cellSize / 2) + VIEW_PADDING;
        const halfRows = Math.ceil(size.height / state.cellSize / 2) + VIEW_PADDING;
        return {
            minX: Math.floor(state.center.x) - halfColumns,
            maxX: Math.ceil(state.center.x) + halfColumns,
            minY: Math.floor(state.center.y) - halfRows,
            maxY: Math.ceil(state.center.y) + halfRows,
        };
    };

    const createVisibleState = snapshot => {
        const visited = new Set(
            logicalMap.getVisitedRoomSnapshot().map(roomState => coordKey(roomState.coord.x, roomState.coord.y))
        );
        const completed = new Set(
            logicalMap.getCompletedQuestSectorSnapshot().map(item => item.key)
        );
        const completedAnchors = new Set();
        for (const sector of snapshot.sectors) {
            if (!completed.has(sector.key)) continue;
            const quest = getQuest(sector);
            if (!quest) continue;
            completedAnchors.add(coordKey(quest.cauldron.x, quest.cauldron.y));
            completedAnchors.add(coordKey(quest.charm.x, quest.charm.y));
        }
        return {visited, completed, completedAnchors};
    };

    const isRoomVisible = (room, visible) => {
        if (!roomExists(room)) return false;
        if (state.mode === 'generated') return true;
        const key = coordKey(room.coord.x, room.coord.y);
        return visible.visited.has(key) ||
            visible.completedAnchors.has(key) ||
            (room.coord.x === state.current.x && room.coord.y === state.current.y);
    };

    const drawSectorLayers = (snapshot, size, visible) => {
        for (const sector of snapshot.sectors) {
            const sectorSize = sector.sectorSize;
            const topLeft = worldToCanvas({
                x: sector.origin.x - 0.5,
                y: sector.origin.y + sectorSize - 0.5,
            }, size);
            const width = sectorSize * state.cellSize;
            const completed = visible.completed.has(sector.key);

            if (completed) {
                context.fillStyle = 'rgba(57, 164, 102, 0.12)';
                context.fillRect(topLeft.x, topLeft.y, width, width);
            }

            if (state.mode === 'generated' || completed) {
                context.strokeStyle = completed ? '#4fd08a' : 'rgba(199, 207, 214, 0.28)';
                context.lineWidth = completed ? 2 : 1;
                context.setLineDash(completed ? [] : [4, 4]);
                context.strokeRect(topLeft.x, topLeft.y, width, width);
            }
        }
        context.setLineDash([]);
    };

    const drawCorridors = (roomsByKey, visibleRooms, size) => {
        context.strokeStyle = '#77828b';
        context.lineWidth = Math.max(1.5, state.cellSize * 0.13);
        context.lineCap = 'square';

        for (const room of visibleRooms) {
            const start = worldToCanvas(room.coord, size);
            for (const direction of ['east', 'north']) {
                if (!room.exits[direction]) continue;
                const neighbourCoord = direction === 'east'
                    ? {x: room.coord.x + 1, y: room.coord.y}
                    : {x: room.coord.x, y: room.coord.y + 1};
                const neighbour = roomsByKey.get(coordKey(neighbourCoord.x, neighbourCoord.y));
                if (!neighbour || !visibleRooms.includes(neighbour)) continue;
                const opposite = direction === 'east' ? 'west' : 'south';
                if (!neighbour.exits[opposite]) continue;
                const end = worldToCanvas(neighbourCoord, size);
                context.beginPath();
                context.moveTo(start.x, start.y);
                context.lineTo(end.x, end.y);
                context.stroke();
            }
        }
    };

    const drawRoom = (room, size, visible) => {
        const point = worldToCanvas(room.coord, size);
        const key = coordKey(room.coord.x, room.coord.y);
        const half = clamp(state.cellSize * 0.27, 3.5, 10);
        const visited = visible.visited.has(key);
        const completedSector = room.questSector && visible.completed.has(room.questSector.key);
        const wooden = room.theme === 'wood' || /wood/i.test(room.theme || '') || /wood/i.test(room.label || '');
        const guardRoom = getGuardRoom(room);
        const revealGuardRoom = state.mode === 'generated' && guardRoom && guardRoom.selected;

        context.fillStyle = revealGuardRoom
            ? '#e68a3f'
            : completedSector
            ? '#2f9e66'
            : visited
                ? '#d5dde2'
                : wooden
                    ? '#9c7a45'
                    : '#68747d';
        context.strokeStyle = visited ? '#f4f7f8' : '#20262b';
        context.lineWidth = visited ? 1.5 : 1;
        context.beginPath();
        context.rect(point.x - half, point.y - half, half * 2, half * 2);
        context.fill();
        context.stroke();

        const revealAnchor = state.mode === 'generated' || completedSector;
        if (revealAnchor && room.questRole === 'cauldron') {
            context.fillStyle = completedSector ? '#79e3a7' : '#ef6262';
            context.strokeStyle = '#161a1e';
            context.lineWidth = 1;
            context.beginPath();
            context.arc(point.x, point.y, Math.max(2.5, half * 0.55), 0, Math.PI * 2);
            context.fill();
            context.stroke();
        } else if (revealAnchor && room.questRole === 'charm') {
            context.fillStyle = completedSector ? '#79e3a7' : '#52a8ff';
            context.strokeStyle = '#161a1e';
            context.lineWidth = 1;
            drawDiamond(context, point.x, point.y, Math.max(3, half * 0.7));
            context.fill();
            context.stroke();
        }

        if (room.coord.x === 0 && room.coord.y === 0) {
            context.strokeStyle = '#ffd166';
            context.lineWidth = 2;
            context.strokeRect(point.x - half - 2, point.y - half - 2, half * 2 + 4, half * 2 + 4);
        }

        if (room.coord.x === state.current.x && room.coord.y === state.current.y) {
            context.fillStyle = '#ffffff';
            context.strokeStyle = '#111417';
            context.lineWidth = 1.5;
            context.beginPath();
            context.arc(point.x, point.y, Math.max(2.5, half * 0.38), 0, Math.PI * 2);
            context.fill();
            context.stroke();
        }
    };

    const updateToolbar = (snapshot, visible, bounds) => {
        for (const button of modeButtons) {
            const active = button.dataset.navigationMode === state.mode;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        }
        if (followControl) followControl.checked = state.follow;
        if (coordReadout) coordReadout.textContent = `(${state.current.x}, ${state.current.y})`;

        const generatedVisible = snapshot.rooms.filter(roomExists).length;
        const visitedTotal = logicalMap.getVisitedRoomSnapshot().length;
        const completedTotal = logicalMap.getCompletedQuestSectorSnapshot().length;
        const stable = snapshot.persistenceBefore.rooms === snapshot.persistenceAfter.rooms &&
            snapshot.persistenceBefore.questSectors === snapshot.persistenceAfter.questSectors;
        state.persistenceStable = stable;
        if (status) {
            const columns = bounds.maxX - bounds.minX + 1;
            const rows = bounds.maxY - bounds.minY + 1;
            status.textContent = `${state.mode === 'visited' ? 'Visited' : 'Generated'} | ` +
                `${visitedTotal} visited | ${completedTotal} completed | ` +
                `${generatedVisible} rooms in ${columns} x ${rows} viewport | ` +
                `inspection state ${stable ? 'stable' : 'CHANGED'}`;
            status.dataset.stateStable = stable ? 'true' : 'false';
        }
        root.dataset.mode = state.mode;
        root.dataset.persistenceStable = stable ? 'true' : 'false';
        root.dataset.lastReason = state.lastReason;
        root.dataset.completedSectors = String(visible.completed.size);
    };

    const render = () => {
        state.frameRequest = 0;
        const size = resizeCanvas();
        const bounds = getViewportBounds(size);
        const snapshot = logicalMap.inspectNavigationViewport(bounds);
        const visible = createVisibleState(snapshot);
        const roomsByKey = new Map(snapshot.rooms.map(room => [coordKey(room.coord.x, room.coord.y), room]));
        const visibleRooms = snapshot.rooms.filter(room => isRoomVisible(room, visible));

        context.clearRect(0, 0, size.width, size.height);
        context.fillStyle = '#121619';
        context.fillRect(0, 0, size.width, size.height);
        drawSectorLayers(snapshot, size, visible);
        drawCorridors(roomsByKey, visibleRooms, size);
        for (const room of visibleRooms) drawRoom(room, size, visible);

        state.snapshot = {snapshot, visible, roomsByKey, visibleRooms, size, bounds};
        updateToolbar(snapshot, visible, bounds);
    };

    const refresh = (reason = 'external') => {
        state.lastReason = reason;
        if (!state.frameRequest) state.frameRequest = window.requestAnimationFrame(render);
    };

    const setCurrentCoord = coord => {
        const next = {
            x: Math.trunc(Number(coord && coord.x) || 0),
            y: Math.trunc(Number(coord && coord.y) || 0),
        };
        const changed = next.x !== state.current.x || next.y !== state.current.y;
        state.current = next;
        if (state.follow) state.center = {...next};
        refresh(changed ? 'logical-room-transition' : 'room-state-refresh');
    };

    const setZoom = (cellSize, anchor = null) => {
        const previous = state.cellSize;
        const next = clamp(cellSize, MIN_CELL_SIZE, MAX_CELL_SIZE);
        if (next === previous) return;
        if (anchor && state.snapshot) {
            const before = canvasToWorld(anchor.x, anchor.y, state.snapshot.size);
            state.cellSize = next;
            const after = canvasToWorld(anchor.x, anchor.y, state.snapshot.size);
            state.center.x += before.x - after.x;
            state.center.y += before.y - after.y;
        } else {
            state.cellSize = next;
        }
        state.follow = false;
        refresh('zoom');
    };

    const setMode = mode => {
        if (!['visited', 'generated'].includes(mode) || state.mode === mode) return;
        state.mode = mode;
        refresh('mode-change');
    };

    const centerOnPlayer = () => {
        state.center = {...state.current};
        state.follow = true;
        refresh('center-player');
    };

    const hideTooltip = () => {
        state.hover = null;
        if (tooltip) tooltip.hidden = true;
    };

    const showTooltipAt = (clientX, clientY) => {
        if (!tooltip || !state.snapshot || state.drag) return;
        const rect = canvas.getBoundingClientRect();
        const local = {x: clientX - rect.left, y: clientY - rect.top};
        const world = canvasToWorld(local.x, local.y, state.snapshot.size);
        const coord = {x: Math.round(world.x), y: Math.round(world.y)};
        const room = state.snapshot.roomsByKey.get(coordKey(coord.x, coord.y));
        const point = worldToCanvas(coord, state.snapshot.size);
        const near = Math.hypot(point.x - local.x, point.y - local.y) <= state.cellSize * 0.45;
        if (!near || !room || !state.snapshot.visibleRooms.includes(room)) {
            hideTooltip();
            return;
        }

        const quest = room.meta && room.meta.quest;
        const completed = !!(quest && quest.state && quest.state.completed);
        const guardRoom = getGuardRoom(room);
        const role = room.questRole && room.questRole !== 'none'
            ? room.questRole
            : guardRoom && guardRoom.selected
                ? `guard room near ${guardRoom.anchorRole}`
                : 'ordinary';
        const charm = room.questCharm && (room.questCharm.label || room.questCharm.name || room.questCharm.spriteHex);
        tooltip.textContent = `${room.label} | (${coord.x}, ${coord.y}) | ${role}` +
            `${charm ? ` | ${charm}` : ''}${completed ? ' | sector completed' : ''}`;
        tooltip.hidden = false;
        const maxLeft = Math.max(8, rect.width - tooltip.offsetWidth - 8);
        tooltip.style.left = `${clamp(local.x + 12, 8, maxLeft)}px`;
        tooltip.style.top = `${clamp(local.y + 12, 8, Math.max(8, rect.height - tooltip.offsetHeight - 8))}px`;
        state.hover = coord;
    };

    for (const button of modeButtons) {
        button.addEventListener('click', () => setMode(button.dataset.navigationMode));
    }
    for (const button of actionButtons) {
        button.addEventListener('click', () => {
            const action = button.dataset.navigationAction;
            if (action === 'zoom-in') setZoom(state.cellSize + 4);
            if (action === 'zoom-out') setZoom(state.cellSize - 4);
            if (action === 'center') centerOnPlayer();
        });
    }
    if (followControl) {
        followControl.addEventListener('change', () => {
            state.follow = followControl.checked;
            if (state.follow) state.center = {...state.current};
            refresh('follow-change');
        });
    }

    canvas.addEventListener('pointerdown', event => {
        canvas.setPointerCapture(event.pointerId);
        state.drag = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            center: {...state.center},
        };
        canvas.classList.add('is-dragging');
        hideTooltip();
    });
    canvas.addEventListener('pointermove', event => {
        if (!state.drag) {
            showTooltipAt(event.clientX, event.clientY);
            return;
        }
        state.center.x = state.drag.center.x - (event.clientX - state.drag.clientX) / state.cellSize;
        state.center.y = state.drag.center.y + (event.clientY - state.drag.clientY) / state.cellSize;
        state.follow = false;
        refresh('pan');
    });
    const endDrag = event => {
        if (!state.drag || state.drag.pointerId !== event.pointerId) return;
        state.drag = null;
        canvas.classList.remove('is-dragging');
        refresh('pan-end');
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', event => {
        if (!state.drag) hideTooltip();
        else if (event.buttons === 0) endDrag(event);
    });
    canvas.addEventListener('wheel', event => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        setZoom(state.cellSize + (event.deltaY < 0 ? 3 : -3), {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        });
    }, {passive: false});
    canvas.addEventListener('keydown', event => {
        const panStep = event.shiftKey ? 8 : 1;
        let handled = true;
        if (event.key === 'ArrowLeft') state.center.x -= panStep;
        else if (event.key === 'ArrowRight') state.center.x += panStep;
        else if (event.key === 'ArrowUp') state.center.y += panStep;
        else if (event.key === 'ArrowDown') state.center.y -= panStep;
        else if (event.key === '+' || event.key === '=') setZoom(state.cellSize + 4);
        else if (event.key === '-' || event.key === '_') setZoom(state.cellSize - 4);
        else if (event.key === 'Home') centerOnPlayer();
        else handled = false;
        if (!handled) return;
        if (event.key.startsWith('Arrow')) {
            state.follow = false;
            refresh('keyboard-pan');
        }
        event.preventDefault();
    });

    const resizeObserver = typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => refresh('resize'))
        : null;
    if (resizeObserver) resizeObserver.observe(canvasWrap);
    else window.addEventListener('resize', refresh);

    refresh('initial');

    return {
        refresh,
        setCurrentCoord,
        setMode,
        centerOnPlayer,
        getState: () => ({
            mode: state.mode,
            cellSize: state.cellSize,
            current: {...state.current},
            center: {...state.center},
            follow: state.follow,
            persistenceStable: state.persistenceStable,
            bounds: state.snapshot ? {...state.snapshot.bounds} : null,
        }),
        destroy: () => {
            if (state.frameRequest) window.cancelAnimationFrame(state.frameRequest);
            if (resizeObserver) resizeObserver.disconnect();
            else window.removeEventListener('resize', refresh);
        },
    };
}
