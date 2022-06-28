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
  ${[0, 1, 2, 3, 4, 5, 6, 7]
    .map(
      (i) =>
        `
        .branch-label${i} { fill: ${options['gitBranchLabel' + i]}; }
        .commit${i} { stroke: ${options['git' + i]}; fill: ${options['git' + i]}; }
        .commit-highlight${i} { stroke: ${options['gitInv' + i]}; fill: ${options['gitInv' + i]}; }
        .label${i}  { fill: ${options['git' + i]}; }
        .arrow${i} { stroke: ${options['git' + i]}; }
        `
    )
    .join('\n')}

  .branch {
    stroke-width: 1;
    stroke: ${options.lineColor};
    stroke-dasharray: 2;
  }
  .commit-label { font-size: ${options.commitLabelFontSize}; fill: ${options.commitLabelColor};}
  .commit-label-bkg { font-size: ${options.commitLabelFontSize}; fill: ${
    options.commitLabelBackground
  }; opacity: 0.5; }
  .tag-label { font-size: ${options.tagLabelFontSize}; fill: ${options.tagLabelColor};}
  .tag-label-bkg { fill: ${options.tagLabelBackground}; stroke: ${options.tagLabelBorder}; }
  .tag-hole { fill: ${options.textColor}; }

  .commit-merge {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
  }
  .commit-reverse {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
    stroke-width: 3;
  }
  .commit-highlight-outer {
  }
  .commit-highlight-inner {
    stroke: ${options.primaryColor};
    fill: ${options.primaryColor};
  }

  .arrow { stroke-width: 8; stroke-linecap: round; fill: none}
  }
`;

export default getStyles;
