---
'mermaid': patch
---

fix(venn): render labeled higher-arity unions when the underlying pairwise unions are not declared. The venn.js layout needs pairwise intersection sizes to make circles overlap, so `union A,B,C[label]` on its own previously rendered as three disjoint circles with no intersection region for the label. `vennRenderer` now synthesizes the missing pairwise subsets from any higher-arity union before passing the data to venn.js. User-declared subsets keep their sizes, labels, and styles. Resolves #7656.
