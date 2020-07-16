import getFlowchartStyles from './diagrams/flowchart/styles';

const themes = {
  flowchart: getFlowchartStyles
};

const getStyles = (type, userStyles, options) =>
  `:root {
    --mermaid-font-family: '"trebuchet ms", verdana, arial';
    font-family: '"trebuchet ms", verdana, arial';
    font-family: var(--mermaid-font-family);
    font-size: 16px;
  }

  /* Classes common for multiple diagrams */

  .error-icon {
    fill: ${options.errorBkgColor};
  }
  .error-text {
    fill: ${options.errorTextColor};
    stroke: ${options.errorTextColor};
  }

  .edge-thickness-normal {
    // stroke: ${options.lineColor};
    stroke-width: 2px;
  }
  .edge-thickness-thick {
    // stroke: ${options.lineColor};
    stroke-width: 3.5px
  }
  .edge-pattern-solid {
    stroke-dasharray: 0;
  }

  .edge-pattern-dashed{
    stroke-dasharray: 3;
  }
  .edge-pattern-dotted {
    stroke-dasharray: 2;
  }

  .marker {
    fill: ${options.lineColor};
  }
  .marker.cross {
    stroke: ${options.lineColor};
  }

  svg {
    font-family: var(--mermaid-font-family);
  }

  ${themes[type](options)}

  ${userStyles}
`;

export default getStyles;
