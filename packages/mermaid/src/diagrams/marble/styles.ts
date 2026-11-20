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

/** Fills darker than this sink into a dark background, so they are lifted towards their outline. */
const DARK_FILL_LUMINANCE = 0.05;

const isDarkColor = (color: string | undefined): boolean => {
  try {
    return !!color && isDark(color);
  } catch {
    return false;
  }
};

interface ShapeColors {
  fill?: string;
  stroke?: string;
  text?: string;
}

/** A palette slot's colours from `cScale`, `cScalePeer` and `cScaleLabel`. */
const slotColors = (options: MarbleStyleOptions, slot: number): ShapeColors => ({
  fill: colorOf(options, `cScale${slot}`),
  stroke: colorOf(options, `cScalePeer${slot}`, options.marbleEventStroke),
  text: colorOf(options, `cScaleLabel${slot}`, options.marbleEventTextColor),
});

/**
 * On a dark background the theme's `cScale` and secondary colours can sit close to the
 * background itself (`cScale0` is the dark theme's own node colour), so a shape there is
 * outlined in `outline` and a near-black fill is mixed towards it, from a quarter of the way
 * on, until it clears `DARK_FILL_LUMINANCE`.
 * Light backgrounds keep the colours as they are.
 */
const readableOnDark = (
  options: MarbleStyleOptions,
  colors: ShapeColors,
  outline: string | undefined
): ShapeColors => {
  if (!isDarkColor(colorOf(options, 'background')) || !colors.fill || !outline) {
    return colors;
  }
  let fill = colors.fill;
  try {
    for (let weight = 25; weight <= 50 && luminance(fill) < DARK_FILL_LUMINANCE; weight += 5) {
      fill = mix(outline, colors.fill, weight);
    }
  } catch {
    // not a colour khroma can read; leave it to the browser
  }
  return { ...colors, fill, stroke: outline };
};

/**
 * Fill, outline and text colour of a span, unlabelled or in palette slot `slot`. Used by the
 * stylesheet and by the hand-drawn pen, so both agree. See `readableOnDark` for dark themes.
 */
export const spanColors = (options: MarbleStyleOptions, slot?: number): ShapeColors =>
  readableOnDark(
    options,
    slot === undefined
      ? {
          fill: options.marbleSpanFill,
          stroke: options.marbleSpanStroke,
          text: options.marbleSpanTextColor,
        }
      : slotColors(options, slot),
    options.marbleSpanStroke
  );

/**
 * Fill, outline and text colour of an event marble in palette slot `slot`, adjusted like spans
 * on a dark background. Unlabelled marbles use the `marbleEvent*` variables as they are.
 */
export const eventColors = (options: MarbleStyleOptions, slot: number): ShapeColors =>
  readableOnDark(options, slotColors(options, slot), options.marbleEventStroke);

/** Palette slots, one per `label` statement in declaration order, coloured from `cScale`. */
const paletteRules = (options: MarbleStyleOptions): string => {
  const rules: string[] = [];
  for (let i = 0; i < PALETTE_SIZE; i++) {
    const { fill, stroke, text } = slotColors(options, i);
    if (!fill || !stroke || !text) {
      continue;
    }
    const event = eventColors(options, i);
    const span = spanColors(options, i);
    rules.push(`
  .marble-color-${i} .marble-event-circle {
    fill: ${event.fill};
    stroke: ${event.stroke};
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
  .marble-subscribe-mark {
    fill: none;
    stroke: ${options.marbleCompleteColor};
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .marble-group-box {
    fill: none;
    stroke: ${options.marbleLaneColor};
    stroke-width: 1;
    opacity: 0.7;
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
