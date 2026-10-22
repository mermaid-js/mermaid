---
'mermaid': patch
---

fix: keep theme variables that the default theme does not define (e.g. `stateBorder`, `commitLineColor`, `packet.startByteColor`, `treeView.iconColor`) when they are set through frontmatter or directives
