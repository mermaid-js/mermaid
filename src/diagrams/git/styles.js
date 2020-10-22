const getStyles = options =>
  `
  .commit-id,
  .commit-msg,
  .branch-label {
    fill: lightgrey;
    color: lightgrey;
    font-family: 'trebuchet ms', verdana, arial;
    font-family: var(--mermaid-font-family);
  }
  .branch {
    stroke-width: 10;
  }
  .branch0 { stroke: ${options.fillType0}; }
  .branch1 { stroke: ${options.fillType1}; }
  .branch2 { stroke: ${options.fillType2}; }
  .branch3 { stroke: ${options.fillType3}; }
  .branch4 { stroke: ${options.fillType4}; }
  .branch5 { stroke: ${options.fillType5}; }
  .branch6 { stroke: ${options.fillType6}; }
  .branch7 { stroke: ${options.fillType7}; }
`;

export default getStyles;
