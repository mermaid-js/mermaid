---
'mermaid': patch
---

fix(block): restore node borders under looks that use a gradient stroke.

A block diagram rendered with `look: neo` lost its node borders entirely. The look-specific
rules set `stroke: url(#<svgId>-gradient)`, and those definitions were appended by
`rendering-util/render.ts` — which block does not use, since it runs its own render loop.
An `url(#…)` paint that resolves to nothing is painted as **none**, not as a fallback
colour, so the border disappeared rather than degrading to a plain stroke.

The definitions now live in `rendering-util/insertLookDefs.ts` and both render paths call
it, so the two cannot drift into producing different gradients.

This only became visible recently: block did not previously pass `look` to its nodes, so
none of the look-specific rules applied to it and the missing definitions went unnoticed.
