---
'mermaid': patch
---

fix(sequence): index each actor colour palette by its own length.

Every actor-drawing call site read `bkgColorArray[actorCount % borderColorArray.length]` — one palette indexed by the other's length. Both shipped palettes have twelve entries, so this is currently harmless; it goes wrong as soon as they differ, because the overflow actors resolve to `undefined` and d3 strips the inline fill for some actors and not others.

Both palettes now cycle within their own length, via a shared helper. An absent or empty palette still yields `undefined` rather than a substitute colour, which is what `redux-dark-color` relies on: it ships a border palette and an empty background palette so actors are outlined but not filled.
