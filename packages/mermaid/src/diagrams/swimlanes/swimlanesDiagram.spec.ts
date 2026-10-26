/**
 * Swimlanes differ from flowcharts only in the layout engine, so `layout: swimlane` is the
 * diagram type. It is a schema default, not forced by `init`, so an override can reach it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getConfig,
  reset,
  saveConfigFromInitialize,
  setDiagramConfigScope,
  setSiteConfig,
} from '../../config.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { log } from '../../logger.js';
import { mermaidAPI } from '../../mermaidAPI.js';
import { prepareLayoutForSwimlanes } from '../../rendering-util/layout-algorithms/swimlanes/helpers.js';
import { FlowDB } from '../flowchart/flowDb.js';
import flow from '../flowchart/parser/flowParser.js';

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
    expect(await layoutFor(FLOWCHART)).toBe('elk');
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

describe('swimlane-beta lanes that parse but cannot be drawn as written (issue #8386)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const prepared = (text: string) => {
    const flowDb = new FlowDB();
    flowDb.setGen('gen-2');
    flow.parser.yy = flowDb;
    flow.parser.parse(text);
    const layout = flowDb.getData();
    prepareLayoutForSwimlanes(layout);
    return layout;
  };
  const laneIds = (layout: ReturnType<typeof prepared>) =>
    layout.nodes.filter((node) => node.shape === 'swimlane').map((node) => node.id);

  it('draws a node listed in two lanes in the first one, without a stray empty lane', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);

    const layout = prepared(
      'swimlane-beta LR\nsubgraph lane1[Performer A]\n  a["step one"]\nend\nsubgraph phase1[Phase 1]\n  a\nend'
    );

    expect(laneIds(layout)).toEqual(['lane1']);
    expect(layout.nodes.find((node) => node.id === 'a')?.parentId).toBe('lane1');
    expect(warn).toHaveBeenCalledWith(
      'Swimlane node "a" is listed in lanes "lane1" and "phase1"; it is drawn in "lane1" only.'
    );
  });

  it('draws a node kept by a subgraph nested in a lane in that lane, without a stray empty lane', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);

    const layout = prepared(
      'swimlane-beta LR\nsubgraph lane1\n  subgraph inner\n    a\n  end\nend\nsubgraph lane2\n  a\nend'
    );

    expect(laneIds(layout)).toEqual(['lane1']);
    expect(layout.nodes.find((node) => node.id === 'inner')?.parentId).toBe('lane1');
    expect(warn).toHaveBeenCalledWith(
      'Swimlane node "a" is listed in lanes "lane1" and "lane2"; it is drawn in "lane1" only.'
    );
  });

  it('keeps a lane the author declared empty', () => {
    const layout = prepared('swimlane-beta LR\nsubgraph l1\n  a\nend\nsubgraph l2\nend');

    expect(laneIds(layout)).toEqual(['l2', 'l1']);
  });

  it('warns about a subgraph nested in a lane and still draws it', () => {
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);

    const layout = prepared(
      'swimlane-beta LR\nsubgraph lane1[Performer A]\n  subgraph ph1[Phase 1]\n    a["step one"]\n  end\nend'
    );

    expect(laneIds(layout)).toEqual(['lane1']);
    expect(layout.nodes.find((node) => node.id === 'ph1')?.parentId).toBe('lane1');
    expect(warn).toHaveBeenCalledWith(
      'Swimlane subgraph "ph1" is nested in "lane1"; only top-level subgraphs are lanes, so it is drawn as a plain box.'
    );
  });
});
