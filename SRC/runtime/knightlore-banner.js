// Exact A-Z glyph bytes from Knight Lore's original 8x8 font table.
const KNIGHT_LORE_FONT = {
    A: [0x0C, 0x1C, 0x2E, 0x66, 0x46, 0xCE, 0xDB, 0x66],
    B: [0xF8, 0x6C, 0x6C, 0x78, 0x6C, 0x66, 0x66, 0xFC],
    C: [0x0E, 0x32, 0x60, 0x40, 0xC0, 0xC2, 0xE6, 0x7C],
    D: [0x60, 0x70, 0x68, 0x6C, 0x66, 0x66, 0x66, 0xFC],
    E: [0xFE, 0x60, 0x64, 0x7C, 0x64, 0x60, 0x7A, 0xC6],
    F: [0xC6, 0x7A, 0x60, 0x64, 0x7C, 0x64, 0x60, 0x60],
    G: [0x0E, 0x30, 0x60, 0xC6, 0xCE, 0xF6, 0x66, 0x0E],
    H: [0xEE, 0xC6, 0xC6, 0xFE, 0xC6, 0xC6, 0xC6, 0xEE],
    I: [0x7C, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7C],
    J: [0x1E, 0x06, 0x06, 0x86, 0x86, 0xC6, 0x7E, 0x1C],
    K: [0xE4, 0x68, 0x70, 0x78, 0x6C, 0x64, 0x64, 0xF6],
    L: [0xE0, 0x60, 0x60, 0x60, 0x60, 0x60, 0x62, 0xFE],
    M: [0xC6, 0xEE, 0xEE, 0xD6, 0xD6, 0xD6, 0xC6, 0xEE],
    N: [0xCC, 0xD6, 0xD6, 0xE6, 0xE4, 0xC4, 0xC8, 0xDE],
    O: [0x38, 0x6C, 0xC6, 0xC6, 0xC6, 0xC6, 0x6C, 0x38],
    P: [0xF8, 0x6C, 0x66, 0x76, 0x6E, 0x60, 0x60, 0xF0],
    Q: [0x38, 0x6C, 0xC6, 0xC6, 0xC6, 0xD6, 0x6C, 0x3A],
    R: [0xF8, 0x6C, 0x66, 0x76, 0x7E, 0x78, 0x6C, 0xE6],
    S: [0x38, 0x64, 0x60, 0x3C, 0x06, 0x86, 0xC6, 0x7C],
    T: [0xFE, 0x9A, 0x98, 0x18, 0x18, 0x18, 0x18, 0x18],
    U: [0xF6, 0x26, 0x46, 0x4E, 0xCE, 0xD6, 0xD6, 0x66],
    V: [0xE2, 0x62, 0x64, 0x64, 0x68, 0x68, 0x70, 0x60],
    W: [0xEE, 0xC6, 0xD6, 0xD6, 0xD6, 0xEE, 0xEE, 0xC6],
    X: [0xC6, 0xC6, 0x6C, 0x38, 0x38, 0x6C, 0xC6, 0xC6],
    Y: [0x86, 0x66, 0x16, 0x0E, 0x06, 0x04, 0x4C, 0x38],
    Z: [0x7E, 0x46, 0x0C, 0x18, 0x30, 0x62, 0xC2, 0xFE],
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
};

const BANNER_WIDTH = 640;
const BANNER_HEIGHT = 72;

function measureText(text, scale, tracking) {
    return text.length * (8 * scale + tracking) - tracking;
}

function drawGlyph(context, glyph, x, y, scale, colour) {
    context.fillStyle = colour;
    glyph.forEach((row, rowIndex) => {
        for (let column = 0; column < 8; column++) {
            if (row & (0x80 >> column)) {
                context.fillRect(x + column * scale, y + rowIndex * scale, scale, scale);
            }
        }
    });
}

function drawText(context, text, y, scale, tracking, colour, shadowColour) {
    const width = measureText(text, scale, tracking);
    const x = Math.floor((BANNER_WIDTH - width) / 2);
    const shadowOffset = Math.max(1, Math.floor(scale / 2));

    for (const [index, character] of Array.from(text).entries()) {
        const glyph = KNIGHT_LORE_FONT[character] || KNIGHT_LORE_FONT[' '];
        const glyphX = x + index * (8 * scale + tracking);
        if (shadowColour) {
            drawGlyph(context, glyph, glyphX + shadowOffset, y + shadowOffset, scale, shadowColour);
        }
        drawGlyph(context, glyph, glyphX, y, scale, colour);
    }
}

function drawFrame(context) {
    context.fillStyle = '#000000';
    context.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);

    const stripes = [
        {offset: 0, colour: '#F4E925'},
        {offset: 2, colour: '#E94B35'},
        {offset: 4, colour: '#F4E925'},
    ];
    for (const stripe of stripes) {
        context.strokeStyle = stripe.colour;
        context.lineWidth = 1;
        context.strokeRect(
            stripe.offset + 0.5,
            stripe.offset + 0.5,
            BANNER_WIDTH - stripe.offset * 2 - 1,
            BANNER_HEIGHT - stripe.offset * 2 - 1
        );
    }

    context.fillStyle = '#55DCEB';
    context.fillRect(13, 9, 44, 2);
    context.fillRect(BANNER_WIDTH - 57, 9, 44, 2);
    context.fillStyle = '#E95BD3';
    context.fillRect(13, BANNER_HEIGHT - 11, 44, 2);
    context.fillRect(BANNER_WIDTH - 57, BANNER_HEIGHT - 11, 44, 2);
}

export function installKnightLoreBanner() {
    const pageShell = document.querySelector('.page-shell');
    if (!pageShell) return null;

    let canvas = document.getElementById('knight-lore-project-banner');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'knight-lore-project-banner';
        canvas.className = 'knight-lore-project-banner';
        canvas.width = BANNER_WIDTH;
        canvas.height = BANNER_HEIGHT;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Knight Lore Infinity');
        pageShell.prepend(canvas);
    }

    const context = canvas.getContext('2d');
    if (!context) return canvas;
    context.imageSmoothingEnabled = false;
    drawFrame(context);
    drawText(context, 'KNIGHT LORE', 10, 4, 3, '#FFFFFF', '#E95BD3');
    drawText(context, 'INFINITY', 48, 2, 2, '#F4E925', '#2776EA');
    return canvas;
}
