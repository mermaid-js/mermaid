/**
 * Accessibility (a11y) functions, types, helpers
 * @see https://www.w3.org/WAI/
 * @see https://www.w3.org/TR/wai-aria-1.1/
 * @see https://www.w3.org/TR/svg-aam-1.0/
 *
 */
import { D3Element } from './mermaidAPI.ts';

import { isEmpty } from 'lodash-es';

/**
 * SVG element role:
 * The SVG element role _should_ be set to 'graphics-document' per SVG standard
 * but in practice is not always done by browsers, etc. (As of 2022-12-08).
 * A fallback role of 'document' should be set for those browsers, etc., that only support ARIA 1.0.
 *
 * @see https://www.w3.org/TR/svg-aam-1.0/#roleMappingGeneralRules
 * @see https://www.w3.org/TR/graphics-aria-1.0/#graphics-document
 */
const SVG_ROLE = 'graphics-document document';

/**
 * Add role and aria-roledescription to the svg element
 *
 * @param svg - d3 object that contains the SVG HTML element
 * @param diagramType - diagram name for to the aria-roledescription
 */
export function setA11yDiagramInfo(svg: D3Element, diagramType: string | null | undefined) {
  svg.attr('role', SVG_ROLE);
  if (!isEmpty(diagramType)) {
    svg.attr('aria-roledescription', diagramType);
  }
}
/**
 * Add an accessible title and/or description element to a chart.
 * The title is usually not displayed and the description is never displayed.
 *
 * The following charts display their title as a visual and accessibility element: gantt
 *
 * @param svg - d3 node to insert the a11y title and desc info
 * @param a11yTitle - a11y title. null and undefined are meaningful: means to skip it
 * @param a11yDesc - a11y description.  null and undefined are meaningful: means to skip it
 * @param baseId - id used to construct the a11y title and description id
 */
export function addSVGa11yTitleDescription(
  svg: D3Element,
  a11yTitle: string | null | undefined,
  a11yDesc: string | null | undefined,
  baseId: string
) {
  if (svg.insert === undefined) {
    return;
  }

  if (a11yTitle || a11yDesc) {
    if (a11yDesc) {
      const descId = 'chart-desc-' + baseId;
      svg.attr('aria-describedby', descId);
      svg.insert('desc', ':first-child').attr('id', descId).text(a11yDesc);
    }
    if (a11yTitle) {
      const titleId = 'chart-title-' + baseId;
      svg.attr('aria-labelledby', titleId);
      svg.insert('title', ':first-child').attr('id', titleId).text(a11yTitle);
    }
  } else {
    return;
  }
}
