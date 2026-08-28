---
'mermaid': patch
---

fix(themes): resolve `secondBkg` in the dark redux and neo themes, restore gantt done-task contrast, and stop the ER and requirement stylesheets emitting invalid CSS.

`redux-dark`, `redux-dark-color` and `neo-dark` copied `secondBkg = 'calculated'` from `theme-dark.js` without the line that computes it, so the literal string `calculated` shipped as a colour — railroad rendered `fill: calculated`, which is invalid. It is now computed the same way `theme-dark.js` does.

Those three themes also inherited `doneTaskBkgColor: 'lightgrey'`, a light fill paired with their light task-label ink, leaving gantt done-task labels at 1.07:1 contrast — effectively invisible. `theme-dark.js` gets away with the same fill because it uses a dark ink; here the active-task fill is dark, so one ink serves both and the fill is what moves. Done tasks now use the theme's secondary surface: 7.25:1, 7.25:1 and 5.69:1.

`er/styles.ts` indexed `borderColorArray[i]` up to `THEME_COLOR_LIMIT`, which would emit `stroke: undefined` for a palette shorter than that; both stylesheets now wrap at the palette length. `requirement/styles.js` emitted the invalid declaration `fill: ;` whenever `bkgColorArray` was empty — the live case for `redux-dark-color`, which colours borders only — and now omits the declaration instead.

The ER and requirement stylesheets also now validate `look` before interpolating it into a CSS selector, and take the shared colour-theme gate rather than each keeping its own copy. `look` is a top-level config key, so it is reachable from diagram text; anything that is not a bare word is now rejected. This closes the last two of the five places that interpolated it — `class` and `flowchart` were already covered.
