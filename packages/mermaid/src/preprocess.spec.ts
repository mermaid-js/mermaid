import { describe, expect, it } from 'vitest';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import { preprocessDiagram } from './preprocess.js';

addDiagrams();

describe('preprocessDiagram', () => {
  it('maps each line of the processed text to the source line it comes from', () => {
    const source = [
      '---',
      'title: x',
      '---',
      '%%{init: {"theme":"dark"}}%%',
      'pie',
      '%% note',
      '  "a": 1',
    ].join('\r\n');
    const { code } = preprocessDiagram(source);
    expect(code.withComments).toBe('\npie\n%% note\n  "a": 1');
    expect(code.withCommentsSourceLines).toEqual([4, 5, 6, 7]);
    expect(code.cleaned).toBe('pie\n  "a": 1');
    expect(code.cleanedSourceLines).toEqual([5, 7]);
  });
});
