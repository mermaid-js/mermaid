import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { getConfig as getConfigAPI } from '../../config.js';
import type { WardleyThemeVars } from './types.js';

export const buildWardleyStyleOptions = (wardley?: Partial<WardleyThemeVars>) => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();

  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);
  const wardleyOptions: WardleyThemeVars = cleanAndMerge(themeVariables.wardley, wardley);

  return { themeVariables, wardleyOptions };
};

const getStyles: DiagramStylesProvider = ({
  wardley,
}: { wardley?: Partial<WardleyThemeVars> } = {}) => {
  const { wardleyOptions: t } = buildWardleyStyleOptions(wardley);
  return `
  .wardleyDiagram {
    font-family: "trebuchet ms", verdana, arial, sans-serif;
  }

  /* Evolution stage backgrounds */
  .wardleyDiagram .evolution-stage-genesis { fill: ${t.stageBackground0}; }
  .wardleyDiagram .evolution-stage-custom { fill: ${t.stageBackground1}; }
  .wardleyDiagram .evolution-stage-product { fill: ${t.stageBackground2}; }
  .wardleyDiagram .evolution-stage-commodity { fill: ${t.stageBackground3}; }

  /* Component circle styles */
  .wardleyDiagram circle.component {
    stroke: ${t.componentStroke};
    stroke-width: 0.8px;
    opacity: 0.9;
  }
  .wardleyDiagram circle.component:hover {
    filter: brightness(1.1);
    cursor: pointer;
  }

  /* Anchor component (square) */
  .wardleyDiagram rect.anchor-component {
    stroke: ${t.componentStroke};
    stroke-width: 1px;
    opacity: 0.9;
  }

  /* Market component (double circle) */
  .wardleyDiagram circle.market-outer {
    stroke: ${t.componentStroke};
    stroke-width: 0.8px;
    fill: none;
  }

  /* Ecosystem component */
  .wardleyDiagram circle.ecosystem-outer {
    stroke: ${t.componentStroke};
    stroke-width: 0.5px;
    fill: none;
  }

  /* Pipeline */
  .wardleyDiagram rect.pipeline {
    fill: ${t.pipelineFill};
    stroke: ${t.componentStroke};
    stroke-width: 0.8px;
    opacity: 0.7;
  }

  /* Inertia indicator */
  .wardleyDiagram rect.inertia-bar {
    fill: ${t.inertiaColor};
  }

  /* Axis lines */
  .wardleyDiagram line.axis {
    stroke: ${t.axisColor};
    stroke-width: 1px;
  }

  /* Text and labels */
  .wardleyDiagram text {
    font-size: 12px;
    font-family: "trebuchet ms", verdana, arial, sans-serif;
    fill: ${t.textColor};
    pointer-events: none;
  }

  .wardleyDiagram .component-label {
    font-weight: 600;
    font-size: 9px;
    pointer-events: none;
  }

  .wardleyDiagram text.wardleyTitle {
    font-size: 18px;
    font-weight: bold;
  }

  .wardleyDiagram .stage-label {
    font-size: 11px;
    font-weight: bold;
    fill: ${t.axisColor};
    opacity: 0.7;
  }

  .wardleyDiagram .axis-label {
    font-size: 12px;
    font-weight: bold;
    fill: ${t.axisColor};
  }

  /* Label backgrounds */
  .wardleyDiagram rect.label-background {
    fill: ${t.labelBackground};
    stroke: ${t.labelBorder};
    stroke-width: 0.5px;
    opacity: 0.9;
    rx: 3;
  }

  /* Edge/dependency lines */
  .wardleyDiagram path.dependency {
    fill: none;
    stroke: ${t.edgeColor};
    stroke-width: 1px;
    opacity: 0.5;
  }

  /* Flow links */
  .wardleyDiagram path.flow-link {
    fill: none;
    stroke: ${t.flowColor};
    stroke-width: 1.5px;
    stroke-dasharray: 6 3;
    opacity: 0.7;
  }

  /* Constraint links */
  .wardleyDiagram path.constraint-link {
    fill: none;
    stroke: ${t.constraintColor};
    stroke-width: 2.5px;
    opacity: 0.6;
  }

  /* Evolve arrows */
  .wardleyDiagram path.evolve-arrow {
    fill: none;
    stroke: ${t.evolveArrowColor};
    stroke-width: 1.5px;
    stroke-dasharray: 5 3;
    opacity: 0.8;
  }

  /* Future components */
  .wardleyDiagram circle.future-component {
    stroke: ${t.evolveArrowColor};
    stroke-width: 1px;
    stroke-dasharray: 3 2;
    fill: ${t.evolveArrowColor};
    fill-opacity: 0.2;
  }

  /* Arrow markers */
  .wardleyDiagram marker polygon {
    fill-opacity: 1;
  }

  /* Notes */
  .wardleyDiagram .note-text {
    font-size: 10px;
    font-style: italic;
    fill: ${t.textColor};
    opacity: 0.8;
  }

  .wardleyDiagram rect.note-background {
    fill: ${t.labelBackground};
    stroke: ${t.labelBorder};
    stroke-width: 0.5px;
    stroke-dasharray: 3 2;
    opacity: 0.85;
    rx: 3;
  }

  /* Annotations */
  .wardleyDiagram .annotation-number {
    font-size: 10px;
    font-weight: bold;
    fill: ${t.evolveArrowColor};
  }

  .wardleyDiagram .annotation-text {
    font-size: 9px;
    fill: ${t.textColor};
    opacity: 0.8;
  }

  /* Area overlays */
  .wardleyDiagram rect.area-overlay {
    stroke-dasharray: 5 3;
    stroke-width: 1px;
    opacity: 0.15;
  }
  .wardleyDiagram .area-label {
    font-size: 10px;
    font-weight: bold;
    opacity: 0.5;
  }

  /* Submap */
  .wardleyDiagram rect.submap {
    stroke: ${t.componentStroke};
    stroke-width: 1px;
    fill: ${t.labelBackground};
  }

  /* Sourcing badges */
  .wardleyDiagram text.sourcing-badge {
    font-size: 7px;
    font-weight: bold;
    text-anchor: middle;
    dominant-baseline: central;
  }

  /* Responsive adjustments */
  @media (max-width: 600px) {
    .wardleyDiagram text { font-size: 10px; }
    .wardleyDiagram .component-label { font-size: 8px; }
  }
`;
};

export default getStyles;
