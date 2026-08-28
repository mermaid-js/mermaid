import * as configApi from '../../config.js';
import { colorSlotCount, isColorTheme, safeLook } from '../common/colorThemeGate.js';

const genColor = (options) => {
  const config = configApi.getConfig();

  const { theme, themeVariables } = config;
  const { bkgColorArray, borderColorArray } = themeVariables;
  // Gates on the theme as well as the palette, matching every other stylesheet. This used
  // to key off the array alone, which happened to give the same answer but left two
  // different idioms in the codebase for the same decision.
  if (!isColorTheme(theme, borderColorArray)) {
    return '';
  }
  // `look` is validated before it reaches the selector -- see `safeLook`.
  const look = safeLook(config.look);
  let sections = '';

  for (let i = 0; i < colorSlotCount(options.THEME_COLOR_LIMIT); i++) {
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
