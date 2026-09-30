# Third-party components

Project-authored code is MIT licensed. Dependencies retain the licenses below; the Stockfish engine is GPL-3.0, not MIT. No dependency is fetched from a CDN at runtime.

| Component | Version | License | Source |
| --- | --- | --- | --- |
| Three.js | 0.180.0 | [MIT](THREE-LICENSE) | [three.js](https://github.com/mrdoob/three.js/tree/r180) |
| Lucide | 0.468.0 | [ISC](LUCIDE-LICENSE) | [lucide](https://github.com/lucide-icons/lucide/tree/0.468.0) |
| chess.js | 1.4.0 | [BSD-2-Clause](CHESS-LICENSE) | [chess.js](https://github.com/jhlywa/chess.js/tree/v1.4.0) |
| Neataptic | 1.4.7 | [MIT](NEATAPTIC-LICENSE) | [neataptic](https://github.com/wagenaartje/neataptic) |
| EasyStar.js | 0.4.4 | [MIT](EASYSTAR-LICENSE) | [easystarjs](https://github.com/prettymuchbryce/easystarjs) |
| Stockfish.js Lite Single | 19.0.0 | [GPL-3.0](stockfish/COPYING.txt) | [Exact source archive](stockfish/corresponding-source.zip) |

## Stockfish build inputs

The unmodified worker and WASM files are from the `stockfish@19.0.0` npm distribution. The corresponding upstream source commit is `54fde71d90c7c403964f6cacef48f7bbec495df1`; its source, build scripts, authors, license, and build instructions are provided in the archive above.

The exact [Lite NNUE network](stockfish/nn-61e7af4bb97d.nnue) is provided separately beside the archive. SHA-256: `61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b`.

To rebuild, extract the source archive, place the supplied network in its `src/` directory, install the prerequisites documented upstream (including Emscripten 3.1.7, Node and make), and run `node build.js --lite --single-threaded --no-split`. This repository distributes the upstream binaries; it does not claim a locally reproduced byte-identical build.

The browser exchanges UCI messages with the engine in a dedicated worker. Lite is a smaller, weaker network than full Stockfish. Search time and depth are capped. No Elo strength is claimed.

## Learning and planning

Neataptic is an unmaintained library pinned here for a small local educational experiment, not a production ML service. Its actual network weights are visualized, and each opponent move is committed before the user's current move. Sessions are not uploaded or stored.

EasyStar computes cardinal shortest paths with A*. Opponent animation speed is a game setting and does not represent planning latency.
