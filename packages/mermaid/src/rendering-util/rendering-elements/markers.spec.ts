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

/**
 * `openArrow` and `hollowCircle` are the unfilled markers. Both are stroked outlines
 * rather than closed shapes, so a filled clone would silently turn them into a solid
 * head and a solid dot, which is a different notation.
 */
const unfilledMarkers = ['openArrow', 'hollowCircle'];

const renderUnfilledMarkers = () => {
  const svg = select(document.body).append('svg');
  insertMarkers(svg, unfilledMarkers, 'flowchart', 'unfilled');
  return svg;
};

describe('unfilled edge markers', () => {
  it('emits a start and an end variant of each', () => {
    const ids = renderUnfilledMarkers()
      .selectAll('marker')
      .nodes()
      .map((marker) => (marker as Element).id)
      .sort();

    expect(ids).toEqual([
      'unfilled_flowchart-hollowCircleEnd',
      'unfilled_flowchart-hollowCircleStart',
      'unfilled_flowchart-openArrowEnd',
      'unfilled_flowchart-openArrowStart',
    ]);
  });

  it('sets markerUnits="userSpaceOnUse" so size is independent of stroke-width', () => {
    const offenders = renderUnfilledMarkers()
      .selectAll('marker')
      .nodes()
      .filter((marker) => (marker as Element).getAttribute('markerUnits') !== 'userSpaceOnUse')
      .map((marker) => (marker as Element).id);

    expect(offenders).toEqual([]);
  });

  it('leaves the head and the ring unfilled', () => {
    const filled = renderUnfilledMarkers()
      .selectAll('marker > *')
      .nodes()
      .filter((shape) => (shape as SVGElement).style.fill !== 'none')
      .map((shape) => (shape as Element).parentElement?.id);

    expect(filled).toEqual([]);
  });
});
