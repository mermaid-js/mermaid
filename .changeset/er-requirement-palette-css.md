---
'mermaid': patch
---

fix(er, requirement, timeline): stop the ER, requirement and timeline stylesheets emitting invalid CSS for the colour themes.

All three generate one rule per palette slot, looping to `THEME_COLOR_LIMIT` and indexing the palette by the loop counter. Indexing raw means a palette with fewer entries than that limit emits `stroke: undefined` for the overflow slots; all three now wrap at the palette length, and bail before the loop for an empty palette — wrapping alone is not enough there, because `i % 0` is `NaN` and `[][NaN]` is `undefined`.

`requirement` also emitted `fill: ;` — a property with no value, which is invalid — whenever there was no background palette. That is the live case for `redux-dark-color`, which ships a border palette and no background palette so that it colours outlines only. The declaration is now omitted instead.

None of these raises an error: the browser discards the invalid declaration, so the only symptom is a shape rendering unstyled.
