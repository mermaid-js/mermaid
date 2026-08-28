---
'mermaid': major
---

**`redux-color` is now the default theme, and `neo` is the default look.** Every diagram rendered without an explicit `theme` and `look` changes appearance.

Previously the defaults were `theme: default` and `look: classic` — the long-standing purple/Trebuchet look with square corners. The new default pairs the `redux` geometry and typography (12px corner radius, 2px strokes, the Recursive typeface, subtle node shadows) with a categorical colour palette, so ER entities, sequence actors, git branches, requirements, classes, flowchart subgraph containers, pie slices, mindmap and timeline sections each get their own colour.

To keep the previous appearance, name both explicitly — site-wide:

```js
mermaid.initialize({ theme: 'default', look: 'classic' });
```

or per diagram:

```
---
config:
  theme: default
  look: classic
---
```

One interaction worth knowing about the new look: `neo` paints node strokes with a gradient when the active theme sets `useGradient`, and `base` sets it by default — which meant a custom `nodeBorder` on `theme: base` was silently discarded. Since `base` is the theme documented as modifiable, an explicit `nodeBorder` now turns the gradient off so the override is what paints. Set `useGradient: true` alongside it to keep the gradient.

Also fixed while making this change: the sequence diagram's `neo` drop-shadow filter used a hardcoded `id="drop-shadow"`, so two sequence diagrams on one page produced duplicate DOM IDs and the second borrowed the first's filter. It is now scoped per diagram, matching every other diagram.

`default` and every other built-in theme remain available and unchanged. Only the value used when no theme is given has changed.

Three things had to agree for this, and all three moved: the JSON-Schema default that becomes `config.theme`, the explicit `themeVariables` in `defaultConfig.ts`, and the branch in `mermaidAPI.initialize` taken when no theme — or an unrecognised one — is given. A regression test now pins that the theme name and the shipped `themeVariables` describe the same theme, since a drift between them renders a mixture of two palettes without raising anything.

Two latent bugs surfaced and are fixed:

- `timeline` read the theme _name_ from global config while receiving its theme variables as a parameter, and indexed `borderColorArray` on the strength of the name alone, throwing `Cannot read properties of undefined` when the two disagreed. No released version could reach this — `mermaidAPI` always passes the name and the variables from the same config object — so this is gate hardening rather than a user-facing fix. It now uses the shared colour-theme gate instead of substring-matching the theme name.
- The `railroad` style test asserted against `config.themeVariables.secondBkg`, which only matched the rendered output while the default theme happened to define that variable. `railroad` layers `theme-default` underneath the active theme, so variables the active theme omits — `secondBkg` is unset across the `base` / `neo` / `redux` family — still resolve, just not from the config. The test now asserts against `railroad`'s own resolution.
