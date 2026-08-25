import type { LayoutData } from '../../types.js';

/** Tunables for the Mermaid adaptation of IPSEP-COLA. */
export interface IpsepColaOptions {
  /** Minimum clear gap between two node borders on either axis. */
  nodeSpacing: number;
  /** Minimum clear gap between the borders of two nodes joined by an edge, along the flow axis. */
  rankSpacing: number;
  /** Target centre-to-centre distance for adjacent nodes. */
  idealEdgeLength: number;
  /** Cap on outer stress-majorisation iterations. */
  maxIterations: number;
  /** Converged once the relative stress improvement drops below this. */
  convergenceTolerance: number;
  /** Cap on QPSC descent iterations per axis pass. */
  maxQpscIterations: number;
  /** QPSC stops once a full iteration moves every variable less than this. */
  qpscTolerance: number;
  /**
   * When true, every edge contributes a separation constraint along the flow
   * axis, so the diagram's declared direction is respected exactly rather than
   * merely encouraged.
   */
  respectDirection: boolean;
  /** Margin kept between the laid-out content and the origin. */
  margin: number;
  /** Padding between a group's frame and its children's bounding box. */
  groupPadding: number;
  /**
   * Pull on a subgraph frame's two boundary variables, as a multiple of the
   * stress weight of a one-hop pair.
   *
   * The frame's containment constraints stop it shrinking past its contents, so
   * this only has to be non-zero: it is what makes the frame close back up when
   * a child moves inwards, rather than keeping the widest box it ever needed.
   */
  frameTightness: number;
}

export const DEFAULT_IPSEP_COLA_OPTIONS: IpsepColaOptions = {
  nodeSpacing: 50,
  rankSpacing: 50,
  idealEdgeLength: 120,
  maxIterations: 60,
  convergenceTolerance: 1e-4,
  maxQpscIterations: 40,
  qpscTolerance: 1e-3,
  respectDirection: true,
  margin: 8,
  groupPadding: 12,
  frameTightness: 1,
};

/**
 * Merge the diagram's flowchart spacing configuration (the same keys dagre
 * reads) with any explicit overrides.
 *
 * `idealEdgeLength` is derived from the measured nodes rather than configured:
 * the stress model's target distances are centre-to-centre, so they have to
 * grow with the node sizes or every edge asks for a length the nodes cannot
 * physically take.
 */
export function resolveIpsepColaOptions(
  data4Layout: LayoutData,
  overrides?: Partial<IpsepColaOptions>
): IpsepColaOptions {
  const config = data4Layout.config ?? {};
  const flowchart = config.flowchart ?? {};

  const nodeSpacing =
    (config as { nodeSpacing?: number }).nodeSpacing ??
    flowchart.nodeSpacing ??
    (data4Layout as { nodeSpacing?: number }).nodeSpacing ??
    DEFAULT_IPSEP_COLA_OPTIONS.nodeSpacing;

  const rankSpacing =
    (config as { rankSpacing?: number }).rankSpacing ??
    flowchart.rankSpacing ??
    (data4Layout as { rankSpacing?: number }).rankSpacing ??
    DEFAULT_IPSEP_COLA_OPTIONS.rankSpacing;

  const resolved: IpsepColaOptions = {
    ...DEFAULT_IPSEP_COLA_OPTIONS,
    nodeSpacing,
    rankSpacing,
    idealEdgeLength: deriveIdealEdgeLength(data4Layout, nodeSpacing, rankSpacing),
    ...overrides,
  };

  return resolved;
}

function deriveIdealEdgeLength(
  data4Layout: LayoutData,
  nodeSpacing: number,
  rankSpacing: number
): number {
  const sizes = (data4Layout.nodes ?? [])
    .filter((node) => !node.isGroup)
    .map((node) => Math.max(node.width ?? 0, node.height ?? 0))
    .filter((size) => size > 0);

  if (sizes.length === 0) {
    return DEFAULT_IPSEP_COLA_OPTIONS.idealEdgeLength;
  }

  const average = sizes.reduce((total, size) => total + size, 0) / sizes.length;
  return average + Math.max(nodeSpacing, rankSpacing);
}
