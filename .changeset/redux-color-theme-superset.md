---
'mermaid': patch
---

fix(themes): `redux-color` and `redux-dark-color` now define every theme variable their base themes (`redux` / `redux-dark`) define, and pie, gantt and user-journey draw from the themes' colour palette instead of rendering monochrome.

**Missing variables.** The colour themes were forked from the base themes by copy-paste and had drifted. `redux-color` was missing `stateEdgeLabelBackground` and `requirementEdgeLabelBackground` entirely, and silently re-derived `primaryBorderColor`, `clusterBkg`, `clusterBorder`, `altBackground` and `compositeTitleBackground` from the grey `primaryColor` instead of the tuned values in `redux`. `redux-dark-color` was missing `compositeBackground`, `altBackground`, `compositeTitleBackground`, `stateEdgeLabelBackground` and `requirementEdgeLabelBackground`.

Visible effects: state and requirement diagram edge labels get a solid white (light) / `#16141F` (dark) backing plate instead of a grey box; flowchart, state and block subgraph containers get the `#F9F9FB` fill and `#BDBCCC` border; and borders derived from `primaryBorderColor` — gantt task borders, quadrant chart borders, C4 person borders, architecture group borders — get the dark `#28253D`-based border instead of light grey.

**Monochrome chart diagrams.** Pie, gantt and user-journey read flat `pieN` / `fillTypeN` / `sectionBkgColor` variables rather than the `cScale` array, so they never picked up the colour themes' palette. Every value was a tint of a single pale lavender: `pie3` resolved to pure white in `redux-color` and to near-black in `redux-dark-color`, and both gantt section colours were white (light) or near-black (dark), so the section banding was invisible at the 20% opacity gantt paints it with.

Now: pie slices are drawn from the theme's categorical scale, so a pie reads like a mindmap or treemap in the same theme; gantt section bands use two palette hues that survive the 20% opacity; and user-journey gets eight hue-distinct section fills — pale in the light theme, dark in the dark theme, since journey labels use the theme's `textColor`.

The colour themes still differ from their base themes only on the palette: `borderColorArray`, `bkgColorArray`, the `cScale*` scale, and the pie/journey/gantt variables listed above.
