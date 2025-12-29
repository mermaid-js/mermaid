export function concatenateStyles(cssStyles: string[]): string {
  return cssStyles.join(';');
}

/**
 * Rough shapes are drawn by creating a `<g>` tag wrapping two `<path>` tags.

 * The first one draws the background, the second one draws the outline.
 * To make it looks hand-drawn, the background is actually composed of slanted
 * strokes. This means that the `fill` color must actually be set as `stroke`.

 * This function takes a list of background styles that should be applied to
 * a rough shape and changes the `fill` value to `stroke` to apply it to the
 * first `<path>` tag of the rough shape.
 */
export function fillToStroke(backgroundStyles: string[]): string {
  return concatenateStyles(backgroundStyles).replace('fill:', 'stroke:');
}
