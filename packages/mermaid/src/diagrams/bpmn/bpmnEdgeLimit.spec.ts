import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { reset, setSiteConfig } from '../../config.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import mermaid from '../../mermaid.js';

const DEFAULT_LIMIT = 500;

/** A chain of `flows` sequence flows in one lane. */
const bpmnChain = (flows: number) => {
  const tasks = Array.from({ length: flows + 1 }, (_, i) => `    task t${i} "T${i}"`);
  const links = Array.from({ length: flows }, (_, i) => `  t${i} --> t${i + 1}`);
  return ['bpmn-beta LR', '  lane "L"', ...tasks, ...links].join('\n');
};

/** The same number of links in a flowchart, whose limit check BPMN follows. */
const flowchartChain = (flows: number) =>
  ['flowchart LR', ...Array.from({ length: flows }, (_, i) => `  t${i} --> t${i + 1}`)].join('\n');

const errorOf = async (text: string): Promise<string | undefined> => {
  try {
    await mermaid.parse(text);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return undefined;
};

describe('the bpmn maxEdges limit', () => {
  beforeAll(() => {
    addDiagrams();
  });

  afterEach(() => {
    reset();
  });

  it('accepts as many flows as the default limit', async () => {
    expect(await errorOf(bpmnChain(DEFAULT_LIMIT))).toBeUndefined();
  });

  it('rejects one flow above the default limit, as a flowchart does', async () => {
    const message = await errorOf(bpmnChain(DEFAULT_LIMIT + 1));
    expect(message).toMatch(/^Edge limit exceeded\./);
    expect(message).toBe(await errorOf(flowchartChain(DEFAULT_LIMIT + 1)));
  });

  it('rejects any flow when maxEdges is 0, as a flowchart does', async () => {
    setSiteConfig({ maxEdges: 0 });
    const message = await errorOf(bpmnChain(1));
    expect(message).toMatch(/^Edge limit exceeded\. 0 edges found, but the limit is 0\./);
    expect(message).toBe(await errorOf(flowchartChain(1)));
  });

  it('takes a lower maxEdges from the site config', async () => {
    setSiteConfig({ maxEdges: 2 });
    expect(await errorOf(bpmnChain(2))).toBeUndefined();
    expect(await errorOf(bpmnChain(3))).toBe(await errorOf(flowchartChain(3)));
  });
});
