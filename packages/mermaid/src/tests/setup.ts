// Runs before every unit-test file (vite.config.ts `test.setupFiles`).
import { setLayeredThrowsOnFailure } from '../rendering-util/layout-algorithms/layered/failureMode.js';

// A layered failure falls back to dagre in production; under test it must fail the spec instead.
setLayeredThrowsOnFailure(true);
