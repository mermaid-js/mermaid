---
'mermaid': patch
---

fix(er, requirement, timeline): stop the ER, requirement and timeline stylesheets emitting CSS the browser discards for the colour themes.

All three generate one rule per palette slot. ER and requirement looped to `THEME_COLOR_LIMIT` and indexed the palette by the loop counter, which goes wrong in both directions: a palette shorter than the limit emitted `stroke: undefined` for the overflow slots, and a palette _longer_ than it left entities stamped with a slot that had no rule at all, rendering unstyled beside coloured neighbours. Both now take the loop bound from the palette itself, which is the same length the boxes stamp with — so the rules emitted and the slots stamped cannot disagree. Both also bail before the loop for an empty palette, since wrapping alone is not enough there: `i % 0` is `NaN` and `[][NaN]` is `undefined`.

Timeline keeps looping to `THEME_COLOR_LIMIT` and wrapping, because it numbers `.section-N` classes rather than palette slots — nothing stamps those, so the palette cycles across however many sections exist.

`requirement` also emitted `fill: ;` — a property with no value, which is invalid — whenever there was no background palette. That is the live case for `redux-dark-color`, which ships a border palette and no background palette so that it colours outlines only. The declaration is now omitted instead.

None of these raises an error: the browser discards the invalid declaration, so the only symptom is a shape rendering unstyled.
