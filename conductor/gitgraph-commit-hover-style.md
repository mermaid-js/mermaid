# GitGraph Hover Styling Fix

## Objective

The user noted that the previous heavy blue borders were removed (which is an improvement) but requested a "very thin outline" specifically for commit objects on hover to clearly indicate they are clickable. We will focus _exclusively_ on this single CSS change.

## Key Files

- `packages/mermaid/src/diagrams/git/styles.js`

## Implementation Steps

1.  **Add Commit Outline**: Modify the CSS in `styles.js` to slightly increase the `stroke-width` of the commit bullets (`circle` and `rect` elements) when they are hovered or focused.
2.  **Exclude Label Backgrounds**: Ensure we use `:not(.commit-label-bkg)` so the text background doesn't get an awkward outline, which was the original problem.

The new CSS block to add will look like:

```css
  .commit.clickable:hover circle,
  .commit.clickable:focus circle,
  .commit.clickable:hover rect:not(.commit-label-bkg),
  .commit.clickable:focus rect:not(.commit-label-bkg),
  .commit.clickable:hover path,
  .commit.clickable:focus path {
    stroke-width: 3px !important;
    stroke: ${options.textColor} !important;
  }
```

This is a targeted, surgical change that touches no logic or parser files, strictly addressing the visual feedback request.
