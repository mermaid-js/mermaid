const getStyles = (options) => `

  marker {
    fill: ${options.relationColor};
    stroke: ${options.relationColor};
  }

  marker.cross {
    stroke: ${options.lineColor};
  }

  svg {
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize};
  }

  .reqBox {
    fill: ${options.requirementBackground};
    fill-opacity: 100%;
    stroke: ${options.requirementBorderColor};
    stroke-width: ${options.requirementBorderSize};
  }
  
  .reqTitle, .reqLabel{
    fill:  ${options.requirementTextColor};
  }
  .reqLabelBox {
    fill: ${options.relationLabelBackground};
    fill-opacity: 100%;
  }

  .req-title-line {
    stroke: ${options.requirementBorderColor};
    stroke-width: ${options.requirementBorderSize};
  }
  .relationshipLine {
    stroke: ${options.relationColor};
    stroke-width: 1;
  }
  .relationshipLabel {
    fill: ${options.relationLabelColor};
  }

`;
// fill', conf.rect_fill)
export default getStyles;
