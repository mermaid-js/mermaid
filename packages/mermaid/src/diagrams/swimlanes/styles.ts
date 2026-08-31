import getFlowchartStyles from '../flowchart/styles.js';
import type { FlowChartStyleOptions } from '../flowchart/styles.js';

/**
 * Swimlanes reuses the flowchart styles and appends the lane-specific rule.
 *
 * As a "layout-variant diagram" (see `swimlanesDiagram.ts` and diagrams/CLAUDE.md),
 * swimlanes deliberately consumes flowchart's public `styles` export rather than
 * duplicating it — the one sanctioned exception to the cross-diagram isolation rule.
 *
 * The swimlane cluster shape draws its own lane border, so the generic
 * `.cluster rect` border is suppressed by matching its stroke to the cluster
 * background — theme-adaptive, rather than a hardcoded colour.
 *
 * Lanes carrying a palette slot are exempt: this rule is `!important` only to outrank
 * `[data-look="neo"].cluster rect`, which it ties with on specificity, and an
 * `!important` here would also outrank the per-lane palette rules the flowchart
 * stylesheet emits. Those already beat the neo rule on specificity, so they need no help
 * — they only need this one to stay out of their way. `data-color-id` is stamped only by
 * the themes that carry a palette, so every other theme keeps today's border exactly.
 */
const getStyles = (options: FlowChartStyleOptions): string =>
  `${getFlowchartStyles(options)}
  .swimlane.cluster:not([data-color-id]) rect {
    stroke: ${options.clusterBorder} !important;
  }
  [data-look="neo"].cluster rect {
    filter: none;
  }
`;

export default getStyles;
