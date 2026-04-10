# Refactoring gitGraph Click Events & Styling

## Objective

Refactor the clickable links implementation in `gitGraph` to match standard Mermaid paradigms (like flowcharts). This includes removing "hacky" post-render DOM manipulation, fixing styling regressions (awkward blue borders), and implementing Mermaid's custom `div.mermaidTooltip` popover instead of native browser tooltips.

## Key Files & Context

- `packages/mermaid/src/diagrams/git/gitGraphRenderer.ts`
- `packages/mermaid/src/diagrams/git/styles.js`
- `packages/mermaid/src/diagrams/git/gitGraphRenderer.click.spec.ts`

## Implementation Steps

### 1. Styling Fixes (`styles.js`)

- **Remove Heavy Borders**: Delete the explicit `stroke-width: 4px` and `stroke: options.git0` from the `:hover` and `:focus` states of `.commit-label-bkg`, `.branchLabelBkg`, and `.tag polygon`. This fixes the "awkward blue background border".
- **Add Thin Commit Outline**: Add a CSS rule to slightly increase the `stroke-width` (e.g., `3px`) of the actual commit bullets (`circle` and `rect:not(.commit-label-bkg)`) on hover/focus to provide a subtle "very thin outline" highlighting effect.
- **Keep Standard UX**: Retain `cursor: pointer` and `text-decoration: underline` for all `.clickable` elements.
- **Reset Anchor Styles**: Add `fill: inherit` and `text-decoration: none` to the injected `<a>` tags to prevent browser defaults from interfering.

### 2. Renderer Refactor (`gitGraphRenderer.ts`)

- **Remove Hacks**: Delete the `escapeCssId` utility and the post-render `setupClickEvents` loop.
- **Inline Click Setup**: Introduce a clean `applyClickEvent(selection, db, id, type)` utility. This will be called _during_ the drawing phase (inside `drawCommitBullet`, `drawCommitLabel`, `drawBranches`, `drawCommitTags`). It will append an `<a>` tag directly to the D3 selection and set the `href`, `rel`, and `target` attributes cleanly.
- **Custom Tooltips**: Instead of appending a native `<title>` SVG element (which triggers the basic browser tooltip), we will set a `title` or `data-title` attribute on the element and implement a `setupToolTips(element)` function that runs post-draw. This will use Mermaid's standard `createTooltip()` utility from `svgDrawCommon.js` to render the familiar `.mermaidTooltip` popover on mouseover/mousemove/mouseleave, perfectly matching flowcharts.

### 3. Verification & Testing

- Update `gitGraphRenderer.click.spec.ts` to reflect the new structure (e.g., verifying `setupToolTips` behavior or the inline `<a>` tag creation).
- Ensure all 4000+ tests pass (`pnpm vitest run`).
- Manually verify the hover effects and tooltips in `demos/git.html`.
