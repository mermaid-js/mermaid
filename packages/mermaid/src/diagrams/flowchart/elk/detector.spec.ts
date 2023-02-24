import plugin from './detector';
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
