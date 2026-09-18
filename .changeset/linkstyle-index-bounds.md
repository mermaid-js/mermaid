---
'mermaid': patch
---

fix: report an out-of-range `linkStyle` index with the intended "index out of bounds" message instead of a raw `TypeError`. The bounds check was guarded by `typeof pos === 'number'`, but the grammar supplies indices as strings, so it never ran — for `linkStyle … interpolate` there was no check at all.
