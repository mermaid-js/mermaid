const getStyles = (options) =>
  `
  .commit-id,
  .commit-msg,
  .branch-label {
    fill: lightgrey;
    color: lightgrey;
    font-family: 'trebuchet ms', verdana, arial, sans-serif;
    font-family: var(--mermaid-font-family);
  }
  .branch {
    stroke-width: 1;
    stroke: black;
    stroke-dasharray: 2;
  }
  .commit-labels { font-size: 10px; }
  .commit0 { stroke: ${options.git0}; fill: ${options.git0}; }
  .commit1 { stroke: ${options.git1}; fill: ${options.git1}; }
  .commit2 { stroke: ${options.git2}; fill: ${options.git2}; }
  .commit3 { stroke: ${options.git3}; fill: ${options.git3}; }
  .commit4 { stroke: ${options.git4}; fill: ${options.git4}; }
  .commit5 { stroke: ${options.git5}; fill: ${options.git5}; }
  .commit6 { stroke: ${options.git6}; fill: ${options.git6}; }
  .commit7 { stroke: ${options.git7}; fill: ${options.git7}; }

  .commit-merge {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
  }

  // .branch0 { stroke: ${options.git0}; }
  // .branch1 { stroke: ${options.git1}; }
  // .branch2 { stroke: ${options.git2}; }
  // .branch3 { stroke: ${options.git3}; }
  // .branch4 { stroke: ${options.git4}; }
  // .branch5 { stroke: ${options.git5}; }
  // .branch6 { stroke: ${options.git6}; }
  // .branch7 { stroke: ${options.git7}; }
  .label0  { fill: ${options.git0}; }
  .label1  { fill: ${options.git1}; }
  .label2  { fill: ${options.git2}; }
  .label3  { fill: ${options.git3}; }
  .label4  { fill: ${options.git4}; }
  .label5  { fill: ${options.git5}; }
  .label6  { fill: ${options.git6}; }
  .label7  { fill: ${options.git7}; }

  // .arrow { stroke : ${options.tertiaryColor}; stroke-width: 8; stroke-linecap: round; }
  .arrow { stroke-width: 8; stroke-linecap: round; fill: none}
  .arrow0 { stroke: ${options.git0}; }
  .arrow1 { stroke: ${options.git1}; }
  .arrow2 { stroke: ${options.git2}; }
  .arrow3 { stroke: ${options.git3}; }
  .arrow4 { stroke: ${options.git4}; }
  .arrow5 { stroke: ${options.git5}; }
  .arrow6 { stroke: ${options.git6}; }
  .arrow7 { stroke: ${options.git7}; }
  #arrowhead { fill: #990099;}
  .branchLabel  { }
  }
`;

export default getStyles;
