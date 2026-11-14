---
'mermaid': patch
---

fix(wardley): names that are, start with, or begin with a statement keyword, such as `notebook`, `sizes`, `note taking app` or `component library`, now parse instead of failing, and a line such as `evolution tracker -> Shop` is a link when a node named `evolution tracker` exists
