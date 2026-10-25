# Ghost character

Model and animations: Quaternius, Ultimate Monsters (October 2022), CC0 1.0.
Author's pack/license: https://quaternius.com/packs/ultimatemonsters.html
License: https://creativecommons.org/publicdomain/zero/1.0/
GLB conversion distributed at:
https://github.com/ilrein/warptracker/blob/main/public/models/ghost.glb
Conversion provenance: https://github.com/ilrein/warptracker/blob/main/ASSETS.md
Retrieved 2026-10-24. Original texture retained inside GLB; local runtime uses an
original charcoal material and adds red eyes. No Samsy model is included.
Animations inspected: Death, Fast_Flying, Flying_Idle, Headbutt, HitReact, No,
Punch, Yes. The controller uses Flying_Idle/Fast_Flying, with physical movement
and jumping controlled separately by Rapier.

Original rounded cowl and recessed face geometry added locally; not from Samsy.
2026-10-24 owner revision: recessed black face removed; original added eyes recolored orange.
Reference-composition pass: Quaternius model is retained as an unused alternative. Active character is now original procedural shroud geometry in src/character-asset.ts, with original mouth/eyes and movement. No Samsy mesh is included.
