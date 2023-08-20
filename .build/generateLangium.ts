import { execSync } from 'child_process';

export function generateLangium() {
  execSync(`pnpm --prefix ${process.cwd()}/packages/parser exec langium generate`);
}
