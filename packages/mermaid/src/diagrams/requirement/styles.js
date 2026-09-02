import * as configApi from '../../config.js';

const genColor = (options) => {
  const config = configApi.getConfig();

  const { themeVariables, look } = config;
  const { bkgColorArray, borderColorArray } = themeVariables;
  if (!borderColorArray?.length) {
    return '';
  }
  let sections = '';

  const hasBkgColors = bkgColorArray?.length > 0;

  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    // Omit the declaration when there is no fill palette, rather than emitting `fill: ;`
    // -- an empty value is invalid CSS. `redux-dark-color` is the live case: it ships a
    // border palette and no background palette, colouring outlines only.
    //
    // Wrap at the palette length for the same reason as `er/styles.ts`: the loop runs to
    // THEME_COLOR_LIMIT, so a shorter palette would emit `stroke: undefined`.
    const borderColor = borderColorArray[i % borderColorArray.length];
    const fill = hasBkgColors ? `fill: ${bkgColorArray[i % bkgColorArray.length]};` : '';
    sections += `

    [data-look="${look}"][data-color-id="color-${i}"].node path {
    stroke: ${borderColor};
    ${fill}
    }

    [data-look="${look}"][data-color-id="color-${i}"].node  rect {
    stroke: ${borderColor};
    ${fill}
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
