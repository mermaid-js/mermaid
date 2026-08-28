import * as khroma from 'khroma';
import { getIconStyles } from '../globalStyles.js';

/**
 * BPMN theme knobs.
 *
 * Every colour a BPMN shape is painted with comes from here, so a theme (or
 * `themeVariables.bpmn`) can retune the whole notation without touching this file.
 * The theme files supply the defaults; the `??` fallbacks below only matter for a
 * caller that hands `getStyles` a bare options bag.
 */
export interface BpmnThemeOptions {
  eventFill: string;
  eventStroke: string;
  eventStrokeWidth: string | number;
  endEventStroke: string;
  endEventStrokeWidth: string | number;
  gatewayFill: string;
  gatewayStroke: string;
  gatewayStrokeWidth: string | number;
  activityFill: string;
  activityStroke: string;
  activityStrokeWidth: string | number;
  glyphColor: string;
  dataFill: string;
  dataStroke: string;
  annotationStroke: string;
  laneFill: string;
  laneStroke: string;
  laneLabelColor: string;
  labelColor: string;
  edgeStroke: string;
  messageStroke: string;
}

export interface BpmnStyleOptions {
  bpmn?: Partial<BpmnThemeOptions>;
  edgeLabelBackground: string;
  fontFamily: string;
  lineColor: string;
  mainBkg: string;
  nodeBorder: string;
  nodeTextColor: string;
  tertiaryColor: string;
  textColor: string;
  titleColor: string;
  border2: string;
}

const fade = (color: string, opacity: number) => {
  // @ts-ignore TODO: incorrect types from khroma
  const channel = khroma.channel;

  const r = channel(color, 'r');
  const g = channel(color, 'g');
  const b = channel(color, 'b');

  // @ts-ignore incorrect types from khroma
  return khroma.rgba(r, g, b, opacity);
};

/**
 * Mermaid scopes every diagram stylesheet with the rendered svg's id (each rule is
 * emitted as `#mermaid-<n> <selector>`), so a page-level stylesheet can never win
 * against these rules. Anything a BPMN shape needs to look right has to be emitted
 * here.
 *
 * Note the `bpmn-event-<position>` classes sit on the *node group*, not on the ring,
 * hence `.node.bpmn-event-end circle.bpmn-event-ring` rather than a descendant
 * selector.
 */
const getStyles = (options: BpmnStyleOptions) => {
  const bpmn = options.bpmn ?? {};
  const eventFill = bpmn.eventFill ?? options.mainBkg;
  const eventStroke = bpmn.eventStroke ?? options.nodeBorder;
  const eventStrokeWidth = bpmn.eventStrokeWidth ?? 1.6;
  const endEventStroke = bpmn.endEventStroke ?? eventStroke;
  const endEventStrokeWidth = bpmn.endEventStrokeWidth ?? 3.4;
  const gatewayFill = bpmn.gatewayFill ?? options.mainBkg;
  const gatewayStroke = bpmn.gatewayStroke ?? options.nodeBorder;
  const gatewayStrokeWidth = bpmn.gatewayStrokeWidth ?? 1.6;
  const activityFill = bpmn.activityFill ?? options.mainBkg;
  const activityStroke = bpmn.activityStroke ?? options.nodeBorder;
  const activityStrokeWidth = bpmn.activityStrokeWidth ?? 1.6;
  const glyphColor = bpmn.glyphColor ?? options.textColor;
  const dataFill = bpmn.dataFill ?? eventFill;
  const dataStroke = bpmn.dataStroke ?? eventStroke;
  const annotationStroke = bpmn.annotationStroke ?? eventStroke;
  const laneFill = bpmn.laneFill ?? 'transparent';
  const laneStroke = bpmn.laneStroke ?? options.nodeBorder;
  const laneLabelColor = bpmn.laneLabelColor ?? options.titleColor;
  const labelColor = bpmn.labelColor ?? (options.nodeTextColor || options.textColor);
  const edgeStroke = bpmn.edgeStroke ?? options.lineColor;
  const messageStroke = bpmn.messageStroke ?? edgeStroke;

  return `.label {
    font-family: ${options.fontFamily};
    color: ${labelColor};
  }
  .label text,
  .label span {
    fill: ${labelColor};
    color: ${labelColor};
  }
  .node .label,
  .node .label text {
    text-align: center;
    text-anchor: middle;
  }
  .node.clickable {
    cursor: pointer;
  }

  /* The invisible box the shapes reserve for the layout must stay invisible even
     though it is a plain <rect> inside a .node. */
  .node rect.bpmn-bounds {
    fill: none;
    stroke: none;
  }

  /* ----- Events -------------------------------------------------------------
     A near-white disc with a thin dark ring; the end event keeps the same disc but
     carries the heavy ring that makes a process' terminus readable at a glance. */
  .node circle.bpmn-event-ring {
    fill: ${eventFill};
    stroke: ${eventStroke};
    stroke-width: ${eventStrokeWidth}px;
  }
  .node circle.bpmn-event-ring-inner {
    fill: none;
  }
  .node.bpmn-event-end circle.bpmn-event-ring {
    stroke: ${endEventStroke};
    stroke-width: ${endEventStrokeWidth}px;
  }
  .node.bpmn-event-boundary circle.bpmn-event-ring,
  .node.bpmn-event-intermediate circle.bpmn-event-ring {
    stroke-width: ${eventStrokeWidth}px;
  }

  /* ----- Gateways ----------------------------------------------------------- */
  .node polygon.bpmn-gateway-diamond {
    fill: ${gatewayFill};
    stroke: ${gatewayStroke};
    stroke-width: ${gatewayStrokeWidth}px;
    stroke-linejoin: round;
  }

  /* ----- Activities --------------------------------------------------------- */
  .node rect.bpmn-activity-rect {
    fill: ${activityFill};
    stroke: ${activityStroke};
    stroke-width: ${activityStrokeWidth}px;
  }

  /* ----- Data artifacts and annotations ------------------------------------- */
  .node .bpmn-data-page,
  .node .bpmn-store-body {
    fill: ${dataFill};
    stroke: ${dataStroke};
    stroke-width: 1.4px;
  }
  .node .bpmn-data-fold,
  .node .bpmn-store-rings,
  .node .bpmn-data-collection,
  .node .bpmn-data-arrow {
    fill: none;
    stroke: ${dataStroke};
    stroke-width: 1.4px;
  }
  .node .bpmn-data-arrow-input {
    fill: none;
  }
  .node .bpmn-data-arrow-output {
    fill: ${dataStroke};
  }
  .node .bpmn-annotation-bracket {
    fill: none;
    stroke: ${annotationStroke};
    stroke-width: 1.4px;
  }

  /* ----- Glyphs -------------------------------------------------------------
     The bpmn icon pack paints with currentColor, so setting the CSS color property
     is what tints a trigger glyph, a gateway marker and an activity corner icon. */
  .node .bpmn-glyph,
  .node .bpmn-activity-icon,
  .node .bpmn-activity-markers {
    color: ${glyphColor};
  }
  .node .bpmn-glyph svg,
  .node .bpmn-activity-icon svg,
  .node .bpmn-activity-markers svg {
    color: ${glyphColor};
  }
  .node .bpmn-activity-icon,
  .node .bpmn-activity-markers {
    opacity: 0.85;
  }

  /* ----- Pools and lanes ---------------------------------------------------- */
  .swimlane.cluster rect,
  .pool.cluster rect {
    fill: ${laneFill};
    stroke: ${laneStroke};
    stroke-width: 1px;
  }
  /* The lanes cover the pool's body. A lane paints its title band to fit its label,
     which can be narrower than the width the layout reserved, so a filled pool body
     would show as a sliver between the pool's band and the lane's. */
  .pool.cluster rect.pool-body {
    fill: none;
  }
  .cluster text,
  .cluster-label text {
    fill: ${laneLabelColor};
  }
  .cluster span,
  .cluster-label span {
    color: ${laneLabelColor};
  }
  .cluster-label span p {
    background-color: transparent;
  }
  [data-look='neo'].cluster rect {
    filter: none;
  }

  /* ----- Flows -------------------------------------------------------------- */
  /* An element selector, not a class one: these edges carry bpmn-flow classes and no
     class named "path", so .edgePaths .path silently matches nothing. */
  /* Mermaid paints a half-opaque plate behind a label so text stays legible over an
     edge. Inside a BPMN element that plate is a lighter rectangle on top of the
     element's own fill, which reads as a second box. */
  .node .labelBkg {
    background: transparent;
  }

  .edgePaths path {
    stroke: ${edgeStroke};
    stroke-width: 1.6px;
    /* An SVG path fills black by default, so any bend in a flow would paint a solid
       wedge between the line and its chord. */
    fill: none;
  }
  .flowchart-link {
    stroke: ${edgeStroke};
    fill: none;
  }
  .marker {
    fill: ${edgeStroke};
    stroke: ${edgeStroke};
  }
  .marker.openArrow,
  .marker.hollowCircle {
    fill: none;
    stroke: ${messageStroke};
  }
  .arrowheadPath {
    fill: ${edgeStroke};
  }

  .edgeLabel {
    background-color: ${options.edgeLabelBackground};
    text-align: center;
    p {
      background-color: ${options.edgeLabelBackground};
    }
    rect {
      opacity: 0.5;
      background-color: ${options.edgeLabelBackground};
      fill: ${options.edgeLabelBackground};
    }
  }
  /* For html labels only */
  .labelBkg {
    background-color: ${fade(options.edgeLabelBackground, 0.5)};
  }

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${options.fontFamily};
    font-size: 12px;
    background: ${options.tertiaryColor};
    border: 1px solid ${options.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .bpmnTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${options.textColor};
  }

  rect.text {
    fill: none;
    stroke-width: 0;
  }
  ${getIconStyles()}
`;
};

export default getStyles;
