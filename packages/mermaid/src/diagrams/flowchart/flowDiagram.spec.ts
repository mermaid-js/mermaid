/**
 * `init` used to decide the layout; it no longer does, so that the schema resolution chain
 * is the only authority. The chain itself is covered by `config.appearance.spec.ts` and
 * `swimlanes/swimlanesDiagram.spec.ts`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { createFlowDiagram } from './flowDiagram.js';

// Spy setConfig while keeping every other export real, so the renderer/parser
// imports that flowDiagram.ts pulls in still resolve.
// (vitest hoists vi.mock above the imports above.)
vi.mock('../../diagram-api/diagramAPI.js', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, setConfig: vi.fn() };
});

/** The `layout` value passed to the (spied) setConfig during init, if any. */
function layoutSetByInit(): unknown {
  const call = vi.mocked(setConfig).mock.calls.find(([arg]) => arg != null && 'layout' in arg);
  return call?.[0]?.layout;
}

describe('createFlowDiagram init', () => {
  beforeEach(() => {
    vi.mocked(setConfig).mockClear();
  });

  it('does not force a layout, whatever the config already says', () => {
    createFlowDiagram().init?.({ layout: 'dagre' } as never);
    expect(layoutSetByInit()).toBeUndefined();
  });

  it('does not force a layout when none is set anywhere', () => {
    createFlowDiagram().init?.({} as never);
    expect(layoutSetByInit()).toBeUndefined();
  });

  it('still propagates arrowMarkerAbsolute into the flowchart config', () => {
    const cnf = { arrowMarkerAbsolute: true } as never as { flowchart?: Record<string, unknown> };
    createFlowDiagram().init?.(cnf as never);
    expect(cnf.flowchart?.arrowMarkerAbsolute).toBe(true);
    expect(vi.mocked(setConfig)).toHaveBeenCalledWith({
      flowchart: { arrowMarkerAbsolute: true },
    });
  });
});
