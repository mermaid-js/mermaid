import plugin from './detector.js';
import { describe, it } from 'vitest';

const { detector } = plugin;

describe('flowchart-elk detector', () => {
  it('should fail for dagre-d3', () => {
    expect(
      detector('flowchart', {
        flowchart: {
          defaultRenderer: 'dagre-d3',
        },
      })
    ).toBe(false);
  });
  it('should fail for dagre-wrapper', () => {
    expect(
      detector('flowchart', {
        flowchart: {
          defaultRenderer: 'dagre-wrapper',
        },
      })
    ).toBe(false);
  });
  it('should succeed for elk', () => {
    expect(
      detector('flowchart', {
        flowchart: {
          defaultRenderer: 'elk',
        },
      })
    ).toBe(true);
    expect(
      detector('graph', {
        flowchart: {
          defaultRenderer: 'elk',
        },
      })
    ).toBe(true);
  });

  // The error from the issue was reproduced with mindmap, so this is just an example
  // what matters is the keyword somewhere inside graph definition
  it('should check only the beginning of the line in search of keywords', () => {
    expect(
      detector('mindmap ["Descendant node in flowchart"]', {
        flowchart: {
          defaultRenderer: 'elk',
        },
      })
    ).toBe(false)

    expect(
      detector('mindmap ["Descendant node in graph"]', {
        flowchart: {
          defaultRenderer: 'elk',
        },
      })
    ).toBe(false)
  });

  it('should detect flowchart-elk', () => {
    expect(detector('flowchart-elk')).toBe(true);
  });

  it('should not detect class with defaultRenderer set to elk', () => {
    expect(
      detector('class', {
        flowchart: {
          defaultRenderer: 'elk',
        },
      })
    ).toBe(false);
  });
});
