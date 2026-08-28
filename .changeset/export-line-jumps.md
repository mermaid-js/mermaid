---
'mermaid': minor
---

feat: export `applyLineJumpsToSvg` so layout packages outside this one can draw line hops.

Line jumps are applied after paint, once every edge has been emitted and the crossings are known. A layout that ships inside this package can reach into `rendering-util` to do that; one that ships separately, like `@mermaid-js/layout-elk`, cannot. Exporting it alongside the other common-renderer pieces lets an external layout register an `afterPaint` hook that draws hops the same way the built-in ones do.

`EdgeGeom` and `LineJumpConfig` are exported with it, since they are the argument types.
