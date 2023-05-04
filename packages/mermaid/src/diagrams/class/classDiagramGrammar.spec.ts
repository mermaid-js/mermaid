import { readFile } from 'node:fs/promises';
// @ts-ignore - no types
import { LALRGenerator } from 'jison';
import path from 'path';

const getAbsolutePath = (relativePath: string) => {
  return new URL(path.join(path.dirname(import.meta.url), relativePath)).pathname;
};

describe('class diagram grammar', function () {
  it('should have no conflicts', async function () {
    const grammarSource = await readFile(getAbsolutePath('./parser/classDiagram.jison'), 'utf8');
    const grammarParser = new LALRGenerator(grammarSource, {});
    expect(grammarParser.conflicts).toBe(0);
  });
});
