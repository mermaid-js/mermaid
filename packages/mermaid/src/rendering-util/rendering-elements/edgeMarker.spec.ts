import { select } from 'd3';
import insertMarkers from './markers.js';
/* eslint-disable @typescript-eslint/unbound-method */
import type { SVG } from '../../diagram-api/types.js';
import type { Mocked } from 'vitest';
import { addEdgeMarkers } from './edgeMarker.js';

describe('addEdgeMarker', () => {
  const svgPath = {
    attr: vitest.fn(),
  } as unknown as Mocked<SVG>;
  const url = 'http://example.com';
  const id = 'test';
  const diagramType = 'test';

  beforeEach(() => {
    svgPath.attr.mockReset();
  });

  it('should add markers for arrow_cross:arrow_point', () => {
    const arrowTypeStart = 'arrow_cross';
    const arrowTypeEnd = 'arrow_point';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-crossStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-pointEnd)`
    );
  });

  it('should add markers for aggregation:arrow_point', () => {
    const arrowTypeStart = 'aggregation';
    const arrowTypeEnd = 'arrow_point';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-aggregationStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-pointEnd)`
    );
  });

  it('should add markers for arrow_point:aggregation', () => {
    const arrowTypeStart = 'arrow_point';
    const arrowTypeEnd = 'aggregation';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-pointStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-aggregationEnd)`
    );
  });

  it('should add markers for aggregation:composition', () => {
    const arrowTypeStart = 'aggregation';
    const arrowTypeEnd = 'composition';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-aggregationStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-compositionEnd)`
    );
  });

  it('should add markers for arrow_hollow_circle:arrow_open_head', () => {
    const arrowTypeStart = 'arrow_hollow_circle';
    const arrowTypeEnd = 'arrow_open_head';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-start',
      `url(${url}#${id}_${diagramType}-hollowCircleStart)`
    );
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-openArrowEnd)`
    );
  });

  it('should draw no marker for the arrow_open a block edge carries as its start type', () => {
    addEdgeMarkers(
      svgPath,
      { arrowTypeStart: 'arrow_open', arrowTypeEnd: 'arrow_point' },
      url,
      id,
      diagramType
    );
    expect(svgPath.attr).not.toHaveBeenCalledWith('marker-start', expect.anything());
    expect(svgPath.attr).toHaveBeenCalledWith(
      'marker-end',
      `url(${url}#${id}_${diagramType}-pointEnd)`
    );
  });

  it('should not add invalid markers', () => {
    const arrowTypeStart = 'this is an invalid marker';
    const arrowTypeEnd = ') url(https://my-malicious-site.example)';
    addEdgeMarkers(svgPath, { arrowTypeStart, arrowTypeEnd }, url, id, diagramType);
    expect(svgPath.attr).not.toHaveBeenCalled();
  });
});

// Class diagram markers use paths, polygons, and circles depending on the look.
describe('colored class diagram markers', () => {
  const markerTypes = ['extension', 'aggregation', 'composition', 'dependency', 'lollipop'];

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it.each(
    markerTypes.flatMap((type) =>
      [false, true].flatMap((useMargin) =>
        ['start', 'end'].map((position) => ({ type, useMargin, position }))
      )
    )
  )(
    'colors $type at $position with margin=$useMargin without changing the original',
    ({ type, useMargin, position }) => {
      const svg = select(document.body).append('svg');
      insertMarkers(svg, [type], 'classDiagram', 'colored');
      const suffix = position === 'start' ? 'Start' : 'End';
      const originalId = `colored_classDiagram-${type}${suffix}${useMargin ? '-margin' : ''}`;
      const original = document.getElementById(originalId)!;
      const originalMarkup = original.outerHTML;
      const path = svg.append('path') as unknown as SVG;
      addEdgeMarkers(
        path,
        {
          arrowTypeStart: position === 'start' ? type : 'none',
          arrowTypeEnd: position === 'end' ? type : 'none',
        },
        '',
        'colored',
        'classDiagram',
        useMargin,
        'green'
      );
      expect(path.attr(`marker-${position}`)).toBe(`url(#${originalId}_green)`);
      const colored = document.getElementById(`${originalId}_green`)!;
      const shapes = colored.querySelectorAll('path, polygon, circle, line');
      expect(shapes.length).toBeGreaterThan(0);
      const originalShapes = original.querySelectorAll('path, polygon, circle, line');
      for (const [index, shape] of [...shapes].entries()) {
        expect(shape.getAttribute('stroke')).toBe('green');
        expect(shape.getAttribute('fill')).toBe(
          ['composition', 'dependency'].includes(type)
            ? 'green'
            : originalShapes[index].getAttribute('fill')
        );
      }
      expect(original.outerHTML).toBe(originalMarkup);
    }
  );

  it('finds colored markers in the path document when rendering in an iframe', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const frameDocument = iframe.contentDocument!;
    const svg = select(frameDocument.body).append('svg');
    insertMarkers(svg, ['extension'], 'classDiagram', 'sandboxed');
    const path = svg.append('path') as unknown as SVG;
    addEdgeMarkers(
      path,
      { arrowTypeStart: 'extension', arrowTypeEnd: 'none' },
      '',
      'sandboxed',
      'classDiagram',
      true,
      'green'
    );
    const markerId = 'sandboxed_classDiagram-extensionStart-margin_green';
    expect(
      frameDocument.getElementById(markerId)?.querySelector('polygon')?.getAttribute('stroke')
    ).toBe('green');
    expect(document.getElementById(markerId)).toBeNull();
  });
  it('reuses markers of the same color and keeps other colors and unstyled edges separate', () => {
    const svg = select(document.body).append('svg');
    insertMarkers(svg, ['extension'], 'classDiagram', 'isolated');
    const paths = ['green', 'red', 'green', undefined].map((color) => {
      const path = svg.append('path') as unknown as SVG;
      addEdgeMarkers(
        path,
        { arrowTypeStart: 'extension', arrowTypeEnd: 'none' },
        '',
        'isolated',
        'classDiagram',
        true,
        color
      );
      return path;
    });
    expect(paths[0].attr('marker-start')).toBe(paths[2].attr('marker-start'));
    expect(paths[0].attr('marker-start')).not.toBe(paths[1].attr('marker-start'));
    expect(paths[3].attr('marker-start')).toBe('url(#isolated_classDiagram-extensionStart-margin)');
    expect(svg.selectAll('marker').size()).toBe(6);
  });
});
