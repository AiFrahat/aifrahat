# City artwork provenance

2026-10-25 roof/motion pass: radio masts, crossbars, aerial arrays, warning lights
and four turning dishes are original procedural reconstructions placed on the
ten recorded block roofs. They are not extracted named antenna assets; the
archive model exposes no separately named antenna/radar node. The archived
material setup flags parts containing "rotate" for a Y-axis shader rotation.
Elevated owner-logo panels now turn around that axis rather than merely tilting.
No source logo pixels were imported for this change.

Architectural coverage completion, 2026-10-25: four original structural atlas
bindings are retained. Six other structural primitive bindings now use original
UV-aligned metal/service-panel artwork with seams, fasteners, vents, conduits,
status lights and AF text. Their bump and emissive maps are authored procedurally;
they are not recovered source normal maps. Decorative/ad surfaces continue to
use owner campaign artwork. Runtime detailing uses 512px maps on coarse pointers
and 1024px otherwise. No source logo or portfolio atlas was added by this step.

2026-10-25 architecture audit: the supplied source GLB contains 12 texture atlases
and zero glTF animations. The former export stripped all 12. Four structural
window/panel atlases (source materials Material_0, Material_0.001, Material_0.002,
Mat.1) were visually inspected and retained in the current derived GLB. Source
advertising/portfolio/logo atlases remain excluded. These four maps are reference-
derived, not original Ai FRAHAT artwork, and their redistribution rights remain
unverified, like the derived geometry. Older all-textures-stripped notes below
describe the preceding export and are superseded by this audit.

2026-10-25 visual integration: reconstruction/neon-identity.ts adds six original
AF kinetic signs with counter-rotating luminous rings and animated light bars.
Kinetic facade canvases now sample the same original campaign atlas. District
project screens share Works posters and play the nearest concept film silently
(one active city video at a time), respecting visibility and reduced motion.
Concept films for ATHR, MERATH, ASL and WASL now use animated camera crops of the
same atlas quadrants with project-specific procedural story diagrams and captions.
This is an authored visual adaptation, not a verified pixel-identical replica.

`reconstruction/district.ts` adds original primitive architecture, project
terminals, orbital AF marks, cables and scenic lanterns. Its campaign panels
reuse the original generated concept atlas below for ATHR, MERATH, ASL and
WASL, with canonical text composed in code. Other signs use authored diagrams.
These additions are separate from the stripped reference geometry study.

neon-research-atlas-v1.png was generated for this project using the built-in
image generation tool on 2026-10-24. Prompt requested four original cyberpunk
concept advertisements for ATHR, MERATH, ASL and WASL. No Samsy image, texture,
model or screenshot was supplied to generation. Source output was copied intact
into this project; quadrants are sampled through Three.js UV transforms.

These are concept artworks, not screenshots or claims of completed products.
Decorative generated microtype can contain imperfect or fictional words/data;
canonical project names and descriptions are maintained in the semantic UI.
The atlas is used only for city advertising, not the supplied owner project videos.
Procedural canvas signs remain the fallback when the image cannot load.

## Archive city geometry study

The campaign atlases in `reconstruction/sign-surfaces.ts` and kinetic signs in
`reconstruction/placed-city.ts` are newly authored canvas typography and geometric
diagrams for Ai FRAHAT. UV connectivity provides surface layout only; source
campaign pixels are not sampled. Added window bays, vents, ledges, roof services
and antennas are authored primitive geometry. No new source artwork was imported.

`aifrahat-city-kit.glb` is a stripped geometry study derived from the owner-
provided `samsy.wacz` archive. It retains selected generic building/block
geometry and numeric placement data for this local reconstruction. Creator-
branded models, logos, writing, portfolio/project imagery, texture maps and
collision objects were excluded. Every retained material is neutralized, and
Ai FRAHAT signs are generated at runtime as new canvas graphics. The archive's
upstream asset license has not been independently verified; this derived model
is for the owner's local study and must not be treated as cleared for public
redistribution or deployment without rights review.
