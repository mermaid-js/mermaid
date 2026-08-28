---
'mermaid': patch
---

fix(er, requirement): stop the ER and requirement stylesheets emitting invalid CSS for the colour themes.

Both generate one rule per palette slot, looping to `THEME_COLOR_LIMIT` and indexing the palette by the loop counter. Indexing raw means a palette with fewer entries than that limit emits `stroke: undefined` for the overflow slots; both now wrap at the palette length.

`requirement` also emitted `fill: ;` — a property with no value, which is invalid — whenever there was no background palette. That is the live case for `redux-dark-color`, which ships a border palette and no background palette so that it colours outlines only. The declaration is now omitted instead.

Neither raises an error: the browser discards the invalid declaration, so the only symptom is a shape rendering unstyled.
