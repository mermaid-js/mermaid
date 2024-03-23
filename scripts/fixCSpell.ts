/**
 * Sorts all the `words` in the cSpell.json file.
 *
 * Run from the same folder as the `cSpell.json` file
 * (i.e. the root of the Mermaid project).
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const cSpellDictionaryDir = './.cspell';

function sortWordsInFile(filepath: string) {
  const words = readFileSync(filepath, 'utf8')
    .split('\n')
    .map((word) => word.trim())
    .filter((word) => word);
  words.sort((a, b) => a.localeCompare(b));

  writeFileSync(filepath, words.join('\n') + '\n', 'utf8');
}

function findDictionaries() {
  const files = readdirSync(cSpellDictionaryDir, { withFileTypes: true })
    .filter((dir) => dir.isFile())
    .filter((dir) => dir.name.endsWith('.txt'));
  return files.map((file) => join(cSpellDictionaryDir, file.name));
}

function main() {
  const files = findDictionaries();
  files.forEach(sortWordsInFile);
}

main();
