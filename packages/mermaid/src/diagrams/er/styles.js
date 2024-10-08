const getStyles = (options) =>
  `
  .entityBox {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
  }

  .attributeBoxOdd {
    fill: ${options.attributeBackgroundColorOdd};
    stroke: ${options.nodeBorder};
  }

  .attributeBoxEven {
    fill:  ${options.attributeBackgroundColorEven};
    stroke: ${options.nodeBorder};
  }

  .relationshipLabelBox {
    fill: ${options.tertiaryColor};
    opacity: 0.7;
    background-color: ${options.tertiaryColor};
      rect {
        opacity: 0.5;
      }
  }

  .edgeLabel .label {
    fill: ${options.nodeBorder};
    font-size: 14px;
  }

  .edgeLabel .label .labelBkg {
    background: ${options.mainBkg};
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
    stroke-width: 1px;
  }

  .relationshipLine {
    stroke: ${options.lineColor};
    stroke-width: 1;
    fill: none;
  }

  .marker {
    fill: none !important;
    stroke: ${options.lineColor} !important;
    stroke-width: 1;
  }

  .entityTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${options.textColor};
  }    
  #MD_PARENT_START {
    fill: #f5f5f5 !important;
    stroke: ${options.lineColor} !important;
    stroke-width: 1;
  }
  #MD_PARENT_END {
    fill: #f5f5f5 !important;
    stroke: ${options.lineColor} !important;
    stroke-width: 1;
  }
  
`;

export default getStyles;
