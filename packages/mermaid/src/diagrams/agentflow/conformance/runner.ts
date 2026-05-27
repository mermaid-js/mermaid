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
 *   ],
 *   "semanticAssertions": {    // optional; wave-2 PR 5 addition
 *     "vertices": [
 *       { "id": "do_work", "vertexKind": "tool",
 *         "resolvedMetadata": { "returns": "OutputType" } }
 *     ],
 *     "edges": [
 *       { "start": "a", "end": "b", "edgeSemantic": "control" }
 *     ]
 *   }
 * }
 * ```
 *
 * `diagnostics` is additive: an actual run may surface additional
 * diagnostics without failing, but every listed expectation must match at
 * least one actual entry. Strict-match mode can be added later via an
 * `exact: true` flag — not needed for wave-1.
 *
 * `semanticAssertions` uses partial-subset matching: every listed
 * vertex/edge must exist in the semantic model, and every listed field
 * must match; unlisted vertices/edges/fields are ignored.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import type { AgentflowDiagnostic } from '../diagnostics.js';
import agentflow from '../parser/agentflowParser.js';
import { transformData } from '../transformData.js';
import type { LayoutData } from '../../../rendering-util/types.js';
import type { AgentflowSemanticModel } from '../types.js';

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

/**
 * Semantic-model assertion on a single vertex. `id` is required and must
 * match a `SemanticVertex.id`. Fields that are listed are checked; fields
 * that are omitted are not. `metadata` uses partial-subset matching —
 * each listed key must appear with the listed value, but the actual map
 * may carry additional keys.
 */
export interface ExpectedVertex {
  id: string;
  vertexKind?: 'tool' | 'action' | 'input' | 'refdoc' | 'decision' | 'task';
  /** Partial match: listed keys must equal, extras allowed. */
  metadata?: Record<string, unknown>;
}

/**
 * Semantic-model assertion on a single edge. Either both `start` and
 * `end` (for operator-keyed matching) or `id` (for author-assigned edge
 * ids) must be provided. `edgeSemantic` is the v0.8.1 §5.1 derived value.
 */
export interface ExpectedEdge {
  start?: string;
  end?: string;
  id?: string;
  edgeSemantic?: 'sequence' | 'reference' | 'failure';
}

export interface ExpectedSemanticAssertions {
  vertices?: ExpectedVertex[];
  edges?: ExpectedEdge[];
}

export interface FixtureExpectation {
  outcome: 'valid' | 'warning' | 'error' | 'parse-error';
  diagnostics?: ExpectedDiagnostic[];
  /**
   * Optional assertions against `getSemanticModel()` output. Every listed
   * vertex and edge must be present and every listed field must match;
   * unlisted vertices/edges/fields are not constrained.
   */
  semanticAssertions?: ExpectedSemanticAssertions;
}

export interface FixtureResult {
  outcome: 'valid' | 'warning' | 'error' | 'parse-error';
  diagnostics: readonly AgentflowDiagnostic[];
  /** Populated unless the JISON parser threw. */
  semanticModel?: AgentflowSemanticModel;
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
  // Trigger post-parse validators (e.g. HEXAGON_MULTI_BRANCH) and the
  // render-time shape validation (SHAPE_UNSUPPORTED). Both funnel into
  // the same diagnostic layer so fixtures can match either via `id`.
  const data = db.getData() as LayoutData;
  transformData(data, db);
  const diagnostics = db.getDiagnostics();
  const semanticModel = db.getSemanticModel();
  const outcome = classify(diagnostics);
  return { outcome, diagnostics, semanticModel };
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
  kind: 'outcome-mismatch' | 'missing-diagnostic' | 'semantic-mismatch';
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
  if (expected.semanticAssertions && result.semanticModel) {
    failures.push(...matchSemanticAssertions(result.semanticModel, expected.semanticAssertions));
  }
  return failures;
}

function matchSemanticAssertions(
  model: AgentflowSemanticModel,
  expected: ExpectedSemanticAssertions
): MatchFailure[] {
  const failures: MatchFailure[] = [];
  for (const expectedVertex of expected.vertices ?? []) {
    const actual = model.vertices.find((v) => v.id === expectedVertex.id);
    if (!actual) {
      failures.push({
        kind: 'semantic-mismatch',
        message: `expected vertex "${expectedVertex.id}" not found in semantic model`,
      });
      continue;
    }
    if (
      expectedVertex.vertexKind !== undefined &&
      actual.vertexKind !== expectedVertex.vertexKind
    ) {
      failures.push({
        kind: 'semantic-mismatch',
        message: `vertex "${expectedVertex.id}" expected vertexKind="${expectedVertex.vertexKind}" but got "${String(actual.vertexKind)}"`,
      });
    }
    if (expectedVertex.metadata !== undefined) {
      const actualMetadata = (actual.metadata as Record<string, unknown> | undefined) ?? {};
      for (const [key, expectedValue] of Object.entries(expectedVertex.metadata)) {
        const actualValue = actualMetadata[key];
        if (!deepEqual(actualValue, expectedValue)) {
          failures.push({
            kind: 'semantic-mismatch',
            message: `vertex "${expectedVertex.id}" metadata.${key} expected ${JSON.stringify(expectedValue)} but got ${JSON.stringify(actualValue)}`,
          });
        }
      }
    }
  }
  for (const expectedEdge of expected.edges ?? []) {
    const actual = model.edges.find((e) => edgeMatches(e, expectedEdge));
    if (!actual) {
      failures.push({
        kind: 'semantic-mismatch',
        message: `expected edge ${describeEdge(expectedEdge)} not found in semantic model`,
      });
      continue;
    }
    if (
      expectedEdge.edgeSemantic !== undefined &&
      actual.edgeSemantic !== expectedEdge.edgeSemantic
    ) {
      failures.push({
        kind: 'semantic-mismatch',
        message: `edge ${describeEdge(expectedEdge)} expected edgeSemantic="${expectedEdge.edgeSemantic}" but got "${String(actual.edgeSemantic)}"`,
      });
    }
  }
  return failures;
}

function edgeMatches(
  actual: AgentflowSemanticModel['edges'][number],
  expected: ExpectedEdge
): boolean {
  if (expected.id !== undefined) {
    return actual.id === expected.id;
  }
  if (expected.start !== undefined && actual.start !== expected.start) {
    return false;
  }
  if (expected.end !== undefined && actual.end !== expected.end) {
    return false;
  }
  return expected.start !== undefined || expected.end !== undefined;
}

function describeEdge(expected: ExpectedEdge): string {
  if (expected.id !== undefined) {
    return `{ id="${expected.id}" }`;
  }
  return `{ start="${expected.start ?? '?'}", end="${expected.end ?? '?'}" }`;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) {
      return false;
    }
    return ka.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
    );
  }
  return false;
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
