import { select } from 'd3';
import type { SVG } from '../../diagram-api/types.js';
import type { LayoutData } from '../../rendering-util/types.js';
import { drawFlowchartNotes } from './flowNoteRenderer.js';

describe('flowNoteRenderer', () => {
  it('draws positioned node notes above the rendered flowchart', () => {
    document.body.innerHTML = '<svg><g><g class="root"><g class="node"></g></g></g></svg>';
    const svgElement = document.querySelector('svg')!;
    const svg = select(svgElement) as unknown as SVG;
    const data4Layout = {
      nodes: [{ id: 'A', isGroup: false, x: 100, y: 80, width: 40, height: 30 }],
      edges: [],
      notes: [
        { position: 'right', target: 'A', text: 'right note' },
        { position: 'top', target: 'A', text: 'above' },
      ],
      config: {
        themeVariables: {
          fontFamily: 'Arial, sans-serif',
          textColor: '#111',
        },
      },
    } as LayoutData;

    drawFlowchartNotes(svg, data4Layout);

    const root = svgElement.querySelector('g.root')!;
    const notesLayer = root.lastElementChild!;
    expect(notesLayer.getAttribute('class')).toBe('flowchart-notes');

    const notes = notesLayer.querySelectorAll('g.flowchart-note');
    expect(notes).toHaveLength(2);
    expect(notes[0].getAttribute('data-target')).toBe('A');
    expect(notes[0].getAttribute('transform')).toBe('translate(120, 70.5)');
    expect(notes[1].getAttribute('transform')).toBe('translate(75, 46)');

    const background = notes[0].querySelector('rect.flowchart-note-background')!;
    expect(background.hasAttribute('fill')).toBe(false);
    expect(background.hasAttribute('stroke')).toBe(false);
    expect(Number(background.getAttribute('width'))).toBeGreaterThanOrEqual(50);
    expect(background.getAttribute('height')).toBe('19');
    expect(notes[0].querySelector('text.flowchart-note-text')?.hasAttribute('fill')).toBe(false);
    expect(notes[0].textContent).toBe('right note');
  });

  it('uses rendered SVG node positions when layout nodes have no coordinates', () => {
    document.body.innerHTML = `
      <svg>
        <g>
          <g class="root">
            <g class="nodes">
              <g class="node" id="diagram-flowchart-A-0" transform="translate(100, 80)"></g>
            </g>
          </g>
        </g>
      </svg>
    `;
    const renderedNode = document.querySelector<SVGGElement>('g.node')!;
    renderedNode.getBBox = vi.fn(() => ({
      x: -20,
      y: -15,
      width: 40,
      height: 30,
      top: -15,
      right: 20,
      bottom: 15,
      left: -20,
      toJSON: () => '',
    }));
    const svgElement = document.querySelector('svg')!;
    const svg = select(svgElement) as unknown as SVG;
    const data4Layout = {
      nodes: [{ id: 'A', isGroup: false, domId: 'diagram-flowchart-A-0' }],
      edges: [],
      notes: [{ position: 'right', target: 'A', text: 'right note' }],
      config: {
        themeVariables: {
          fontFamily: 'Arial, sans-serif',
          textColor: '#111',
        },
      },
    } as LayoutData;

    drawFlowchartNotes(svg, data4Layout);

    const note = svgElement.querySelector('g.flowchart-note')!;
    expect(note.getAttribute('transform')).toBe('translate(120, 70.5)');
    expect(note.textContent).toBe('right note');
  });

  it('skips notes whose target node is missing or not positioned', () => {
    document.body.innerHTML = '<svg><g><g class="root"></g></g></svg>';
    const svgElement = document.querySelector('svg')!;
    const svg = select(svgElement) as unknown as SVG;
    const data4Layout = {
      nodes: [{ id: 'A', isGroup: false }],
      edges: [],
      notes: [
        { position: 'right', target: 'A', text: 'not positioned' },
        { position: 'right', target: 'B', text: 'missing' },
      ],
      config: { themeVariables: {} },
    } as LayoutData;

    drawFlowchartNotes(svg, data4Layout);

    expect(svgElement.querySelectorAll('g.flowchart-note')).toHaveLength(0);
  });
});
