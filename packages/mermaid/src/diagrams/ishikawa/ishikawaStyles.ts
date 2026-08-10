import type { DiagramStylesProvider } from '../../diagram-api/types.js';

const getStyles: DiagramStylesProvider = (options) => `
.ishikawa .ishikawa-spine,
.ishikawa .ishikawa-branch,
.ishikawa .ishikawa-sub-branch {
  stroke: ${options.lineColor};
  stroke-width: 2;
  fill: none;
}

.ishikawa .ishikawa-sub-branch {
  stroke-width: 1;
}

.ishikawa .ishikawa-arrow {
  fill: ${options.lineColor};
}

.ishikawa .ishikawa-head {
  fill: ${options.mainBkg};
  stroke: ${options.lineColor};
  stroke-width: 2;
}

.ishikawa .ishikawa-label-box {
  fill: ${options.mainBkg};
  stroke: ${options.lineColor};
  stroke-width: 2;
}

.ishikawa text {
  font-family: ${options.fontFamily};
  font-size: ${options.fontSize};
  fill: ${options.textColor};
}

.ishikawa .ishikawa-head-label {
  font-weight: 600;
  text-anchor: middle;
  dominant-baseline: middle;
  font-size: 14px;
}

.ishikawa .ishikawa-label {
  text-anchor: end;
}

.ishikawa .ishikawa-label.cause {
  text-anchor: middle;
  dominant-baseline: middle;
}

.ishikawa .ishikawa-label.align {
  text-anchor: end;
  dominant-baseline: middle;
}

.ishikawa .ishikawa-label.up {
  dominant-baseline: baseline;
}

.ishikawa .ishikawa-label.down {
  dominant-baseline: hanging;
}
`;

export default getStyles;
