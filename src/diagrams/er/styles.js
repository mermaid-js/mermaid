const getStyles = options =>
  `
  .entityBox {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
  }

  .relationshipLabelBox {
    fill: ${options.edgeLabelBackground};
    fillopactity: 0;
    background-color: ${options.edgeLabelBackground};
      rect {
        opacity: 0.5;
      }
  }

    .relationshipLine {
      stroke: ${options.lineColor};
    }
`;

export default getStyles;
