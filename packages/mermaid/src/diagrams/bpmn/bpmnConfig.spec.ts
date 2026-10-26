import { beforeEach, describe, expect, it } from 'vitest';
import { saveConfigFromInitialize, setSiteConfig, reset } from '../../config.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { mermaidAPI } from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';
import defaultConfig from '../../defaultConfig.js';
import { BpmnDb } from './bpmnDb.js';

const PROCESS = 'bpmn-beta LR\n  lane "L"\n    start s "Start"\n    task t "Work"\n  s --> t';

describe('bpmn layout engine', () => {
  beforeEach(() => {
    addDiagrams();
    saveConfigFromInitialize({});
    setSiteConfig({});
    reset();
  });

  it('declares no layout of its own, because only the swimlane engine can draw pools', () => {
    expect(defaultConfig.bpmn).not.toHaveProperty('layout');
  });

  const LAYOUTS: [string, string | undefined, Record<string, unknown>][] = [
    ['a global layout', undefined, { layout: 'dagre' }],
    ['a bpmn layout', undefined, { bpmn: { layout: 'dagre' } }],
    ['a frontmatter layout', '---\nconfig:\n  layout: dagre\n---\n', {}],
  ];

  for (const [name, frontmatter, config] of LAYOUTS) {
    jsdomIt(`lays out through the swimlane engine whatever ${name} the user sets`, async () => {
      mermaidAPI.initialize(config);
      const bpmnDb = new BpmnDb();
      bpmnDb.parse(PROCESS);
      expect(bpmnDb.getData().layoutAlgorithm).toBe('swimlane');
      const { svg } = await mermaidAPI.render('bpmn-engine', `${frontmatter ?? ''}${PROCESS}`);
      expect(svg).toContain('bpmn-lane');
      expect(svg).toContain('bpmn-flow-sequence');
    });
  }

  jsdomIt('renders a straight flow between two events', async () => {
    const { svg } = await mermaidAPI.render('bpmn-config-render', PROCESS);
    expect(svg).toContain('<svg');
    expect(svg).toContain('bpmn-flow-sequence');
  });
});
