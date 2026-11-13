---
'mermaid': patch
---

fix: report an out-of-range `linkStyle` index in `agentflow-beta` with the intended "index out of bounds" message instead of a raw `TypeError`. The bounds check was guarded by `typeof pos === 'number'`, but the grammar supplies indices as strings, so it never ran. An index written with a leading zero (`linkStyle 01`) now styles the edge it spells instead of throwing.
