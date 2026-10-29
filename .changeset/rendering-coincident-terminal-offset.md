---
'mermaid': patch
---

fix(swimlanes): shorten a swimlane edge for its arrowhead along the direction it arrives from, so a route of three or more points no longer ends in a short sideways leg; the end of such an edge moves by the arrowhead's pull-back, so swimlane renders change at the arrowhead. The renderer reads the direction from the nearest point that is somewhere else only for a layout that hands it coincident terminal points; dagre and ELK are unchanged
