import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
// @ts-ignore - no types
import { LALRGenerator } from 'jison';

const getAbsolutePath = (relativePath: string) => {
  return fileURLToPath(new URL(relativePath, import.meta.url));
};

describe('class diagram grammar', function () {
  it('should have no conflicts', async function () {
    const grammarSource = await readFile(getAbsolutePath('parser/classDiagram.jison'), 'utf8');
    const grammarParser = new LALRGenerator(grammarSource, {});
    expect(grammarParser.conflicts).toBe(0);
  });
});
