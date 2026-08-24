---
'mermaid': minor
---

feat(layout): add the `grid-like` layout algorithm (Kieffer, Dwyer, Marriott & Wybrow, _Incremental Grid-like Layout Using Soft and Hard Constraints_, 2013). It builds on the IPSEP-COLA layout: adaptive constrained alignment makes chosen edges exactly horizontal or vertical, and a grid-snap penalty then draws node centres toward a regular grid without letting them cross a separation constraint. Select it with `layout: 'grid-like'`.
