/**
 * Structured diagnostics (guide §25). A stage that cannot complete faithfully
 * reports here and returns the best valid partial result — it never silently
 * falls back to a different algorithm.
 */

export const HOLA_DIAGNOSTIC_CODES = [
  'HOLA_SUBGRAPH_ENDPOINT_UNSUPPORTED',
  'HOLA_CONSTRAINT_INFEASIBLE',
  'HOLA_STRESS_DID_NOT_CONVERGE',
  'HOLA_CHAIN_SEQUENCE_NOT_FOUND',
  'HOLA_CORE_ROUTING_FAILED',
  'HOLA_CORE_SIDE_DIVERSITY_FAILED',
  'HOLA_PLANARISATION_NON_ORTHOGONAL_INPUT',
  'HOLA_DCEL_INVALID',
  'HOLA_TREE_LAYOUT_FAILED',
  'HOLA_TREE_PLACEMENT_FAILED',
  'HOLA_TREE_SLID_FROM_ROOT',
  'HOLA_FINAL_ROUTING_FAILED',
  'HOLA_NODE_CONFIG_TRUNCATED',
  'HOLA_CLOSED_CHAIN_CYCLE',
] as const;

export type HolaDiagnosticCode = (typeof HOLA_DIAGNOSTIC_CODES)[number];

export interface HolaDiagnostic {
  code: HolaDiagnosticCode;
  stage: string;
  message: string;
  componentId?: string;
  nodeIds?: string[];
  edgeIds?: string[];
  detail?: Record<string, unknown>;
}

export class DiagnosticCollector {
  private readonly entries: HolaDiagnostic[] = [];

  report(diagnostic: HolaDiagnostic): void {
    this.entries.push(diagnostic);
  }

  all(): HolaDiagnostic[] {
    return [...this.entries];
  }

  byCode(code: HolaDiagnosticCode): HolaDiagnostic[] {
    return this.entries.filter((d) => d.code === code);
  }

  get length(): number {
    return this.entries.length;
  }
}
