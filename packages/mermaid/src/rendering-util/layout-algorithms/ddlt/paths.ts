import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo-root `e2e/platform/dev-diagrams/layout-tests` directory. */
export function layoutTestsDir(): string {
  return join(__dirname, '../../../../../../e2e/platform/dev-diagrams/layout-tests');
}
