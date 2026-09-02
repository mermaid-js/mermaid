---
'mermaid': patch
---

fix(sequence): index each actor colour palette by its own length.

Every actor-drawing call site read `bkgColorArray[actorCount % borderColorArray.length]` — one palette indexed by the other's length. Under `redux-color` both palettes have twelve entries, so the wrong length happens to give the right answer and nothing is visibly broken today. It goes wrong as soon as the two differ in length: the overflow actors resolve to `undefined`, and d3 then strips the inline fill for some actors and not others.

Both palettes now cycle within their own length, via a shared helper. An absent or empty palette still yields `undefined` rather than a substitute colour, which is what `redux-dark-color` relies on: it ships a border palette and an empty background palette so actors are outlined but not filled.
