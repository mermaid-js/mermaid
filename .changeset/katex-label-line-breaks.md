---
'mermaid': patch
---

fix: line breaks are no longer ignored in flowchart node and edge labels that contain `$$…$$` KaTeX math expressions. Both `<br/>` and hard line breaks in the label source now render on their own row, matching the behavior of labels without math.
