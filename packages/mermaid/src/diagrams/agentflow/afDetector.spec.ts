import { describe, expect, it } from 'vitest';
import plugin from './afDetector.js';

const detects = (text: string) => plugin.detector(text, {});

describe('agentflow detector', () => {
  it.each([
    ['the bare keyword', 'agentflow TB\n  a --> b'],
    ['the bare keyword with no direction', 'agentflow\n  a --> b'],
    ['the bare keyword after leading whitespace', '\n  agentflow LR\n  a --> b'],
    ['the beta keyword', 'agentflow-beta TB\n  a --> b'],
    ['the beta keyword with no direction', 'agentflow-beta\n  a --> b'],
  ])('detects %s', (_name, text) => {
    expect(detects(text)).toBe(true);
  });

  it.each([
    ['a flowchart', 'flowchart TB\n  a --> b'],
    ['a longer word starting with the keyword', 'agentflows TB\n  a --> b'],
    ['an unknown suffix', 'agentflow-alpha TB\n  a --> b'],
    ['an underscore suffix', 'agentflow_beta TB\n  a --> b'],
    ['a flowchart with a node called agentflow', 'flowchart TB\n  agentflow --> b'],
  ])('does not detect %s', (_name, text) => {
    expect(detects(text)).toBe(false);
  });
});
