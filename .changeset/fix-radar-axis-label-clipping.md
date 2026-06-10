---
'mermaid': patch
---

fix(radar): align axis labels based on angular position to prevent clipping

Radar chart axis labels now set `text-anchor` and `dominant-baseline` dynamically based on each label's angular position around the chart. Labels on the left use `text-anchor: end`, labels on the right use `start`, and top/bottom labels use `middle`. This prevents long labels from extending past the SVG viewBox boundary and being clipped.

Also removed the hard-coded `text-anchor: middle` and `dominant-baseline: middle` from the `.radarAxisLabel` CSS class in `styles.ts`, since CSS rules override SVG presentation attributes and were silently defeating the per-label alignment fix. Added `overflow: visible` on the SVG element as a safety net, and a small pixel offset (`labelPad`) for extra breathing room.
