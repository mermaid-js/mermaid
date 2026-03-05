import type { SVG } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import type { EdgeData } from '../../types.js';
/**
 * Adds SVG markers to a path element based on the arrow types specified in the edge.
 *
 * @param svgPath - The SVG path element to add markers to.
 * @param edge - The edge data object containing the arrow types.
 * @param url - The URL of the SVG marker definitions.
 * @param id - The ID prefix for the SVG marker definitions.
 * @param diagramType - The type of diagram being rendered.
 */
export const addEdgeMarkers = (
  svgPath: SVG,
  edge: Pick<EdgeData, 'arrowTypeStart' | 'arrowTypeEnd'>,
  url: string,
  id: string,
  diagramType: string,
  strokeColor?: string
) => {
  if (edge.arrowTypeStart) {
    addEdgeMarker(svgPath, 'start', edge.arrowTypeStart, url, id, diagramType, strokeColor);
  }
  if (edge.arrowTypeEnd) {
    addEdgeMarker(svgPath, 'end', edge.arrowTypeEnd, url, id, diagramType, strokeColor);
  }
};

const arrowTypesMap = {
  arrow_cross: { type: 'cross', fill: false },
  arrow_point: { type: 'point', fill: true },
  arrow_barb: { type: 'barb', fill: true },
  arrow_circle: { type: 'circle', fill: false },
  aggregation: { type: 'aggregation', fill: false },
  extension: { type: 'extension', fill: false },
  composition: { type: 'composition', fill: true },
  dependency: { type: 'dependency', fill: true },
  lollipop: { type: 'lollipop', fill: false },
  only_one: { type: 'onlyOne', fill: false },
  zero_or_one: { type: 'zeroOrOne', fill: false },
  one_or_more: { type: 'oneOrMore', fill: false },
  zero_or_more: { type: 'zeroOrMore', fill: false },
  requirement_arrow: { type: 'requirement_arrow', fill: false },
  requirement_contains: { type: 'requirement_contains', fill: false },
} as const;

const addEdgeMarker = (
  svgPath: SVG,
  position: 'start' | 'end',
  arrowType: string,
  url: string,
  id: string,
  diagramType: string,
  strokeColor?: string
) => {
  const arrowTypeInfo = arrowTypesMap[arrowType as keyof typeof arrowTypesMap];

  if (!arrowTypeInfo) {
    log.warn(`Unknown arrow type: ${arrowType}`);
    return; // unknown arrow type, ignore
  }

  const endMarkerType = arrowTypeInfo.type;
  const suffix = position === 'start' ? 'Start' : 'End';
  const originalMarkerId = `${id}_${diagramType}-${endMarkerType}${suffix}`;

  // If stroke color is specified and non-empty, create or use a colored variant of the marker
  if (strokeColor && strokeColor.trim() !== '') {
    // Create a sanitized color value for use in IDs
    const colorId = strokeColor.replace(/[^\dA-Za-z]/g, '_');
    const coloredMarkerId = `${originalMarkerId}_${colorId}`;

    // Check if the colored marker already exists
    if (!document.getElementById(coloredMarkerId)) {
      // Get the original marker
      const originalMarker = document.getElementById(originalMarkerId);
      if (originalMarker) {
        // Clone the marker and create colored version
        const coloredMarker = originalMarker.cloneNode(true) as Element;
        coloredMarker.id = coloredMarkerId;

        // Apply colors to the paths inside the marker
        const paths = coloredMarker.querySelectorAll('path, circle, line');
        paths.forEach((path) => {
          path.setAttribute('stroke', strokeColor);

          // Apply fill only to markers that should be filled
          if (arrowTypeInfo.fill) {
            path.setAttribute('fill', strokeColor);
          }
        });

        // Add the new colored marker to the defs section
        originalMarker.parentNode?.appendChild(coloredMarker);
      }
    }

    // Use the colored marker
    svgPath.attr(`marker-${position}`, `url(${url}#${coloredMarkerId})`);
  } else {
    // Always use the original marker for unstyled edges
    svgPath.attr(`marker-${position}`, `url(${url}#${originalMarkerId})`);
  }
};
