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
  const jisonCode = await readFile(file, 'utf8');
  // @ts-ignore no typings
  const jsCode = new jison.Generator(jisonCode, { moduleType: 'amd' }).generate();
  const [result] = await linter.lintText(jsCode);
  if (result.errorCount > 0) {
    console.error(`Linting failed for ${file}`);
    console.error(result.messages);
  }
  return result.errorCount === 0;
};

(async () => {
  const jisonFiles = await globby(['./src/**/*.jison'], { dot: true });
  const lintResults = await Promise.all(jisonFiles.map(lint));
  if (lintResults.some((result) => result === false)) {
    process.exit(1);
  }
})();
