const getStyles = (options) =>
  `
  .node{
    stroke: ${options.pieStrokeColor};
    stroke-width : ${options.pieStrokeWidth};
    opacity : ${options.pieOpacity};
  }
`;
export default getStyles;
