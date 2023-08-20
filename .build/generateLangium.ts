import { execFileSync } from 'child_process';

export function generateLangium() {
  execFileSync('pnpm', [
    '--prefix',
    `${process.cwd()}/packages/parser`,
    'exec',
    'langium',
    'generate',
  ]);
}
