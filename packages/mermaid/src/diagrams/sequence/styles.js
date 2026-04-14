import { getConfig } from '../../diagram-api/diagramAPI.js';

const getStyles = (options) => {
  const dropShadow = options.dropShadow ?? 'none';
  const { look } = getConfig();

  return `.actor {
    stroke: ${options.actorBorder};
    fill: ${options.actorBkg};
    stroke-width: ${options.strokeWidth ?? 1};
  }

  rect.actor.outer-path[data-look="neo"] {
      filter: ${dropShadow};
  }

  rect.note[data-look="neo"] {
      stroke:${options.noteBorderColor};
      fill:${options.noteBkgColor};
      filter: ${dropShadow};
  }

  text.actor > tspan {
    fill: ${options.actorTextColor};
    stroke: none;
  }

  .actor-line {
    stroke: ${options.actorLineColor};
  }

  .innerArc {
    stroke-width: 1.5;
    stroke-dasharray: none;
  }

  .messageLine0 {
    stroke-width: 1.5;
    stroke-dasharray: none;
    stroke: ${options.signalColor};
  }

  .messageLine1 {
    stroke-width: 1.5;
    stroke-dasharray: 2, 2;
    stroke: ${options.signalColor};
  }

  [id$="-arrowhead"] path {
    fill: ${options.signalColor};
    stroke: ${options.signalColor};
  }

  .sequenceNumber {
    fill: ${options.sequenceNumberColor};
  }

  [id$="-sequencenumber"] {
    fill: ${options.signalColor};
  }

  [id$="-crosshead"] path {
    fill: ${options.signalColor};
    stroke: ${options.signalColor};
  }

  .messageText {
    fill: ${options.signalTextColor};
    stroke: none;
  }

  .labelBox {
    stroke: ${options.labelBoxBorderColor};
    fill: ${options.labelBoxBkgColor};
    filter: ${look === 'neo' ? dropShadow : 'none'};
  }

  .labelText, .labelText > tspan {
    fill: ${options.labelTextColor};
    stroke: none;
  }

  .loopText, .loopText > tspan {
    fill: ${options.loopTextColor};
    stroke: none;
  }

  .sectionTitle, .sectionTitle > tspan {
    fill: ${options.loopTextColor};
    stroke: none;
  }

  .loopLine {
    stroke-width: 2px;
    stroke-dasharray: 2, 2;
    stroke: ${options.labelBoxBorderColor};
    fill: ${options.labelBoxBorderColor};
  }

  .note {
    //stroke: #decc93;
    stroke: ${options.noteBorderColor};
    fill: ${options.noteBkgColor};
  }

  .noteText, .noteText > tspan {
    fill: ${options.noteTextColor};
    stroke: none;
    ${options.noteFontWeight ? `font-weight: ${options.noteFontWeight};` : ''}
  }

  .activation0 {
    fill: ${options.activationBkgColor};
    stroke: ${options.activationBorderColor};
  }

  .activation1 {
    fill: ${options.activationBkgColor};
    stroke: ${options.activationBorderColor};
  }

  .activation2 {
    fill: ${options.activationBkgColor};
    stroke: ${options.activationBorderColor};
  }

  .actorPopupMenu {
    position: absolute;
  }

  .actorPopupMenuPanel {
    position: absolute;
    fill: ${options.actorBkg};
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    filter: drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4));
}
  .actor-man circle, line {
    fill: ${options.actorBkg};
    stroke-width: 2px;
  }

  g rect.rect {
    filter: ${dropShadow};
    stroke: ${options.nodeBorder};
  }
`;
};

export default getStyles;
