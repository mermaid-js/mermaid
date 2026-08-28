---
'mermaid': patch
---

fix(themes): `redux-color` and `redux-dark-color` now define every theme variable their base themes define, and pie, gantt and user-journey draw from the theme palette instead of rendering monochrome.

The colour themes were forked from `redux` / `redux-dark` by copy-paste and had drifted: some variables were missing (`stateEdgeLabelBackground`, `requirementEdgeLabelBackground`), others silently re-derived from the grey `primaryColor` (`primaryBorderColor`, `clusterBkg`, `clusterBorder`, `altBackground`, `compositeTitleBackground`).

Separately, pie, gantt and user-journey read flat `pieN` / `fillTypeN` / `sectionBkgColor` variables rather than the `cScale` array, so they never picked up the palette — `pie3` resolved to pure white in `redux-color` and near-black in `redux-dark-color`, and gantt had no visible section banding at all. They now use the theme's categorical scale.
