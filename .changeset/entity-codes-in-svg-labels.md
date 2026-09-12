---
'mermaid': patch
---

fix(rendering): resolve entity codes in labels when `htmlLabels` is off

`#quot;` and `#9829;` rendered literally as `&quot;` and `&#9829;` with `htmlLabels: false`.
The documented entity codes become HTML entities before a label is drawn, and HTML labels
get those resolved by the browser, but SVG text is applied with `.text()` so they survived
as-is. Entity decoding now covers numeric codes and named ones beyond `&amp;`/`&lt;`/`&gt;`.
