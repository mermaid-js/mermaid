import getFlowchartStyles from './diagrams/flowchart/theme';

const themes = {
  flowchart: getFlowchartStyles
};

const options = {
  mainBkg: '#ECECFF',
  secondBkg: '#ffffde',
  lineColor: '#333333',
  border1: '#CCCCFF',
  border2: '#aaaa33',
  arrowheadColor: '#333333',
  labelColor: 'black',
  errorBkgColor: '#552222',
  errorTextColor: '#552222'
};

const getStyles = (type, userStyles, options2) =>
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

  ${themes[type]()}

  ${userStyles}
`;

export default getStyles;
