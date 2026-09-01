/**
 * Swimlanes reuse the flowchart parser, DB and renderer and differ only in the
 * layout engine, so `layout: swimlane` is the whole diagram type. It is declared
 * as the schema default for the `swimlane` config section rather than forced by
 * the diagram's `init` hook, which is what lets a user override reach it.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getConfig, reset, saveConfigFromInitialize, setSiteConfig } from '../../config.js';
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
  await mermaidAPI.parse(text);
  return getConfig().layout;
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
    // Forcing the layout from `init` used to override this too, so a user could
    // not move swimlanes onto another engine at all.
    mermaidAPI.initialize({ swimlane: { layout: 'dagre' } });
    expect(await layoutFor(SWIMLANE)).toBe('dagre');
  });

  it('keeps a layout set in the diagram frontmatter', async () => {
    expect(await layoutFor(`---\nconfig:\n  layout: dagre\n---\n${SWIMLANE}`)).toBe('dagre');
  });
});
