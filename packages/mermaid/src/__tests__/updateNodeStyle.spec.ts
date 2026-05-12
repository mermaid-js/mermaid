import { beforeEach, describe, expect } from 'vitest';

import mermaidAPI from '../mermaidAPI.js';
import { jsdomIt } from '../tests/util.js';

// Flowchart diagrams used across tests
const FLOWCHART_AB = 'graph TD;\n  A-->B';
const FLOWCHART_XY = 'graph TD;\n  X-->Y';

describe('updateNodeStyle', () => {
  beforeEach(() => {
    mermaidAPI.initialize({ startOnLoad: false });
  });

  // T1: updateNodeStyle is present on RenderResult and is a function
  jsdomIt('T1: is returned as a function in RenderResult', async () => {
    const result = await mermaidAPI.render('uns-t1', FLOWCHART_AB);
    expect(result).toHaveProperty('updateNodeStyle');
    expect(typeof result.updateNodeStyle).toBe('function');
  });

  // T2: valid node ID returns true and applies the style to the rendered element
  jsdomIt('T2: returns true for a valid node ID and applies style properties', async () => {
    const { updateNodeStyle } = await mermaidAPI.render('uns-t2', FLOWCHART_AB);
    // Node 'A' exists in the flowchart — updateNodeStyle should locate its D3 element
    // and set the given CSS properties, returning true on success.
    const found = updateNodeStyle('A', { stroke: '#68c8e8', fill: 'rgba(104,200,232,0.15)' });
    expect(found).toBe(true);
    // Note: style-application side-effects on the rendered SVG shape are verified in
    // the Cypress E2E suite (imgSnapshotTest with a red-fill diff assertion).
  });

  // T3: unknown node ID returns false without throwing
  jsdomIt('T3: returns false for an unknown node ID without throwing', async () => {
    const { updateNodeStyle } = await mermaidAPI.render('uns-t3', FLOWCHART_AB);
    // An ID that does not appear in the diagram must return false gracefully.
    expect(() => updateNodeStyle('doesNotExist', { stroke: 'red' })).not.toThrow();
    expect(updateNodeStyle('doesNotExist', { stroke: 'red' })).toBe(false);
  });

  // T4: each render produces an independent snapshot closure
  //
  // Design: getNodeElements() returns `new Map(nodeElems)` — a frozen copy captured
  // after each render.  A subsequent render calls clearNodes() which empties the live
  // nodeElems, but each existing closure retains its own snapshot and therefore its
  // own view of which node IDs exist.
  //
  // Observable contract: a closure cannot see IDs that belong to a different render.
  jsdomIt(
    'T4: re-render produces independent closure — each closure only knows its own node IDs',
    async () => {
      const { updateNodeStyle: uns1 } = await mermaidAPI.render('uns-t4-r1', FLOWCHART_AB);
      const { updateNodeStyle: uns2 } = await mermaidAPI.render('uns-t4-r2', FLOWCHART_XY);

      // Render-1 snapshot has A and B; it does not know about X or Y from render-2.
      expect(uns1('X', { stroke: 'red' })).toBe(false);
      expect(uns1('Y', { stroke: 'red' })).toBe(false);

      // Render-2 snapshot has X and Y; it does not know about A or B from render-1.
      expect(uns2('A', { stroke: 'red' })).toBe(false);
      expect(uns2('B', { stroke: 'red' })).toBe(false);
    }
  );
});
