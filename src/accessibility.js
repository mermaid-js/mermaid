/**
 * This method will add a basic title and description element to a chart. The yy parser will need to
 * respond to getTitle and getAccDescription, where the title is the title element on the chart,
 * which is generally not displayed and the accDescription is the description element on the chart,
 * which is never displayed.
 *
 * The following charts display their title as a visual and accessibility element: gantt
 *
 * @param yy_parser
 * @param svg
 * @param id
 */
export default function addSVGAccessibilityFields(yy_parser, svg, id) {
  if (typeof svg.insert === 'undefined') {
    return;
  }

  let title_string = yy_parser.getTitle();
  let description = yy_parser.getAccDescription();
  svg.attr('role', 'img').attr('aria-labelledby', 'chart-title-' + id + ' chart-desc-' + id);
  svg
    .insert('desc', ':first-child')
    .attr('id', 'chart-desc-' + id)
    .text(description);
  svg
    .insert('title', ':first-child')
    .attr('id', 'chart-title-' + id)
    .text(title_string);
}
