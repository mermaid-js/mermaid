import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { FONT_SIZE, PALETTE_SIZE } from './marbleLayout.js';
import type { MarbleStyleOptions } from './marbleTypes.js';

/** A theme variable that holds a colour, or `fallback` when the theme does not define it. */
const colorOf = (
  options: MarbleStyleOptions,
  key: string,
  fallback?: string
): string | undefined => {
  const value = options[key];
  return typeof value === 'string' && value ? value : fallback;
};

/** Palette slots, one per `label` statement in declaration order, coloured from `cScale`. */
const paletteRules = (options: MarbleStyleOptions): string => {
  const rules: string[] = [];
  for (let i = 0; i < PALETTE_SIZE; i++) {
    const fill = colorOf(options, `cScale${i}`);
    const stroke = colorOf(options, `cScalePeer${i}`, options.marbleEventStroke);
    const text = colorOf(options, `cScaleLabel${i}`, options.marbleEventTextColor);
    if (!fill || !stroke || !text) {
      continue;
    }
    rules.push(`
  .marble-color-${i} .marble-event-circle,
  .marble-color-${i} .marble-span-body {
    fill: ${fill};
    stroke: ${stroke};
  }
  .marble-color-${i} .marble-event-symbol,
  .marble-color-${i} .marble-span-label {
    fill: ${text};
  }
  .marble-color-${i} .marble-span-arrow {
    fill: none;
    stroke: ${text};
  }`);
  }
  return rules.join('');
};

const getStyles: DiagramStylesProvider = (options: MarbleStyleOptions = {}) => `
  .marble-title {
    font-size: ${FONT_SIZE.title}px;
    font-weight: bold;
    fill: ${options.marbleTitleColor};
    font-family: ${options.fontFamily};
  }
  .marble-tick {
    font-size: ${FONT_SIZE.tick}px;
    fill: ${options.marbleAxisTextColor};
    font-family: ${options.fontFamily};
  }
  .marble-grid {
    stroke: ${options.marbleGridColor};
    stroke-width: 1;
    stroke-dasharray: 2 5;
    opacity: 0.5;
  }
  .marble-lane-label {
    font-size: ${FONT_SIZE.lane}px;
    fill: ${options.marbleLaneLabelColor};
    font-family: ${options.fontFamily};
  }
  .marble-lane-line {
    stroke: ${options.marbleLaneColor};
    stroke-width: 1.5;
  }
  .marble-event-circle {
    fill: ${options.marbleEventFill};
    stroke: ${options.marbleEventStroke};
    stroke-width: 1.5;
  }
  .marble-event-symbol {
    font-size: ${FONT_SIZE.symbol}px;
    font-weight: bold;
    fill: ${options.marbleEventTextColor};
    font-family: ${options.fontFamily};
  }
  .marble-span-body {
    fill: ${options.marbleSpanFill};
    stroke: ${options.marbleSpanStroke};
    stroke-width: 1;
  }
  .marble-span-label {
    font-size: ${FONT_SIZE.label}px;
    fill: ${options.marbleSpanTextColor};
    font-family: ${options.fontFamily};
  }
  .marble-span-arrow {
    fill: none;
    stroke: ${options.marbleSpanTextColor};
    stroke-width: 1.5;
  }
  .marble-complete-bar {
    stroke: ${options.marbleCompleteColor};
    stroke-width: 2.5;
  }
  .marble-error-mark {
    fill: none;
    stroke: ${options.marbleErrorColor};
    stroke-width: 3;
    stroke-linecap: round;
  }
  .marble-cancel-mark {
    fill: none;
    stroke: ${options.marbleCancelColor};
    stroke-width: 2;
    stroke-linecap: round;
  }
  .marble-break-gap {
    fill: ${options.marbleBreakBkg};
    stroke: none;
  }
  .marble-break-mark {
    fill: none;
    stroke: ${options.marbleBreakColor};
    stroke-width: 1.5;
  }
  .marble-label-text {
    font-size: ${FONT_SIZE.label}px;
    fill: ${options.marbleLabelColor};
    font-family: ${options.fontFamily};
  }
  .marble-label-leader {
    stroke: ${options.marbleGridColor};
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }
  ${paletteRules(options)}
`;

export default getStyles;
