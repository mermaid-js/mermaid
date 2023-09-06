import type { ParseResult } from 'langium';
import { expect, vi } from 'vitest';

const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

/**
 * A helper test function that validate that the result doesn't have errors
 * or any ambiguous alternatives from chevrotain.
 *
 * @param result - the result `parse` function.
 */
export function noErrorsOrAlternatives(result: ParseResult) {
  expect(result.lexerErrors).toHaveLength(0);
  expect(result.parserErrors).toHaveLength(0);

  expect(consoleMock).not.toHaveBeenCalled();
  consoleMock.mockReset();
}
