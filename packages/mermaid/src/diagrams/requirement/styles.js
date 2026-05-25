import * as configApi from '../../config.js';

const genColor = (options) => {
  const config = configApi.getConfig();

  const { themeVariables, look } = config;
  const { bkgColorArray, borderColorArray } = themeVariables;
  if (!borderColorArray?.length) {
    return '';
  }
  let sections = '';

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    sections += `

    [data-look="${look}"][data-color-id="color-${i}"].node path {
    stroke: ${borderColorArray[i]};
    fill: ${bkgColorArray?.length ? bkgColorArray[i] : ''};
    }

    [data-look="${look}"][data-color-id="color-${i}"].node  rect {
    stroke: ${borderColorArray[i]};
    fill: ${bkgColorArray?.length ? bkgColorArray[i] : ''};
     }
    `;
  }
  return sections;
};

const getStyles = (options) => {
  const config = configApi.getConfig();
  const { look, themeVariables } = config;
  const { requirementEdgeLabelBackground } = themeVariables;
  return `
  ${genColor(options)}
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
    fill-opacity: 1.0;
    stroke: ${options.requirementBorderColor};
    stroke-width: ${options.requirementBorderSize};
  }
  
  .reqTitle, .reqLabel{
    fill:  ${options.requirementTextColor};
  }
  .reqLabelBox {
    fill: ${options.relationLabelBackground};
    fill-opacity: 1.0;
  }

  .req-title-line {
    stroke: ${options.requirementBorderColor};
    stroke-width: ${options.requirementBorderSize};
  }
  .relationshipLine {
    stroke: ${options.relationColor};
    stroke-width: ${look === 'neo' ? options.strokeWidth : '1px'};
  }
  .relationshipLabel {
    fill: ${options.relationLabelColor};
  }
    .edgeLabel {
    background-color: ${options.edgeLabelBackground};
  }
  .edgeLabel .label rect {
    fill: ${options.edgeLabelBackground};
  }
  .edgeLabel .label text {
    fill: ${options.relationLabelColor};
  }
  .divider {
    stroke: ${options.nodeBorder};
    stroke-width: 1;
  }
  .label {
    font-family: ${options.fontFamily};
    color: ${options.nodeTextColor || options.textColor};
  }
  .label text,span {
    fill: ${options.nodeTextColor || options.textColor};
    color: ${options.nodeTextColor || options.textColor};
  }
  .labelBkg {
    background-color: ${requirementEdgeLabelBackground ?? options.edgeLabelBackground};
  }

`;
};
// fill', conf.rect_fill)
export default getStyles;
