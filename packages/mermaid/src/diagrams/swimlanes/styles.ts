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
/** Dash and gap, in px, of the line between two phase bands: dashed so it reads as a guide. */
const PHASE_SEPARATOR_DASH = '6 4';

const getStyles = (options: FlowChartStyleOptions): string =>
  `${getFlowchartStyles(options)}
  .swimlane.cluster:not([data-color-id]) rect {
    stroke: ${options.clusterBorder} !important;
  }
  [data-look="neo"].cluster rect {
    filter: none;
  }
  .swimlane-phase-title {
    fill: ${options.clusterBkg};
    stroke: ${options.clusterBorder};
  }
  .swimlane-phase-label {
    fill: ${options.titleColor};
    font-family: ${options.fontFamily};
    text-anchor: middle;
    dominant-baseline: central;
  }
  .swimlane-phase-separator {
    stroke: ${options.clusterBorder};
    stroke-dasharray: ${PHASE_SEPARATOR_DASH};
  }
`;

export default getStyles;
