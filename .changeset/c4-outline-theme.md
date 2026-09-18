---
'mermaid': minor
---

feat(c4): render C4 elements in the c4model.com outline style - the element sits on the theme's
surface colour with its identity colour as the border and label text. The identity colour comes from
the existing per-element `<type>_bg_color` palette, shifted until it reads against that surface, so
dark themes get a light identity on a dark body rather than the other way round. `UpdateElementStyle`
overrides still apply and take precedence.

Two behaviour changes worth noting:

- **`<type>_border_color` no longer affects rendering.** The border is now the element's identity
  colour derived from `<type>_bg_color`. The 40 `<type>_border_color` config keys still exist and
  still validate, but setting one has no effect.
- Element bodies follow the theme instead of the previous solid palette fill, so existing C4 diagrams
  change appearance: a light fill with a coloured outline in light themes, and a dark fill in dark
  themes, where they were previously a solid colour with white text.
