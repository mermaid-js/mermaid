---
'mermaid': major
---

feat!: the layout-package building blocks move behind a single `__internalsDoNotUse` export.

`createCommonLayoutRenderer`, `defaultMeasureLayout`, `paintLayoutData`, `clearLayoutRenderState` and `applyLineJumpsToSvg` are no longer top-level named exports. They are reachable as `__internalsDoNotUse.createCommonLayoutRenderer` and so on:

```diff
-import { createCommonLayoutRenderer } from 'mermaid';
+import { __internalsDoNotUse } from 'mermaid';
+
+const { createCommonLayoutRenderer } = __internalsDoNotUse;
```

These helpers reach straight into the renderer, so they change whenever it does — adding a node shape or changing how edges are painted can alter their signatures. As plain named exports, every such change counted as a breaking change to Mermaid's public API. Behind `__internalsDoNotUse` they are explicitly outside SemVer and may change or disappear in any release, including a patch.

Their types are still exported as types, under the same caveat. Nothing else about writing an external layout changes — see the [layout makers guide](https://mermaid.js.org/community/layout-makers-guide.html).
