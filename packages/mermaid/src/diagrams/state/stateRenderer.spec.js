import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dagre layout so it doesn't attempt real SVG measurement
vi.mock('dagre-d3-es/src/dagre/index.js', () => ({
  layout: vi.fn(),
}));

// Mock shapes so drawState appends a real <g> without needing full SVG rendering
vi.mock('./shapes.js', () => ({
  drawState: vi.fn((diagram, stateDef) => {
    diagram.append('g').attr('id', stateDef.id).attr('class', 'stateGroup');
    return { id: stateDef.id, width: 50, height: 30 };
  }),
  addTitleAndBox: vi.fn((sub) => sub),
  drawEdge: vi.fn(),
}));

vi.mock('../../setupGraphViewbox.js', () => ({
  configureSvgSize: vi.fn(),
}));

vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({
    securityLevel: 'loose',
    state: {
      padding: 8,
      edgeLengthFactor: 200,
      fontSizeFactor: 5.02,
      labelHeight: 16,
      compositTitleSize: 35,
      useMaxWidth: true,
    },
  })),
}));

import { draw } from './stateRenderer.js';

const DIAGRAM_ID = 'test-state-diagram';

describe('stateRenderer v1 draw()', () => {
  beforeEach(() => {
    document.body.innerHTML = `<svg id="${DIAGRAM_ID}"></svg>`;
    // jsdom does not implement SVGElement.getBBox — stub it
    SVGElement.prototype.getBBox = vi.fn(() => ({ x: 0, y: 0, width: 100, height: 50 }));
  });

  it('places all state elements under a single <g id="…-root"> wrapper, not directly on <svg>', () => {
    // renderDoc uses Object.keys(getStates()), so return a plain object (not a Map)
    const diagObj = {
      db: {
        getRootDoc: () => [],
        getStates: () => ({
          State1: { id: 'State1', descriptions: [], doc: null },
          State2: { id: 'State2', descriptions: [], doc: null },
        }),
        getRelations: () => [],
      },
    };

    draw('stateDiagram\nState1\nState2', DIAGRAM_ID, '1.0.0', diagObj);

    const svg = document.getElementById(DIAGRAM_ID);

    // The SVG should have exactly one direct <g> child: the root wrapper
    const directGChildren = [...svg.children].filter((el) => el.tagName.toLowerCase() === 'g');
    expect(directGChildren).toHaveLength(1);
    expect(directGChildren[0].id).toBe(`${DIAGRAM_ID}-root`);

    // State nodes must live inside the wrapper, not on the SVG directly
    const rootWrapper = svg.querySelector(`g#${DIAGRAM_ID}-root`);
    expect(rootWrapper).not.toBeNull();
    expect(rootWrapper.querySelector('#State1')).not.toBeNull();
    expect(rootWrapper.querySelector('#State2')).not.toBeNull();
  });
});
