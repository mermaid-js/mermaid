// Runs before every unit-test file (vite.config.ts `test.setupFiles`). Core's specs render
// diagrams that now live in their own packages, so register their detectors. This skips
// `registerExternalDiagrams`, which would also register core's own diagrams up front.
import { registerLazyLoadedDiagrams } from '@mermaid-js/core/diagram-api/detectType.js';
import { diagrams } from '../diagrams.js';

registerLazyLoadedDiagrams(...diagrams);
