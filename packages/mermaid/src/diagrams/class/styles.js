import { getIconStyles } from '../globalStyles.js';
import { colorSlotCount, hasPalette, isColorTheme, safeLook } from '../common/colorThemeGate.js';

/**
 * Cycling per-class colour, mirroring `er/styles.ts`. A class box is the structural twin
 * of an ER entity -- a titled box with member rows, naming one distinct participant -- so
 * the same index-based palette applies.
 *
 * Targets `.outer-path` and `.divider` rather than a bare `.node path`, so member icons
 * and other inner paths are left alone. Nothing here is `!important`: `classBox.ts` puts
 * user `classDef` / `style` declarations in an inline `style` attribute, which must keep
 * winning over the theme palette.
 */
const genColor = (options) => {
  const { theme, bkgColorArray, borderColorArray } = options;
  if (!isColorTheme(theme, borderColorArray)) {
    return '';
  }
  const look = safeLook(options.look);
  const hasBkgColors = hasPalette(bkgColorArray);
  let sections = '';

  for (let i = 0; i < colorSlotCount(options.THEME_COLOR_LIMIT); i++) {
    const borderColor = borderColorArray[i % borderColorArray.length];
    sections += `

    [data-look="${look}"][data-color-id="color-${i}"].node .outer-path path {
      stroke: ${borderColor};
      ${hasBkgColors ? `fill: ${bkgColorArray[i % bkgColorArray.length]};` : ''}
    }

    [data-look="${look}"][data-color-id="color-${i}"].node .divider path {
      stroke: ${borderColor};
    }
    `;
  }
  return sections;
};

const getStyles = (options) =>
  `${genColor(options)}
  g.classGroup text {
  fill: ${options.nodeBorder || options.classText};
  stroke: none;
  font-family: ${options.fontFamily};
  font-size: 10px;

  .title {
    font-weight: bolder;
  }

}

  .cluster-label text {
    fill: ${options.titleColor};
  }
  .cluster-label span {
    color: ${options.titleColor};
  }
  .cluster-label span p {
    background-color: transparent;
  }

  .cluster rect {
    fill: ${options.clusterBkg};
    stroke: ${options.clusterBorder};
    stroke-width: 1px;
  }

  .cluster text {
    fill: ${options.titleColor};
  }

  .cluster span {
    color: ${options.titleColor};
  }

.nodeLabel, .edgeLabel {
  color: ${options.classText};
}

.noteLabel .nodeLabel, .noteLabel .edgeLabel {
  color: ${options.noteTextColor};
}
.edgeLabel .label rect {
  fill: ${options.mainBkg};
}
.label text {
  fill: ${options.classText};
}

.labelBkg {
  background: ${options.mainBkg};
}
.edgeLabel .label span {
  background: ${options.mainBkg};
}

.classTitle {
  font-weight: bolder;
}
.node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${options.mainBkg};
    stroke: ${options.nodeBorder};
    stroke-width: ${options.strokeWidth};
  }


.divider {
  stroke: ${options.nodeBorder};
  stroke-width: 1;
}

g.clickable {
  cursor: pointer;
}

g.classGroup rect {
  fill: ${options.mainBkg};
  stroke: ${options.nodeBorder};
}

g.classGroup line {
  stroke: ${options.nodeBorder};
  stroke-width: 1;
}

.classLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${options.mainBkg};
  opacity: 0.5;
}

.classLabel .label {
  fill: ${options.nodeBorder};
  font-size: 10px;
}

.relation {
  stroke: ${options.lineColor};
  stroke-width: ${options.strokeWidth};
  fill: none;
}

.dashed-line{
  stroke-dasharray: 3;
}

.dotted-line{
  stroke-dasharray: 1 2;
}

[id$="-compositionStart"], .composition {
  fill: ${options.lineColor} !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-compositionEnd"], .composition {
  fill: ${options.lineColor} !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-dependencyStart"], .dependency {
  fill: ${options.lineColor} !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-dependencyEnd"], .dependency {
  fill: ${options.lineColor} !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-extensionStart"], .extension {
  fill: transparent !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-extensionEnd"], .extension {
  fill: transparent !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-aggregationStart"], .aggregation {
  fill: transparent !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-aggregationEnd"], .aggregation {
  fill: transparent !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-lollipopStart"], .lollipop {
  fill: ${options.mainBkg} !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

[id$="-lollipopEnd"], .lollipop {
  fill: ${options.mainBkg} !important;
  stroke: ${options.lineColor} !important;
  stroke-width: 1;
}

.edgeTerminals {
  font-size: 11px;
  line-height: initial;
}

.classTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${options.textColor};
}

.edgeLabel[data-look="neo"] {
  background-color: ${options.edgeLabelBackground};
  p {
    background-color: ${options.edgeLabelBackground};
  }
  rect {
    opacity: 0.5;
    background-color: ${options.edgeLabelBackground};
    fill: ${options.edgeLabelBackground};
  }
  text-align: center;
}
  ${getIconStyles()}
`;

export default getStyles;
