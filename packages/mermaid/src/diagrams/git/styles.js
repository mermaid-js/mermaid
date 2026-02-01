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
  .gitTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${options.textColor};
  }

  /* Clickable commit styles */
  .commit.clickable {
    cursor: pointer;
  }

  .commit.clickable:hover .commit-label-bkg,
  .commit.clickable:focus .commit-label-bkg {
    stroke-width: 4px;
    stroke: ${options.git0 || '#000'} !important;
  }

  .commit.clickable:hover text.commit-label,
  .commit.clickable:focus text.commit-label {
    text-decoration: underline;
  }

  .commit.clickable:focus {
    outline: 2px solid ${options.git0 || '#000'};
    outline-offset: 2px;
  }

  /* Clickable branch label styles */
  .branchLabel.clickable {
    cursor: pointer;
  }

  .branchLabel.clickable:hover .branchLabelBkg,
  .branchLabel.clickable:focus .branchLabelBkg {
    stroke-width: 3px;
    stroke: ${options.git0 || '#000'} !important;
  }

  .branchLabel.clickable:hover .label,
  .branchLabel.clickable:focus .label {
    text-decoration: underline;
  }

  .branchLabel.clickable:focus {
    outline: 2px solid ${options.git0 || '#000'};
    outline-offset: 2px;
  }

  /* Clickable tag styles */
  .tag.clickable {
    cursor: pointer;
  }

  .tag.clickable:hover polygon,
  .tag.clickable:focus polygon {
    stroke-width: 3px;
    stroke: ${options.git0 || '#000'} !important;
  }

  .tag.clickable:hover text,
  .tag.clickable:focus text {
    text-decoration: underline;
  }

  .tag.clickable:focus {
    outline: 2px solid ${options.git0 || '#000'};
    outline-offset: 2px;
  }
`;

export default getStyles;
