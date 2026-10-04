import { select } from 'd3';
import { describe, expect, it } from 'vitest';
import insertMarkers from './markers.js';

/**
 * The class diagram relation markers must not scale with the edge's stroke-width.
 *
 * Themes such as `redux`/`neo` set `themeVariables.strokeWidth` to 2, which becomes the
 * `stroke-width` of `path.relation`. Markers default to `markerUnits="strokeWidth"`, so any
 * marker missing an explicit `markerUnits` gets drawn at twice its size and overshoots the
 * line-end offset from `markerOffsets`, ending up hidden behind the class box.
 */
const classDiagramMarkers = ['aggregation', 'extension', 'composition', 'dependency', 'lollipop'];

const renderMarkers = () => {
  const svg = select(document.body).append('svg');
  insertMarkers(svg, classDiagramMarkers, 'classDiagram', 'test');
  return svg;
};

describe('class diagram markers', () => {
  it('sets markerUnits="userSpaceOnUse" on every marker so size is independent of stroke-width', () => {
    const svg = renderMarkers();

    const offenders = svg
      .selectAll('marker')
      .nodes()
      .filter((marker) => (marker as Element).getAttribute('markerUnits') !== 'userSpaceOnUse')
      .map((marker) => (marker as Element).id);

    expect(offenders).toEqual([]);
  });
});
