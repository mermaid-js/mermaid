import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserDefinedConfig } from '../../config.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';
import { createFlowDiagram } from './flowDiagram.js';

// Spy getUserDefinedConfig + setConfig while keeping every other export real, so
// the renderer/parser imports that flowDiagram.ts pulls in still resolve.
// (vitest hoists vi.mock above the imports above.)
vi.mock('../../config.js', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, getUserDefinedConfig: vi.fn() };
});
vi.mock('../../diagram-api/diagramAPI.js', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, setConfig: vi.fn() };
});

/** The `layout` value passed to the (spied) setConfig during init, if any. */
function layoutSetByInit(): unknown {
  const call = vi.mocked(setConfig).mock.calls.find(([arg]) => arg != null && 'layout' in arg);
  return call?.[0]?.layout;
}

describe('createFlowDiagram init — layout precedence', () => {
  beforeEach(() => {
    vi.mocked(setConfig).mockClear();
    vi.mocked(getUserDefinedConfig).mockReturnValue({} as never);
  });

  it('a user-defined (%%{init}%%) layout wins over defaultLayout and site config', () => {
    vi.mocked(getUserDefinedConfig).mockReturnValue({ layout: 'elk' } as never);
    createFlowDiagram({ defaultLayout: 'swimlane' }).init?.({ layout: 'dagre' } as never);
    expect(layoutSetByInit()).toBe('elk');
  });

  it('defaultLayout (e.g. swimlane) wins over the site-config layout when no user override is set', () => {
    createFlowDiagram({ defaultLayout: 'swimlane' }).init?.({ layout: 'dagre' } as never);
    expect(layoutSetByInit()).toBe('swimlane');
  });

  it('falls back to the site-config layout when there is no user override and no defaultLayout', () => {
    createFlowDiagram().init?.({ layout: 'elk' } as never);
    expect(layoutSetByInit()).toBe('elk');
  });

  it('does not force a layout when none is set anywhere', () => {
    createFlowDiagram().init?.({} as never);
    expect(layoutSetByInit()).toBeUndefined();
  });
});
