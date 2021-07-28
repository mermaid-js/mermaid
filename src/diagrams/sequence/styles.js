const getStyles = (options) =>
  `.actor {
    stroke: ${options.actorBorder};
    fill: ${options.actorBkg};
  }

  text.actor > tspan {
    fill: ${options.actorTextColor};
    stroke: none;
  }

  .actor-line {
    stroke: ${options.actorLineColor};
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

  #arrowhead path {
    fill: ${options.signalColor};
    stroke: ${options.signalColor};
  }

  .sequenceNumber {
    fill: ${options.sequenceNumberColor};
  }

  #sequencenumber {
    fill: ${options.signalColor};
  }

  #crosshead path {
    fill: ${options.signalColor};
    stroke: ${options.signalColor};
  }

  .messageText {
    fill: ${options.signalTextColor};
    stroke: ${options.signalTextColor};
  }

  .labelBox {
    stroke: ${options.labelBoxBorderColor};
    fill: ${options.labelBoxBkgColor};
  }

  .labelText, .labelText > tspan {
    fill: ${options.labelTextColor};
    stroke: none;
  }

  .loopText, .loopText > tspan {
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
`;

export default getStyles;
