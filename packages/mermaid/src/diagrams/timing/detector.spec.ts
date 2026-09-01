import { describe, expect, it } from 'vitest';
import { timingDiagram } from './detector.js';

describe('timing diagram detector', () => {
  it('detects the beta keyword', () => {
    expect(timingDiagram.detector('timingDiagram-beta\n')).toBe(true);
    expect(timingDiagram.detector('  timingDiagram-beta\n')).toBe(true);
  });

  it('does not claim the unsuffixed or prefixed keyword', () => {
    expect(timingDiagram.detector('timingDiagram\n')).toBe(false);
    expect(timingDiagram.detector('timingDiagram-beta-extra\n')).toBe(false);
  });
});
