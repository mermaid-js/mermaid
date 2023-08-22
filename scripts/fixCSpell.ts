/**
 * Sorts all the `words` in the cSpell.json file.
 *
 * Run from the same folder as the `cSpell.json` file
 * (i.e. the root of the Mermaid project).
 */

import { readFile, writeFile } from 'node:fs/promises';
import prettier from 'prettier';

const main = async () => {
  const filepath = './cSpell.json';
  const cSpell: { words: string[] } = JSON.parse(await readFile(filepath, 'utf8'));

  cSpell.words = [...new Set(cSpell.words.map((word) => word.toLowerCase()))];
  cSpell.words.sort((a, b) => a.localeCompare(b));

  const prettierConfig = (await prettier.resolveConfig(filepath)) ?? {};
  await writeFile(
    filepath,
    await prettier.format(JSON.stringify(cSpell), {
      ...prettierConfig,
      filepath,
    }),
  );
};

void main();
