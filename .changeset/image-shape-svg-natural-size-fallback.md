---
'mermaid': patch
---

fix(flowchart): image shape no longer produces NaN sizes on Firefox for SVG images without intrinsic dimensions

Firefox reports `naturalWidth`/`naturalHeight` as `0` (instead of the rendered
size) for SVG images that lack explicit `width`/`height` attributes. The image
shape divided by these values to compute the aspect ratio, so with
`constraint: on` the node width, height and transforms all became `NaN`
("Unexpected value NaN parsing width/height attribute", `translate(NaN,NaN)`).

The natural dimensions now fall back to the requested asset size (`w`/`h`), or
to the same 48px default the icon shapes use, whenever the browser reports a
non-positive or non-finite natural size.
