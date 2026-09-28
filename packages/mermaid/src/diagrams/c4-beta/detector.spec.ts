import { describe, expect, it } from 'vitest';
import c4beta from './detector.js';

describe('c4-beta detector', () => {
  it.each(['c4-beta context', '  c4-beta deployment', 'c4-beta\nperson a "A"', 'c4-beta'])(
    'claims %j',
    (text) => {
      expect(c4beta.detector(text, undefined as never)).toBe(true);
    }
  );

  it.each(['c4-betamax context', 'c4-betaCustom', 'c4beta context', 'c4Context'])(
    'leaves %j to another detector',
    (text) => {
      expect(c4beta.detector(text, undefined as never)).toBe(false);
    }
  );
});
