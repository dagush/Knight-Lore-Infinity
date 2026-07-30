export const KNIGHT_LORE_WIZARD_DIALOGUE = {
    start: 'greeting',
    replayStart: 'opening',
    nodes: {
        greeting: {
            speaker: 'wizard',
            text: 'HELLO, ADVENTURER!',
            next: 'opening',
        },
        opening: {
            speaker: 'wizard',
            text: [
                'THE CURSE HATH SPILLED',
                'BEYOND THIS KEEP.',
                'ACROSS THE ENDLESS HALLS,',
                'CAULDRONS WAKE AND CALL',
                'FOR CHARMS.',
            ].join('\n'),
            next: 'topics',
        },
        topics: {
            speaker: 'wizard',
            text: [
                'WHAT WOULDST THOU ASK?',
                '',
                '1  WHAT DO THEY SEEK?',
                '2  MUST CHARMS RETURN?',
                '3  HOW MANY OFFERINGS?',
            ].join('\n'),
            choices: {
                1: 'seek-reply',
                2: 'return-reply',
                3: 'offerings-reply',
            },
        },
        'seek-reply': {
            speaker: 'wizard',
            text: 'EACH BREW SHOWS THE SIGN\nIT HUNGERS FOR. SEEK THE\nCHARM THAT BEARS IT.',
            next: 'seek-player',
        },
        'seek-player': {
            speaker: 'player',
            text: 'AND IF THE ROAD LEADS\nBEYOND ITS HALLS?',
            next: 'seek-end',
        },
        'seek-end': {
            speaker: 'wizard',
            text: 'FOLLOW IT. A CROOKED ROAD\nMAY STILL RETURN THEE TRUE.',
            end: true,
        },
        'return-reply': {
            speaker: 'wizard',
            text: 'NAY. A CHARM KNOWS NO\nBIRTHPLACE. ANY CAULDRON\nCALLING ITS SIGN MAY CLAIM IT.',
            next: 'return-player',
        },
        'return-player': {
            speaker: 'player',
            text: 'THEN ONE TREASURE MAY\nANSWER A DISTANT CALL.',
            next: 'return-end',
        },
        'return-end': {
            speaker: 'wizard',
            text: 'AYE. CHOOSE WISELY, LEST\nTHE NEARER FIRE GO HUNGRY.',
            end: true,
        },
        'offerings-reply': {
            speaker: 'wizard',
            text: 'FOURTEEN OFFERINGS. EACH OF\nTHE SEVEN SIGNS SHALL BE\nCALLED TWICE.',
            next: 'offerings-player',
        },
        'offerings-player': {
            speaker: 'player',
            text: 'AND THEN THE MOON\nRELEASES ME?',
            next: 'offerings-end',
        },
        'offerings-end': {
            speaker: 'wizard',
            text: 'THEN THE LAST ENCHANTMENT\nBREAKS... IF THY COURAGE\nHAS NOT BROKEN FIRST.',
            end: true,
        },
    },
};
