/**
 * Agentflow conformance runner — part 1 of issue #13.
 *
 * Drives a directory of paired `<case>-agentflow.mmd` +
 * `<case>-agentflow.expected.json` fixtures through the parser and the
 * diagnostic layer, comparing the actual outcome (`valid` / `warning` /
 * `error` / `parse-error`) and any observed diagnostics against the
 * expectations declared in JSON.
 *
 * Files use Mermaid's standard `.mmd` extension. The `-agentflow` suffix
 * identifies the diagram type so agentflow fixtures can share a
 * conformance root with other diagram types later without collisions.
 *
 * The runner is intentionally small: fixture format, parse + drive, match.
 * PR 5 fills the `fixtures/` directory with the full wave-1 corpus and
 * ports every example from `AGENTFLOW-SYNTAX.md`.
 *
 * Fixture format
 * --------------
 *
 * `<case>-agentflow.mmd` — the diagram source.
 *
 * `<case>-agentflow.expected.json`:
 *
 * ```json
 * {
 *   "outcome": "valid",        // "valid" | "warning" | "error" | "parse-error"
 *   "diagnostics": [           // optional; every listed diagnostic must be present
 *     {
 *       "id": "HEXAGON_MULTI_BRANCH",
 *       "nodeId": "h",          // optional
 *       "edgeId": "e1",         // optional
 *       "line": 2               // optional; matches `position.startLine`
 *     }
 *   ]
 * }
 * ```
 *
 * `diagnostics` is additive: an actual run may surface additional
 * diagnostics without failing, but every listed expectation must match at
 * least one actual entry. Strict-match mode can be added later via an
 * `exact: true` flag — not needed for wave-1.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import type { AgentflowDiagnostic } from '../diagnostics.js';
import agentflow from '../parser/agentflowParser.js';

export interface ExpectedDiagnostic {
  /** Message ID — must match `AgentflowDiagnostic.id`. */
  id: string;
  /** Optional nodeId constraint. */
  nodeId?: string;
  /** Optional edgeId constraint. */
  edgeId?: string;
  /** Optional source line (compared against `position.startLine`). */
  line?: number;
}

export interface FixtureExpectation {
  outcome: 'valid' | 'warning' | 'error' | 'parse-error';
  diagnostics?: ExpectedDiagnostic[];
}

export interface FixtureResult {
  outcome: 'valid' | 'warning' | 'error' | 'parse-error';
  diagnostics: readonly AgentflowDiagnostic[];
  /** Populated when the JISON parser threw. */
  parseError?: string;
}

/**
 * Parse a fixture's source, drive post-parse validators via `getData()`,
 * collect diagnostics, and classify the outcome.
 */
export function runFixture(source: string): FixtureResult {
  const db = new AgentFlowDB();
  agentflow.parser.yy = db;
  db.clear();
  db.setGen('gen-2');
  // Signal to Diagram.ts that we support inline positions. Here we call
  // setSourceText directly since we're bypassing the Diagram.fromText path.
  db.setSourceText(source);
  try {
    agentflow.parser.parse(source);
  } catch (err) {
    return {
      outcome: 'parse-error',
      diagnostics: [],
      parseError: err instanceof Error ? err.message : String(err),
    };
  }
  // Trigger post-parse validators (e.g. HEXAGON_MULTI_BRANCH).
  db.getData();
  const diagnostics = db.getDiagnostics();
  const outcome = classify(diagnostics);
  return { outcome, diagnostics };
}

function classify(diagnostics: readonly AgentflowDiagnostic[]): 'valid' | 'warning' | 'error' {
  if (diagnostics.some((d) => d.severity === 'error')) {
    return 'error';
  }
  if (diagnostics.some((d) => d.severity === 'warning')) {
    return 'warning';
  }
  return 'valid';
}

export interface MatchFailure {
  kind: 'outcome-mismatch' | 'missing-diagnostic';
  message: string;
}

/**
 * Compare a fixture result to its expectation. Returns an empty array on
 * success or a list of human-readable failure descriptions. The runner
 * passes this into the test assertion layer.
 */
export function matchExpected(result: FixtureResult, expected: FixtureExpectation): MatchFailure[] {
  const failures: MatchFailure[] = [];
  if (result.outcome !== expected.outcome) {
    const parseDetail =
      result.outcome === 'parse-error' && result.parseError
        ? ` (parse error: ${result.parseError})`
        : '';
    failures.push({
      kind: 'outcome-mismatch',
      message: `expected outcome "${expected.outcome}", got "${result.outcome}"${parseDetail}`,
    });
  }
  for (const expectedDiag of expected.diagnostics ?? []) {
    const found = result.diagnostics.some((actual) => diagnosticMatches(actual, expectedDiag));
    if (!found) {
      failures.push({
        kind: 'missing-diagnostic',
        message: `expected diagnostic ${describe(expectedDiag)} — none of the ${result.diagnostics.length} actual diagnostics matched`,
      });
    }
  }
  return failures;
}

function diagnosticMatches(actual: AgentflowDiagnostic, expected: ExpectedDiagnostic): boolean {
  if (actual.id !== expected.id) {
    return false;
  }
  if (expected.nodeId !== undefined && actual.nodeId !== expected.nodeId) {
    return false;
  }
  if (expected.edgeId !== undefined && actual.edgeId !== expected.edgeId) {
    return false;
  }
  if (expected.line !== undefined && actual.position?.startLine !== expected.line) {
    return false;
  }
  return true;
}

function describe(expected: ExpectedDiagnostic): string {
  const parts = [`id="${expected.id}"`];
  if (expected.nodeId !== undefined) {
    parts.push(`nodeId="${expected.nodeId}"`);
  }
  if (expected.edgeId !== undefined) {
    parts.push(`edgeId="${expected.edgeId}"`);
  }
  if (expected.line !== undefined) {
    parts.push(`line=${expected.line}`);
  }
  return `{ ${parts.join(', ')} }`;
}
