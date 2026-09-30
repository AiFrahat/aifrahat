# AiFRAHAT / Experimental Atelier

An open-source, bilingual portfolio for Ahmed Frahat. Live at [aifrahat.com](https://aifrahat.com).

## The experience

- A procedural Three.js rover with orbit controls, exploded layers, wireframe views, and keyboard rotation.
- Six research frontiers: Physical AI, Vibe Coding, Vibe Hardware, Vibe Fabrication, Prompt-to-Product, and Agentic Engineering.
- AI Arena: local Stockfish 19 Lite chess with legal moves, promotion, hints, undo, board flip, PGN export and live search metrics. The engine downloads only when a match starts.
- Neural Duel: a real 12-16-3 network learns four-move patterns during the session. Actual weights and past prediction accuracy are shown; choices are committed before each click.
- Path Race: race an A* planner through seeded maps, edit obstacles, reveal the route, and adjust opponent animation speed.
- The original lime, orange, pink and electric-blue identity, a lime/turquoise AF monogram, and a ruby-red rover with a clear-coated finish.
- A local product studio with rover, sensor enclosure, and lamp templates. Change width, material finish, and assembly separation.
- An English/Arabic keyword parser maps supported intent to template parameters. This is deterministic software, not AI inference.
- Export JSON specifications, a Markdown design brief, and an STL solid concept base in millimeters. The STL does not contain the full assembly and is not manufacturing certified.
- Arabic/English, RTL/LTR, light/dark appearance, reduced motion, keyboard controls, and a bitmap fallback when WebGL is unavailable.
- Existing iMHOTiP preview, illustrative RAG simulation, and scripted agent-trace demonstration.

## Run locally

Serve the directory over HTTP because ES modules cannot reliably run from a file URL:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765. No build or package installation is required. GitHub Pages serves the repository root; preserve the `CNAME` file.

## Test

Node 20.6 or later, no install step:

```sh
npm test
```

Tests cover bilingual parsing, parameter bounds, STL geometry, chess rules and UCI parsing, committed neural predictions and learning, and reproducible reachable A* maps. Mesh tests verify exact bounds and a closed two-manifold surface after welding triangle vertices.

## Source map

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic content, bilingual strings, import map |
| `atelier.css` | Identity, 3D studio, responsive layouts |
| `arena.css` | Original palette, responsive game surfaces |
| `games/` | Lazy-loaded chess, neural duel and path race |
| `styles.css` | Existing research lab and portfolio components |
| `design-state.mjs` | Pure parser, normalized state, export specifications |
| `product-model.js` | Procedural geometry and STL base |
| `product-scene.js` | Three.js renderer, lighting, controls, lifecycle |
| `studio.js` | Interface state, presets, downloads |
| `script.js` | Language, navigation, dictionary, illustrative lab |
| `vendor/` | Pinned dependencies, licenses, Stockfish source and network |
| `tests/` | Node tests and vendored-module resolver |

## Privacy and limits

All prompts, moves and design parameters stay in the browser. No telemetry, API keys, backend, or remote inference requests. Language, appearance, and the current template parameters use localStorage; written prompts and game sessions are not persisted. Third-party dependencies are vendored, so runtime does not depend on a CDN. The neural game performs real local inference and training; chess uses local WASM search. Neither is a general-purpose LLM or a claim to the world's strongest model.

The rover, sensor, and lamp are concept studies, not claims of built physical products. TraceLens is a concept study. RAG scores and the agent timeline are explicitly illustrative, not measured research findings or a live agent run.

Before fabrication, validate dimensions, material suitability, mounting holes, clearances, electrical and mechanical safety, and your machine's requirements. The exported base is a starting point, not a finished device.

## Identity and licenses

The current AF monogram was generated for this project in electric lime and turquoise. The previous crowned-A mark is retained as an archived asset. See [assets/BRAND.md](assets/BRAND.md) for prompts and provenance.

Project-authored source: [MIT](LICENSE). Vendored dependencies retain their original licenses, including GPL-3.0 for Stockfish. See [all licenses and matching engine build inputs](vendor/THIRD-PARTY.md).

The pre-arena release is preserved in a local, git-ignored `backups/` ZIP with a checksum and restoration instructions. Backups are not deployed.
