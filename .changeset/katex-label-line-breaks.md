---
'mermaid': patch
---

fix: `<br/>` line breaks are no longer ignored in flowchart node and edge labels that contain `$$…$$` KaTeX math expressions. Each `<br/>`-separated line now renders on its own row, matching the behavior of labels without math.
