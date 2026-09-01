---
'mermaid': minor
---

feat(themes): composite states now take a per-container colour under the `redux-color` and `redux-dark-color` themes, as flowchart subgraphs already do. Each composite gets the palette's border colour on its outline and its background tint behind the title strip; nested composites each take the next colour, so depth stays readable. The body keeps the theme's own `compositeBackground`. `redux-dark-color` colours the outlines only, matching how it treats ER, requirement and sequence.

The concurrency regions produced by a `--` divider share the colour of the composite they split, rather than taking one of their own — the author wrote a single composite, so it is drawn as one thing in parts. Adding a `--` therefore leaves every other composite's colour untouched.

Under the `handDrawn` look, concurrency regions are now filled solid rather than hatched, so that they can carry the palette tint the same way every other look does.

States inside a composite stay uniform. A composite carrying its own `classDef` or `style` keeps those colours and takes no palette slot, and neither do its concurrency regions; the slot is still spent, so styling one composite does not shift the colours of the ones after it. Note that this opt-out is all-or-nothing: a `classDef` that sets only text properties, such as `font-weight`, still takes that composite out of the palette.
