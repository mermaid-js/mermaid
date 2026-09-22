---
'mermaid': patch
---

fix: several documented theme variables set through frontmatter or `%%{init}%%` were silently dropped before reaching the renderer, even though the identical variable worked fine when passed to `mermaid.initialize({ themeVariables: ... })`.

`sanitizeDirective` only keeps a key if its bare name shows up somewhere in `configKeys`, a flat set built from `defaultConfig`. `defaultConfig.themeVariables` comes from the default theme's `getThemeVariables()`, which never defined `treeView.iconColor`, `treeView.descriptionColor`, `treeView.highlightBg`, `treeView.highlightStroke`, `packet.startByteColor`, `packet.endByteColor`, `packet.blockStrokeColor`, `packet.blockFillColor`, `stateBorder`, or `commitLineColor` (those only exist on the redux themes). Frontmatter setting any of them was stripped before the theme was calculated, while the exact same key worked through site config.

The default theme now defines all of these, matching the hardcoded fallback values each diagram's own styles already used, so the default rendering is unchanged and the frontmatter path now works the same as `initialize()`.

`requirementEdgeLabelBackground` from the same report is left for a follow-up: besides supplying a background color, its mere presence also flips a styling condition in `requirementBox.ts`, so giving it a default value would change more than just frontmatter support and needs a closer look first.
