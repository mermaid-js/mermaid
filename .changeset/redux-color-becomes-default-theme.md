---
'mermaid': minor
---

**`redux-color` is now the default theme.** Every diagram rendered without an explicit theme changes appearance.

Previously the default was `default` — the long-standing purple/Trebuchet look. The new default pairs the `redux` geometry and typography (12px corner radius, 2px strokes, the Recursive typeface, subtle node shadows) with a categorical colour palette, so ER entities, sequence actors, git branches, requirements, classes, flowchart subgraph containers, pie slices, mindmap and timeline sections each get their own colour.

To keep the previous appearance, name the old theme explicitly — site-wide:

```js
mermaid.initialize({ theme: 'default' });
```

or per diagram:

```
---
config:
  theme: default
---
```

`default` and every other built-in theme remain available and unchanged. Only the value used when no theme is given has changed.

Three things had to agree for this, and all three moved: the JSON-Schema default that becomes `config.theme`, the explicit `themeVariables` in `defaultConfig.ts`, and the branch in `mermaidAPI.initialize` taken when no theme — or an unrecognised one — is given. A regression test now pins that the theme name and the shipped `themeVariables` describe the same theme, since a drift between them renders a mixture of two palettes without raising anything.

Two latent bugs surfaced and are fixed:

- `timeline` read the theme _name_ from global config while receiving its theme variables as a parameter, and indexed `borderColorArray` on the strength of the name alone. When the two disagreed it threw `Cannot read properties of undefined`. It now gates on the palette actually being present.
- The `railroad` style test asserted against `config.themeVariables.secondBkg`, which only matched the rendered output while the default theme happened to define that variable. `railroad` layers `theme-default` underneath the active theme, so variables the active theme omits — `secondBkg` is unset across the `base` / `neo` / `redux` family — still resolve, just not from the config. The test now asserts against `railroad`'s own resolution.
