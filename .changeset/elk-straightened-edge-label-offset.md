---
'mermaid': patch
---

fix: with the ELK layout, an edge label could sit up to 16px beside its edge instead of centred on it, when the edge's terminal jog was straightened after the label's position was computed. The label is now re-projected onto the straightened route
