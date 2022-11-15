/**
 * Accessibility (a11y) functions, types, helpers
 *
 */

// This is just a convenience alias to make it clear the type is a d3 object. (It's easier to make it 'any' instead of the comple typing set in d3)
type D3object = any;

/**
 * Set the accessibility (a11y) information for the svg d3 object using the given diagram type
 * Note that the svg element role _should_ be mapped to a 'graphics-document' by default. Thus we don't set it here, but can set it in the future if needed.
 * @param svg - d3 object that contains the SVG HTML element
 * @param diagramType - diagram name for to the aria-roledescription
 */
export function setA11yDiagramInfo(svg: D3object, diagramType: string) {
  svg.attr('aria-roledescription', diagramType);
}

/**
 * This method will add a basic title and description element to a chart. The yy parser will need to
 * respond to getAccTitle and getAccDescription,
 * where the accessible title is the title element on the chart.
 *
 * Note that the accessible title is generally _not_ displayed
 * and the accessible description is never displayed.
 *
 *
 * The following charts display their title as a visual and accessibility element: gantt.  TODO fix this
 *
 * @param diagramDb - the 'db' object/module for a diagram. Must respond to getAccTitle() and getAccDescription()
 * @param svg - the d3 object that represents the svg element
 * @param baseId - the id to use as the base for the title and description
 */
export function addSVGa11yTitleDescription(diagramDb: any, svg: D3object, baseId: string) {
  if (typeof svg.insert === 'undefined') {
    return;
  }

  const titleId = 'chart-title-' + baseId;
  const descId = 'chart-desc-' + baseId;

  svg.attr('aria-labelledby', titleId + ' ' + descId);
  svg.insert('desc', ':first-child').attr('id', descId).text(diagramDb.getAccDescription());
  svg.insert('title', ':first-child').attr('id', titleId).text(diagramDb.getAccTitle());
}
