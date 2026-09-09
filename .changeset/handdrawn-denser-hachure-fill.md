---
'mermaid': patch
---

fix(handdrawn): tighten the hachure fill so shapes read as filled rather than striped.

The hand-drawn fill drew 4px-wide strokes 5.2px apart, which left visible diagonal
banding across every shape — legible as a texture up close, but at normal diagram size it
read as stripes rather than a fill. Strokes are now 1.5px at 1.5px spacing, so the fill
reads as an even tint while keeping the drawn edge quality.

The striped fill behind state-diagram start, end and fork markers moves the same way, so
those come out close to solid — which is what the UML convention asks for anyway.

Swimlane lane titles previously pinned their own stroke weight and so ignored the shared
value; they now follow it like every other shape.
