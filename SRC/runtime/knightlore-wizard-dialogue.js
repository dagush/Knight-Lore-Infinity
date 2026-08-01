const DIGIT_KEY = /^[0-9]$/;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createKnightLoreWizardDialogue({
    root,
    canvas,
    enabled = true,
    dialogue,
} = {}) {
    const nodes = dialogue && dialogue.nodes ? dialogue.nodes : {};
    const startNodeId = dialogue && dialogue.start;
    const replayStartNodeId = dialogue && nodes[dialogue.replayStart]
        ? dialogue.replayStart
        : startNodeId;
    const dialogueName = dialogue && dialogue.name ? dialogue.name : 'Wizard';
    const replayable = !dialogue || dialogue.replayable !== false;
    const dismissKeys = dialogue && Array.isArray(dialogue.dismissKeys)
        ? dialogue.dismissKeys
        : [];
    const validTree = !!(startNodeId && nodes[startNodeId]);
    const state = {
        enabled: !!enabled && validTree,
        dialogueName,
        replayable,
        available: false,
        playerReady: false,
        playerTransforming: false,
        playerBodySprite: 0,
        visible: false,
        frozen: false,
        smoothingFactor: 0.5,
        positionUpdates: 0,
        autoStarted: false,
        completed: false,
        replays: 0,
        opens: 0,
        closes: 0,
        lastKey: null,
        lastAction: !enabled
            ? 'disabled'
            : validTree
                ? `waiting for ${dialogueName.toLowerCase()} dialogue availability`
                : 'disabled; dialogue tree is missing its start node',
        nodeId: null,
        speaker: null,
        branch: null,
        anchor: null,
    };

    if (!root || !canvas) {
        state.enabled = false;
        state.lastAction = 'disabled; emulator overlay root or canvas not found';
        return {
            update() {},
            show() { return false; },
            hide() {},
            destroy() {},
            getState: () => ({...state}),
        };
    }

    const bubble = document.createElement('div');
    bubble.className = 'knight-lore-wizard-dialogue';
    bubble.setAttribute('role', 'dialog');
    bubble.setAttribute('aria-label', `${dialogueName} dialogue`);
    bubble.setAttribute('aria-live', 'polite');
    bubble.hidden = true;
    root.appendChild(bubble);

    let anchors = {wizard: null, guard: null, player: null};
    let motionAnchor = null;

    const getCurrentNode = () => state.nodeId ? nodes[state.nodeId] : null;

    const getActiveAnchor = () => {
        const node = getCurrentNode();
        return (node && anchors[node.speaker]) || anchors.wizard || anchors.guard || anchors.player;
    };

    const positionBubble = (anchor, {resetSmoothing = false} = {}) => {
        if (!anchor || !Number.isFinite(anchor.pixelX) || !Number.isFinite(anchor.pixelY)) {
            return false;
        }

        const scaleX = canvas.clientWidth / canvas.width;
        const scaleY = canvas.clientHeight / canvas.height;
        if (!scaleX || !scaleY) return false;

        const scale = Math.min(scaleX, scaleY);
        const spriteWidth = Math.max(8, (anchor.spriteWidthBytes || 2) * 8);
        const spriteHeight = Math.max(1, anchor.spriteHeight || 16);
        const rawHeadX = 32 + anchor.pixelX + spriteWidth / 2;
        const rawHeadY = 24 + (192 - anchor.pixelY - spriteHeight);
        const canSmooth = !resetSmoothing && motionAnchor &&
            motionAnchor.speaker === state.speaker;
        const headX = canSmooth
            ? motionAnchor.screenX +
                (rawHeadX - motionAnchor.screenX) * state.smoothingFactor
            : rawHeadX;
        const headY = canSmooth
            ? motionAnchor.screenY +
                (rawHeadY - motionAnchor.screenY) * state.smoothingFactor
            : rawHeadY;
        motionAnchor = {speaker: state.speaker, screenX: headX, screenY: headY};
        const bubbleWidth = 144;
        const bubbleHeight = Math.max(34, bubble.offsetHeight || 34);
        const bubbleX = clamp(headX - bubbleWidth / 2, 5, 320 - bubbleWidth - 5);
        const choosePlacement = resetSmoothing || !state.anchor ||
            state.anchor.speaker !== state.speaker;
        const fitsAbove = headY - bubbleHeight - 10 >= 4;
        const fitsBelow = headY + spriteHeight + bubbleHeight + 10 <= 236;
        const placeBelow = choosePlacement
            ? !fitsAbove && (fitsBelow || headY < 120)
            : state.anchor.placement === 'below';
        const desiredY = placeBelow
            ? headY + spriteHeight + 10
            : headY - bubbleHeight - 10;
        const bubbleY = clamp(desiredY, 4, 240 - bubbleHeight - 12);
        const tailX = clamp(headX - bubbleX, 12, bubbleWidth - 12);

        bubble.style.setProperty('--kl-dialog-scale', String(scale));
        bubble.style.setProperty('--kl-dialog-tail-x', `${tailX}px`);
        bubble.dataset.placement = placeBelow ? 'below' : 'above';
        bubble.style.left = `${canvas.offsetLeft + bubbleX * scaleX}px`;
        bubble.style.top = `${canvas.offsetTop + bubbleY * scaleY}px`;
        state.anchor = {
            pixelX: anchor.pixelX,
            pixelY: anchor.pixelY,
            spriteWidthBytes: anchor.spriteWidthBytes || 0,
            spriteHeight: anchor.spriteHeight || 0,
            speaker: state.speaker,
            rawScreenX: rawHeadX,
            rawScreenY: rawHeadY,
            screenX: headX,
            screenY: headY,
            placement: placeBelow ? 'below' : 'above',
        };
        state.positionUpdates++;
        return true;
    };

    const renderNode = () => {
        const node = getCurrentNode();
        if (!node) return false;
        state.speaker = node.speaker || 'wizard';
        bubble.dataset.speaker = state.speaker;
        const speakerName = state.speaker === 'player'
            ? 'Player'
            : state.speaker === 'guard'
                ? 'Guard'
                : dialogueName;
        bubble.setAttribute('aria-label', `${speakerName} dialogue`);
        bubble.textContent = node.text || '';
        return true;
    };

    const hide = reason => {
        if (!state.visible) {
            if (reason) state.lastAction = reason;
            return;
        }
        state.visible = false;
        state.closes++;
        state.lastAction = reason || 'dialogue closed';
        bubble.hidden = true;
    };

    const show = ({automatic = false, replay = false} = {}) => {
        if (replay && !replayable) return false;
        if (
            !state.enabled ||
            !state.available ||
            !state.playerReady ||
            state.frozen ||
            !getActiveAnchor()
        ) return false;
        state.nodeId = replay ? replayStartNodeId : startNodeId;
        state.speaker = nodes[state.nodeId].speaker || 'wizard';
        state.branch = null;
        state.completed = false;
        if (automatic) state.autoStarted = true;
        if (replay) state.replays++;
        renderNode();
        state.visible = true;
        state.opens++;
        bubble.hidden = false;
        positionBubble(getActiveAnchor(), {resetSmoothing: true});
        state.lastAction = automatic
            ? `${dialogueName.toLowerCase()} opened the introductory dialogue`
            : `replaying the ${dialogueName.toLowerCase()} dialogue`;
        return true;
    };

    const advance = key => {
        if (state.frozen) return;
        const node = getCurrentNode();
        if (!node) return;

        if (node.choices) {
            const nextNodeId = node.choices[key];
            if (!nextNodeId || !nodes[nextNodeId]) {
                state.lastAction = `waiting for choice 1, 2, or 3; received ${key}`;
                return;
            }
            state.branch = key;
            state.nodeId = nextNodeId;
        } else if (node.next && nodes[node.next]) {
            state.nodeId = node.next;
        } else if (node.end) {
            state.completed = true;
            hide(`conversation branch ${state.branch || '-'} completed`);
            return;
        }

        renderNode();
        positionBubble(getActiveAnchor(), {resetSmoothing: true});
        state.lastAction = `showing ${state.speaker} line ${state.nodeId}`;
    };

    const keydownHandler = event => {
        if (!state.enabled || event.repeat) return;
        if (state.visible && dismissKeys.includes(event.key)) {
            state.lastKey = event.key;
            state.completed = true;
            hide(`closed ${dialogueName.toLowerCase()} dialogue with key ${event.key}`);
            return;
        }
        if (event.key === 'Escape' && state.visible) {
            state.lastKey = 'Escape';
            hide('closed dialogue with Escape');
            return;
        }
        if (!DIGIT_KEY.test(event.key) || !state.available) return;

        state.lastKey = event.key;
        if (state.frozen) {
            state.lastAction = `transformation freeze; ignored dialogue key ${event.key}`;
            return;
        }
        if (!state.playerReady) {
            state.lastAction = `waiting for a controllable player; ignored dialogue key ${event.key}`;
            return;
        }
        if (state.visible) {
            if (event.key === '0') {
                hide('closed dialogue with key 0');
            } else {
                advance(event.key);
            }
        } else if (replayable) {
            show({replay: true});
        }
    };

    root.addEventListener('keydown', keydownHandler);

    return {
        update({
            available = false,
            playerReady = false,
            playerTransforming = false,
            playerBodySprite = 0,
            wizardAnchor = null,
            guardAnchor = null,
            playerAnchor = null,
        } = {}) {
            state.playerReady = !!playerReady;
            state.playerTransforming = !!playerTransforming;
            state.playerBodySprite = playerBodySprite & 0xff;
            state.available = state.enabled && !!available;
            if (!state.available) {
                anchors = {wizard: null, guard: null, player: null};
                motionAnchor = null;
                state.anchor = null;
                state.frozen = false;
                hide(state.enabled
                    ? `waiting for ${dialogueName.toLowerCase()} dialogue availability`
                    : 'disabled');
                return;
            }

            anchors = {wizard: wizardAnchor, guard: guardAnchor, player: playerAnchor};
            if (state.visible && state.playerTransforming) {
                state.frozen = true;
                state.lastAction = `transformation freeze; preserving ${state.speaker} line ${state.nodeId}`;
                return;
            }

            if (!state.playerReady) {
                state.frozen = false;
                hide(state.autoStarted
                    ? 'dialogue closed; player is no longer controllable'
                    : 'waiting for the player to become controllable');
                return;
            }

            const resumedFromTransformation = state.frozen;
            state.frozen = false;
            if (!state.autoStarted) {
                show({automatic: true});
            } else if (state.visible) {
                positionBubble(getActiveAnchor());
                state.lastAction = resumedFromTransformation
                    ? `resumed smoothed tracking for ${state.speaker} line ${state.nodeId}`
                    : `smoothed tracking for ${state.speaker} line ${state.nodeId}`;
            } else {
                state.lastAction = replayable
                    ? state.completed
                        ? 'conversation completed; number keys replay it'
                        : 'conversation closed; number keys replay it'
                    : state.completed
                        ? 'one-time dialogue completed'
                        : 'one-time dialogue closed';
            }
        },
        show,
        hide,
        destroy() {
            root.removeEventListener('keydown', keydownHandler);
            bubble.remove();
        },
        getState() {
            return {
                ...state,
                anchor: state.anchor ? {...state.anchor} : null,
            };
        },
    };
}
