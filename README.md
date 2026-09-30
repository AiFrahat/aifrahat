# AiFRAHAT / Experimental Atelier

An open-source, bilingual portfolio for Ahmed Frahat. Live at [aifrahat.com](https://aifrahat.com).

## The experience

- A procedural Three.js rover with orbit controls, exploded layers, wireframe views, and keyboard rotation.
- Six research frontiers: Physical AI, Vibe Coding, Vibe Hardware, Vibe Fabrication, Prompt-to-Product, and Agentic Engineering.
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

Tests cover bilingual parsing, parameter bounds, unsupported requests, specification disclosures, and all three STL bases at minimum/default/maximum widths. Mesh tests verify exact bounds and a closed two-manifold surface after welding triangle vertices.

## Source map

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic content, bilingual strings, import map |
| `atelier.css` | Identity, 3D studio, responsive layouts |
| `styles.css` | Existing research lab and portfolio components |
| `design-state.mjs` | Pure parser, normalized state, export specifications |
| `product-model.js` | Procedural geometry and STL base |
| `product-scene.js` | Three.js renderer, lighting, controls, lifecycle |
| `studio.js` | Interface state, presets, downloads |
| `script.js` | Language, navigation, dictionary, illustrative lab |
| `vendor/` | Pinned Three.js 0.180.0 and Lucide 0.468.0 |
| `tests/` | Node tests and vendored-module resolver |

## Privacy and limits

All prompts and design parameters stay in the browser. No telemetry, API keys, backend, or inference requests. Language, appearance, and the current template parameters use localStorage; the written prompt is not persisted. Third-party dependencies are vendored, so runtime does not depend on a CDN.

The rover, sensor, and lamp are concept studies, not claims of built physical products. TraceLens is a concept study. RAG scores and the agent timeline are explicitly illustrative, not measured research findings or a live agent run.

Before fabrication, validate dimensions, material suitability, mounting holes, clearances, electrical and mechanical safety, and your machine's requirements. The exported base is a starting point, not a finished device.

## Identity and licenses

The crowned-A orbital mark was generated for this project from the owner's supplied reference. See [assets/BRAND.md](assets/BRAND.md) for the prompt and provenance.

Project source: [MIT](LICENSE). Vendored dependencies retain their original [Three.js](vendor/THREE-LICENSE) and [Lucide](vendor/LUCIDE-LICENSE) license notices.
