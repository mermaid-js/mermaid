---
'mermaid': minor
---

feat(themes): composite states and concurrency regions now take a per-container colour under the `redux-color` and `redux-dark-color` themes, as flowchart subgraphs already do. Each composite gets the palette's border colour on its outline and its background tint behind the title strip; nested composites each take the next colour, so depth stays readable. `redux-dark-color` colours the outlines only, matching how it treats ER, requirement and sequence.

The concurrency regions produced by a `--` divider are the exception: every region of one composite shares a single colour, so a divided composite reads as one thing split into parts rather than as several composites side by side. Regions of different composites still differ.

States inside a composite stay uniform, and a composite carrying its own `classDef` or `style` keeps those colours and takes no palette slot — the slot is still spent, so styling one composite does not shift the colours of the ones after it.
