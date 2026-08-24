---
'mermaid': patch
---

fix: neo-look arrowheads and crow's-foot markers no longer fall back to default theme colours/stroke widths on the first render with `layout: elk`. State diagram arrowheads stayed dark on dark themes, and ER / requirement markers were drawn at the default stroke width, because markers were created from the layout package's own bundled copy of mermaid, whose config had not been initialized yet.
