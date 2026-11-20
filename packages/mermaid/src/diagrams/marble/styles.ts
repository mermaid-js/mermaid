// @ts-expect-error Incorrect khroma types
import { isDark, luminance, mix } from 'khroma';
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

/** Fills darker than this sink into a dark background, so spans lift them towards their outline. */
const DARK_FILL_LUMINANCE = 0.05;

const isDarkColor = (color: string | undefined): boolean => {
  try {
    return !!color && isDark(color);
  } catch {
    return false;
  }
};

/**
 * Fill, outline and text colour of a span, unlabelled or in palette slot `slot`. Used by the
 * stylesheet and by the hand-drawn pen, so both agree.
 *
 * On a dark background the theme's `cScale` and secondary colours sit close to the background
 * itself, so a span there is outlined in `marbleSpanStroke` and a near-black fill is mixed a
 * quarter of the way towards that outline. Light themes keep their colours as they are.
 */
export const spanColors = (
  options: MarbleStyleOptions,
  slot?: number
): { fill?: string; stroke?: string; text?: string } => {
  const colors =
    slot === undefined
      ? {
          fill: options.marbleSpanFill,
          stroke: options.marbleSpanStroke,
          text: options.marbleSpanTextColor,
        }
      : {
          fill: colorOf(options, `cScale${slot}`),
          stroke: colorOf(options, `cScalePeer${slot}`, options.marbleEventStroke),
          text: colorOf(options, `cScaleLabel${slot}`, options.marbleEventTextColor),
        };
  const background = colorOf(options, 'background');
  if (!isDarkColor(background) || !colors.fill || !options.marbleSpanStroke) {
    return colors;
  }
  const outline = options.marbleSpanStroke;
  let fill = colors.fill;
  try {
    if (luminance(fill) < DARK_FILL_LUMINANCE) {
      fill = mix(outline, fill, 25);
    }
  } catch {
    // not a colour khroma can read; leave it to the browser
  }
  return { ...colors, fill, stroke: outline };
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
    const span = spanColors(options, i);
    rules.push(`
  .marble-color-${i} .marble-event-circle {
    fill: ${fill};
    stroke: ${stroke};
  }
  .marble-color-${i} .marble-span-body {
    fill: ${span.fill};
    stroke: ${span.stroke};
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

const getStyles: DiagramStylesProvider = (options: MarbleStyleOptions = {}) => {
  const span = spanColors(options);
  return `
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
    fill: ${span.fill};
    stroke: ${span.stroke};
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
};

export default getStyles;
