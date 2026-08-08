import type { DiagramStylesProvider } from '../../diagram-api/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStyles = (options: any) => `
  /* Show only the icon and label: hide the rect the 'rect' shape draws.
     Annotation nodes have their own rule further down. */
  .domainstorytelling-node-container.actor, .domainstorytelling-node-container.workobject {
    fill: transparent !important;
    stroke: none !important;
    stroke-width: 0 !important;
  }
  
  /* Icon above label; one flex gap owns the icon→label distance (flex margins
     don't collapse, so per-element margins would stack). */
  .domainstorytelling-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
    height: 100%;
    width: 100%;
  }

  .domainstorytelling-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /* Iconify renders an inline <svg>, sized by the width/height attributes
     resolveIconSvgByName passes; the icon strokes use currentColor. */
  .domainstorytelling-icon svg {
    color: ${options.primaryTextColor ?? '#333'};
    display: block;
  }
  
  .domainstorytelling-label {
    font-family: ${options.fontFamily ?? 'Arial, sans-serif'};
    font-size: ${options.fontSize ?? '14px'};
    font-weight: 500;
    color: ${options.primaryTextColor ?? '#333'};
    text-align: center;
    line-height: 1.2;
    max-width: 70px;
    white-space: normal;
    overflow-wrap: normal;
    word-break: keep-all;
  }

  /* A hidden copy of the label above the icon, emitted by renderIconWithLabel
     for LR/RL only. Balancing the real label below makes the wrapper — and the
     node box measured from it — symmetric about the icon, so the left/right
     attachment points (at the box centre) land on the icon rather than on the
     icon→label gap. TB/BT attach top/bottom, where the spacer would only push
     those points further from the icon. Sizing the box from a real label copy,
     rather than lifting the label out of flow, keeps the label inside the box,
     where the layout still routes edges and sequence badges around it. */
  .domainstorytelling-label-mirror {
    visibility: hidden;
  }

  /* Different colors for actors vs workobjects. Override via the diagram
     header (themeVariables: { domainstorytellingActorColor: '#xxx', ... }). */
  .domainstorytelling-node-container.actor .domainstorytelling-icon svg {
    color: ${options.domainstorytellingActorColor};
  }

  .domainstorytelling-node-container.workobject .domainstorytelling-icon svg {
    color: ${options.domainstorytellingWorkobjectColor};
  }
  
  /* Don't clip the icon/label wrapper where it overflows the foreignObject box. */
  .domainstorytelling-node-container foreignObject {
    overflow: visible;
  }
  
  /* Sequence number circles. Stroke matches background so edges that cross
     under the circle get a clean "halo" gap. */
  .sequence-number-circle {
    fill: ${options.domainstorytellingSequenceColor};
    stroke: ${options.background ?? '#fff'};
    stroke-width: 2px;
  }
  
  .sequence-number-text {
    /* The circle is filled with domainstorytellingSequenceColor, so drawing the
       text in the page background keeps contrast in light and dark themes. */
    fill: ${options.background ?? '#fff'};
    font-weight: bold;
    text-anchor: middle;
    dominant-baseline: central;
    font-family: ${options.fontFamily ?? 'Arial, sans-serif'};
    font-size: 0.95em;
  }
  
  /* Edge styling */
  .domainstorytelling-link {
    stroke: ${options.lineColor ?? '#333'};
    stroke-width: 2px;
    fill: none;
  }

  .domainstorytelling-annotation-link {
    stroke: ${options.lineColor ?? '#666'};
    stroke-width: 1.5px;
    stroke-dasharray: 6 4;
    fill: none;
  }

  .domainstorytelling-annotation-content {
    position: relative;
    font-family: ${options.fontFamily ?? 'Arial, sans-serif'};
    font-size: 12px;
    line-height: 1.25;
    color: ${options.primaryTextColor ?? '#333'};
    /* Not decoration: sentence-annotation links are redrawn from the node CENTER
       (routeSentenceAnnotationLinksToSequenceNumbers), so this opaque box masks
       the dashed line where it runs under the text. background = assumed page
       color, as for the seq-circle halo and edge labels. */
    background: ${options.background ?? '#fff'};
    padding: 8px 10px;
    min-width: 110px;
    max-width: 180px;
    white-space: normal;
    word-break: break-word;
  }

  .domainstorytelling-annotation-content::before,
  .domainstorytelling-annotation-content::after {
    content: '';
    position: absolute;
    background: ${options.lineColor ?? '#333'};
  }

  .domainstorytelling-annotation-side-right {
    border-right: 2px solid ${options.lineColor ?? '#333'};
  }

  .domainstorytelling-annotation-side-right::before,
  .domainstorytelling-annotation-side-right::after {
    right: 0;
    width: 12px;
    height: 2px;
  }

  .domainstorytelling-annotation-side-right::before {
    top: 0;
  }

  .domainstorytelling-annotation-side-right::after {
    bottom: 0;
  }

  .domainstorytelling-annotation-side-left {
    border-left: 2px solid ${options.lineColor ?? '#333'};
  }

  .domainstorytelling-annotation-side-left::before,
  .domainstorytelling-annotation-side-left::after {
    left: 0;
    width: 12px;
    height: 2px;
  }

  .domainstorytelling-annotation-side-left::before {
    top: 0;
  }

  .domainstorytelling-annotation-side-left::after {
    bottom: 0;
  }

  .domainstorytelling-annotation-side-top {
    border-top: 2px solid ${options.lineColor ?? '#333'};
  }

  .domainstorytelling-annotation-side-top::before,
  .domainstorytelling-annotation-side-top::after {
    top: 0;
    width: 2px;
    height: 12px;
  }

  .domainstorytelling-annotation-side-top::before {
    left: 0;
  }

  .domainstorytelling-annotation-side-top::after {
    right: 0;
  }

  .domainstorytelling-annotation-side-bottom {
    border-bottom: 2px solid ${options.lineColor ?? '#333'};
  }

  .domainstorytelling-annotation-side-bottom::before,
  .domainstorytelling-annotation-side-bottom::after {
    bottom: 0;
    width: 2px;
    height: 12px;
  }

  .domainstorytelling-annotation-side-bottom::before {
    left: 0;
  }

  .domainstorytelling-annotation-side-bottom::after {
    right: 0;
  }

  /* Edge labels: the outer .edgeLabel is a positioned <g>, so paint the inner
     label instead — the background rect for SVG labels, the span for HTML ones. */
  .edgeLabel .label rect {
    fill: ${options.background ?? '#fff'};
  }

  .edgeLabel .label span {
    /* Block, not inline-block: the layout centres the wrapper div's box on the
       arrow, and that div's line-height (1.5 at the ambient font size, taller
       than these 0.8-sized labels) leaves an inline label sitting above the
       arrow in Firefox. As a block, the div's box is the label's own box. */
    display: block;
    background-color: ${options.background ?? '#fff'};
    padding: 1px 4px;
    border-radius: 1px;
    /* A step below the node label. Scaled from options.fontSize rather than a
       bare em, so an ambient font-size can't rebase it larger. */
    font-size: calc(${options.fontSize ?? '14px'} * 0.8);
    font-family: ${options.fontFamily ?? 'Arial, sans-serif'};
    line-height: 1.1;
    white-space: nowrap;
    color: ${options.primaryTextColor ?? '#333'};
  }

  .edgeLabel .label p {
    margin: 0;
  }

  /* insertEdgeLabel emits an outer .edgeLabel <g> for every edge, even with no
     label text (annotation links). The inner span carries .edgeLabel too, so
     this hides wrappers whose span is empty and would otherwise paint the
     padded background above onto the line. */
  .edgeLabel:has(.edgeLabel:empty) {
    display: none;
  }

  /* Group (cluster) container */
  .cluster.domainstorytelling-group rect {
    rx: 4px;
    ry: 4px;
    fill: transparent;
    stroke: ${options.domainstorytellingGroupColor ?? options.clusterBorder ?? options.nodeBorder ?? '#555'};
    stroke-width: 2px;
  }

  /* Annotation node container: transparent so only the inner HTML bracket shows. */
  .domainstorytelling-annotation-node rect {
    fill: transparent;
    stroke: none;
  }

  /* Group title label */
  .cluster.domainstorytelling-group .cluster-label {
    font-family: ${options.fontFamily ?? 'Arial, sans-serif'};
    font-size: 13px;
    font-weight: bold;
    fill: ${options.primaryTextColor ?? '#333'};
  }
`;

const styles: DiagramStylesProvider = (options) => getStyles(options);

export default styles;
