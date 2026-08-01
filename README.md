# Knight Lore Infinity

## Live Demo

Open the [Knight Lore Infinity live demo](https://dagush.github.io/Knight-Lore-Infinity/).

The copyrighted game snapshot is not hosted by this project. Use the **Open
file** button in the emulator toolbar and select your own legally obtained
Knight Lore `.z80` snapshot. The browser reads the file locally; it is not
uploaded to this site or stored in the repository. Once selected, the runtime
installs and verifies the sliding room window before allowing the emulator to
start.

The hosted build enables the current integrated playtest, including bouncing
ball combat in generated guard rooms. Press `B` to fire there.

**Knight Lore Infinity** is a purely experimental, non-profit, just-for-fun
project built around the original 1984 ZX Spectrum game *Knight Lore* and the
JavaScript emulator JSSpeccy 3.

The experiment asks a slightly unreasonable question: how far can the original
game be extended from JavaScript, using runtime memory inspection and carefully
timed memory changes, without modifying the original game source code or
replacing its renderer?

The answer turned out to be: surprisingly far.

## What It Does

Knight Lore still runs inside JSSpeccy and still draws every room through its
original Spectrum display and Filmation engine. There is no replacement 3D
renderer. JavaScript maintains an external logical world and continually
compiles the current room and its four neighbours into a small physical
five-room cross centred on room `0x88`.

On top of that sliding window, the project adds:

- an effectively infinite, deterministic procedural map with reciprocal exits, stone and wooden regions, square and legal rectangular rooms;
- 8x8 quest sectors, each with a deterministic charm and cauldron pairing;
- original Knight Lore charm-room puzzles and selected original room interiors, adapted to the new procedural exits;
- persistent quest progress outside the emulator, while preserving the original charm-carrying, cauldron-drop, completion, and ending sequences;
- a navigable HTML map showing visited or generated rooms, sector boundaries, quest anchors, completed sectors, and guard rooms;
- a documented JSON room/map format for authored maps and reusable original room data;
- the original wizard walking at logical origin, plus an external branching dialogue system styled to blend with the Spectrum display;
- deterministic guard rooms built from 8-queens obstacle layouts;
- an experimental player-fired original bouncing ball that can rebound through a room and trigger the guard's original death-sparkle animation;
- extensive live diagnostics and runtime guards for room transitions, deaths, restarts, cauldrons, charms, carried objects, and the original game ending.

The project grew by observation and controlled experiments. The development history, including failed hypotheses and engine hazards, is preserved in the 
[Docs/logbook.txt](Docs/logbook.txt).

## Experimental Scope

This is a research toy, not a polished remake, commercial product, or supported game release. It deliberately explores fragile runtime assumptions in a game written for a 1984 machine. Timing-sensitive patches, unusual room combinations, browser differences, or long play sessions may reveal unintended glitches that we have not encountered.

Some failures were repaired during development, including invalid room decodes, incorrect death recentering, stale object records, and interference with the original ending. Others may remain. Finding and polishing every possible edge case is beyond the scope of this project.

Use it with curiosity, patience, and the expectation that the occasional piece of 1984 logic may object to its newly infinite surroundings.

## Running Locally

The repository does **not** include the copyrighted *Knight Lore* game snapshot. Supply your own legally obtained Z80 snapshot named:

```text
Knight Lore (1984)(Ultimate).z80
```

The emulator source lives under `SRC/` and currently targets Node.js 16. A fresh local build can be prepared with:

```bash
cd SRC
npm install
npm run build:core
npm run build:wasm:release
npm run build:js

mkdir -p dist/jsspeccy
cp static/index.html static/favicon.ico dist/
cp -R static/roms static/tapeloaders dist/jsspeccy/
cp -R static/maps dist/
cp "/path/to/Knight Lore (1984)(Ultimate).z80" dist/

cd dist
python3 -m http.server 8000
```

Then open the current integrated build:

```text
http://127.0.0.1:8000/index.html?playtest=latest
```

The bouncing-ball combat proof remains opt-in:

```text
http://127.0.0.1:8000/index.html?playtest=latest&stage9ballprobe=1&stage9ballkill=1
```

In a generated guard room, press `B` to launch one ball. The numbered keys are used for wizard dialogue at logical origin `(0,0)`.

## GitHub Pages Deployment

The workflow at `.github/workflows/deploy-pages.yml` builds a release version
from `SRC/` and deploys `SRC/dist/` whenever `master` is pushed. Before upload,
the workflow fails if it finds any `.z80` file in the public artifact.

To enable the first deployment:

1. Open the repository on GitHub and select **Settings**.
2. Select **Pages** under **Code and automation**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push the workflow to `master`, or run **Deploy GitHub Pages** manually from
   the repository's **Actions** tab.
5. When both workflow jobs are green, open
   `https://dagush.github.io/Knight-Lore-Infinity/`.

Local development continues to load
`Knight Lore (1984)(Ultimate).z80` automatically from the local server root.
Use `?snapshot=manual` to test the hosted file-selection path locally, or
`?snapshot=auto` to force automatic loading on another host.

## Project Notes

The `Docs/` directory contains the project's frozen research record:

- [logbook.txt](Docs/logbook.txt) - chronological experiments and results;
- [info.txt](Docs/info.txt) - decoded Knight Lore runtime facts;
- [static.txt](Docs/static.txt) and [dynamic.txt](Docs/dynamic.txt) - static and working-memory references;
- [map-generation-algorithm.txt](Docs/map-generation-algorithm.txt) - procedural topology and room-generation rules;
- [logical-map-json-format.txt](Docs/logical-map-json-format.txt) - authored map format.

## Related Project

For a different playful take on the same classic, see
[dagush/Knight-Lore-2026](https://github.com/dagush/Knight-Lore-2026).

## Credits And Rights

*Knight Lore* was originally created by Ultimate Play the Game. This repository is an unofficial fan experiment and is not affiliated with or endorsed by the game's creators or rights holders. Original game names, artwork, code, and other content belong to their respective owners.

The emulator is based on [JSSpeccy 3](https://github.com/gasman/jsspeccy3) by Matt Westcott. Its original README is retained as [SRC/README_Original.md](SRC/README_Original.md), and its GPLv3 licence is in [SRC/COPYING](SRC/COPYING).

Project direction, experiments, gameplay decisions, integration, and hands-on
testing by Gustavo Patow. The project was developed with extensive AI
assistance from OpenAI Codex, used as a collaborative partner for code,
reverse-engineering analysis, debugging, testing, and documentation.

No warranty is provided.
