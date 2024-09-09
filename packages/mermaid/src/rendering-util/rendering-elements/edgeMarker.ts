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
  diagramType: string
) => {
  if (edge.arrowTypeStart) {
    addEdgeMarker(svgPath, 'start', edge.arrowTypeStart, url, id, diagramType);
  }
  if (edge.arrowTypeEnd) {
    addEdgeMarker(svgPath, 'end', edge.arrowTypeEnd, url, id, diagramType);
  }
};

const arrowTypesMap = {
  arrow_cross: 'cross',
  arrow_point: 'point',
  arrow_barb: 'barb',
  arrow_circle: 'circle',
  aggregation: 'aggregation',
  extension: 'extension',
  composition: 'composition',
  dependency: 'dependency',
  lollipop: 'lollipop',
} as const;

const addEdgeMarker = (
  svgPath: SVG,
  position: 'start' | 'end',
  arrowType: string,
  url: string,
  id: string,
  diagramType: string
) => {
  const endMarkerType = arrowTypesMap[arrowType as keyof typeof arrowTypesMap];

  if (!endMarkerType) {
    log.warn(`Unknown arrow type: ${arrowType}`);
    return; // unknown arrow type, ignore
  }

  const suffix = position === 'start' ? 'Start' : 'End';
  svgPath.attr(`marker-${position}`, `url(${url}#${id}_${diagramType}-${endMarkerType}${suffix})`);
};
