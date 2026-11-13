import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { Diagram } from '../../Diagram.js';
import { preprocessDiagram } from '../../preprocess.js';
import { BpmnDb } from './bpmnDb.js';

const PROCESS = 'bpmn-beta LR\n  lane "L"\n    task t "T"';

/** Parses `text` the way `mermaid.render` does: front matter first, then the diagram. */
const titleOf = async (text: string) => {
  const { code, title } = preprocessDiagram(text);
  const diagram = await Diagram.fromText(code, { title });
  if (!(diagram.db instanceof BpmnDb)) {
    throw new TypeError('expected a bpmn diagram');
  }
  return diagram.db.getDiagramTitle();
};

describe('bpmn diagram title', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it('keeps the title the front matter sets', async () => {
    expect(await titleOf(`---\ntitle: Orders\n---\n${PROCESS}`)).toBe('Orders');
  });

  it('takes the title statement of the diagram itself', async () => {
    expect(await titleOf(`bpmn-beta LR\n  title Returns\n  lane "L"\n    task t "T"`)).toBe(
      'Returns'
    );
  });

  it('has no title when neither sets one', async () => {
    expect(await titleOf(PROCESS)).toBe('');
  });
});
