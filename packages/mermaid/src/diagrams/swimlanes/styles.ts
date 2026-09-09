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
 * The `!important` only outranks `[data-look="neo"].cluster rect`, which ties with it on
 * specificity. Palette lanes are exempt because it would beat them too.
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
