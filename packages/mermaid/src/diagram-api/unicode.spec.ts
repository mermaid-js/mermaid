// tests to check that comments are removed

import { describe, it, expect } from 'vitest';
import { replaceUnicodeTitlesWithVals } from './unicode.js';

const diagram = (symbol: string) =>
  `graph TD
	A-->B(${symbol})
`;

describe('unicode titles', () => {
  it('should replace uncode title with symbol', () => {
    expect(replaceUnicodeTitlesWithVals(diagram('u:u-flower'))).toMatchInlineSnapshot(
      `"${diagram('⚘')}"`
    );
  });
  it('should replace not presented uncode title with uppercased value', () => {
    expect(replaceUnicodeTitlesWithVals(diagram('u:u-not-presented'))).toMatchInlineSnapshot(
      `"${diagram('NOT PRESENTED')}"`
    );
  });
});
