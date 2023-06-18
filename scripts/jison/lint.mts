/* eslint-disable no-console */
import { readFile } from 'fs/promises';
import { globby } from 'globby';
import { ESLint } from 'eslint';
// @ts-ignore no typings
import jison from 'jison';

const linter = new ESLint({
  overrideConfig: { rules: { 'no-console': 'error' }, parser: '@typescript-eslint/parser' },
  useEslintrc: false,
});

const lint = async (file: string): Promise<boolean> => {
  console.log(`Linting ${file}`);
  const jisonCode = await readFile(file, 'utf8');
  // @ts-ignore no typings
  const generator = new jison.Generator(jisonCode, { moduleType: 'amd' });
  const jsCode = generator.generate();
  const [result] = await linter.lintText(jsCode);
  if (result.errorCount > 0) {
    console.error(`Linting failed for ${file}`);
    console.error(result.messages);
  }
  if (generator.conflicts > 0) {
    console.error(`Linting failed for ${file}. Conflicts found in grammar`);
    return false;
  }
  return result.errorCount === 0;
};

const main = async () => {
  const jisonFiles = await globby(['./packages/**/*.jison', '!./**/node_modules/**'], {
    dot: true,
  });
  const lintResults = await Promise.all(jisonFiles.map(lint));
  if (lintResults.includes(false)) {
    process.exit(1);
  }
};

void main();
