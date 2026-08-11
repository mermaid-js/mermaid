import type { LayoutData } from '../../../types.js';
import type { OrthogonalOptions } from '../types.js';
import { analyzeGraph } from '../analyzeGraph.js';
import { preferAxisForVerticalFlowNudges } from '../core/direction.js';

// Re-export OrthogonalOptions for consumers (e.g. context.spec.ts).
export type { OrthogonalOptions };

export interface OrthoPipelineContext {
  analysis: ReturnType<typeof analyzeGraph>;
  shouldHardenPorts: boolean;
  hasGroups: boolean;
  requestedBackend: NonNullable<OrthogonalOptions['routingBackend']>;
  backend: NonNullable<OrthogonalOptions['routingBackend']>;
  spacing: number;
  direction?: string;
  preferAxisForVerticalFlow?: 'x';
}

export function buildOrthoPipelineContext(
  data: LayoutData,
  options: OrthogonalOptions
): OrthoPipelineContext {
  const analysis = analyzeGraph(data);
  const shouldHardenPorts =
    analysis.hasCycle ||
    analysis.antiParallelPairs.length > 0 ||
    analysis.multiEdgeGroups.length > 0;

  const hasGroups = (data.nodes ?? []).some((n: any) => n?.isGroup);
  const requestedBackend = (options.routingBackend ?? 'aligned') as NonNullable<
    OrthogonalOptions['routingBackend']
  >;

  // iter-27: default-on promotion of `allowDomusWithGroups`. By default the
  // DOMUS backend now handles cluster fixtures; callers can still opt OUT
  // with explicit `allowDomusWithGroups: false` (preserved as escape hatch
  // for regression triage). Leaves flow through SAT/drawability; groups are
  // excluded from the DOMUS input (`conversion.ts:26`) and get their
  // rectangles sized from children's bbox via `preprocessClusters`, run at
  // the DOMUS backend entry.
  //
  // Paper background (iter-26 diagnostic via `cluster-fixtures.ddlt.spec.ts`):
  // on real Mermaid cluster fixtures (including compound edges), DOMUS-native
  // produces identical validateLayout issue profiles to the routing-graph
  // fallback. The paper's `c_t / c_b / uc_l^i / uc_r^i` boundary vertex
  // machinery (Siebenhaller §3) is specific to Kandinsky-style Sugiyama
  // pipelines; Mermaid's router handles both regular cluster-crossing and
  // compound edges the same way (through the cluster rectangle as obstacle),
  // so that machinery isn't needed for parity.
  const allowDomusWithGroups = options.allowDomusWithGroups !== false;
  const backend =
    hasGroups && requestedBackend === 'domus' && !allowDomusWithGroups
      ? 'routing-graph'
      : requestedBackend;

  const spacing = options.spacing ?? 10;
  const directionRaw = (data as any)?.direction;
  const direction =
    typeof directionRaw === 'string' && directionRaw.trim() ? directionRaw.trim() : undefined;
  // R11 / iter-13: gate direction-derived nudger axis preference on the
  // explicit opt-in flag. Default off keeps nudgers axis-neutral so that
  // A2 (`data.direction` propagation from FlowDB.getData()) doesn't
  // re-introduce the Company-simp regression iter-3 hit. Mermaid product
  // code that wants vertical-layering preservation passes
  // `respectFlowDirectionInNudges: true`.
  const preferAxisForVerticalFlow = options.respectFlowDirectionInNudges
    ? preferAxisForVerticalFlowNudges(direction)
    : undefined;

  return {
    analysis,
    shouldHardenPorts,
    hasGroups,
    requestedBackend,
    backend,
    spacing,
    direction,
    preferAxisForVerticalFlow,
  };
}
