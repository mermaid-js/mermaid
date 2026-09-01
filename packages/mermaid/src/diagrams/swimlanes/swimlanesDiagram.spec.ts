/**
 * Swimlanes differ from flowcharts only in the layout engine, so `layout: swimlane` is the
 * diagram type. It is a schema default, not forced by `init`, so an override can reach it.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getConfig,
  reset,
  saveConfigFromInitialize,
  setDiagramConfigScope,
  setSiteConfig,
} from '../../config.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { mermaidAPI } from '../../mermaidAPI.js';

const SWIMLANE = 'swimlane-beta TD\n  A --> B';
const FLOWCHART = 'flowchart TD\n  A --> B';

const resetConfig = () => {
  saveConfigFromInitialize({});
  setSiteConfig({});
  reset();
};

const layoutFor = async (text: string) => {
  const { diagramType } = await mermaidAPI.parse(text);
  // Scope is bounded to the parse; re-establish it to read back the resolution it performed.
  setDiagramConfigScope(diagramType);
  const { layout } = getConfig();
  setDiagramConfigScope(undefined);
  return layout;
};

describe('swimlanesDiagram', () => {
  beforeEach(() => {
    addDiagrams();
    resetConfig();
  });
  afterEach(resetConfig);

  it('defaults the shared flowchart renderer to the swimlane layout', async () => {
    expect(await layoutFor(SWIMLANE)).toBe('swimlane');
  });

  it('leaves plain flowcharts on the global default layout', async () => {
    expect(await layoutFor(FLOWCHART)).toBe('dagre');
  });

  it('keeps an explicit global layout override', async () => {
    mermaidAPI.initialize({ layout: 'dagre' });
    expect(await layoutFor(SWIMLANE)).toBe('dagre');
  });

  it('keeps a diagram-scoped layout override', async () => {
    // `init` used to override this too, so swimlanes could not be moved off the engine.
    mermaidAPI.initialize({ swimlane: { layout: 'dagre' } });
    expect(await layoutFor(SWIMLANE)).toBe('dagre');
  });

  it('keeps a layout set in the diagram frontmatter', async () => {
    expect(await layoutFor(`---\nconfig:\n  layout: dagre\n---\n${SWIMLANE}`)).toBe('dagre');
  });
});
