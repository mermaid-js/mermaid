import { beforeEach, describe, expect, it } from 'vitest';
import {
  getConfig,
  saveConfigFromInitialize,
  setDiagramConfigScope,
  setSiteConfig,
  reset,
} from '../../config.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { mermaidAPI } from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';

const PROCESS = 'bpmn-beta LR\n  lane "L"\n    start s "Start"\n    task t "Work"\n  s --> t';

/** The config the renderer is handed for `text`, read back the way `config.appearance.spec.ts` does. */
const configFor = async (text: string) => {
  const { diagramType } = await mermaidAPI.parse(text);
  setDiagramConfigScope(diagramType);
  const config = getConfig();
  setDiagramConfigScope(undefined);
  return config;
};

describe('bpmn layout resolution', () => {
  beforeEach(() => {
    addDiagrams();
    saveConfigFromInitialize({});
    setSiteConfig({});
    reset();
  });

  it('lays out through the swimlane engine by default', async () => {
    expect((await configFor(PROCESS)).layout).toBe('swimlane');
    // The default is the diagram's own, not the global one.
    expect((await configFor('flowchart TD\n  A --> B')).layout).not.toBe('swimlane');
  });

  it('lets a layout the user set globally win', async () => {
    mermaidAPI.initialize({ layout: 'dagre' });
    expect((await configFor(PROCESS)).layout).toBe('dagre');
  });

  it('lets a layout the user set for bpmn alone win, without touching other types', async () => {
    mermaidAPI.initialize({ bpmn: { layout: 'dagre' } });
    expect((await configFor(PROCESS)).layout).toBe('dagre');
    expect((await configFor('flowchart TD\n  A --> B')).layout).not.toBe('dagre');
  });

  it('lets frontmatter win over everything', async () => {
    mermaidAPI.initialize({ layout: 'dagre' });
    const config = await configFor(`---\nconfig:\n  layout: elk\n---\n${PROCESS}`);
    expect(config.layout).toBe('elk');
  });

  // The painter clips a flow to the shape it meets by asking `getConfig().layout`, and a
  // straight two-point flow has no interior points for the non-swimlane clipping to keep.
  jsdomIt('renders a straight flow between two events', async () => {
    const { svg } = await mermaidAPI.render('bpmn-config-render', PROCESS);
    expect(svg).toContain('<svg');
    expect(svg).toContain('bpmn-flow-sequence');
  });
});
