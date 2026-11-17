import { adjust, darken, hsl, isDark, lighten, luminance, mix } from 'khroma';

export const mkBorder = (col, darkMode) =>
  darkMode ? adjust(col, { s: -40, l: 10 }) : adjust(col, { s: -40, l: -10 });

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The value a theme variable takes once the user's override is applied.
 *
 * An object-valued variable such as `xyChart` keeps every key the theme generated and takes the
 * user's keys on top, so overriding one of them does not discard the rest.
 */
export const applyOverride = (generated, override) =>
  isPlainObject(generated) && isPlainObject(override) ? { ...generated, ...override } : override;

/** Stroke widths, in px: an outline, and the heavier ring that marks an end event. */
const BPMN_OUTLINE_WIDTH = 1.6;
const BPMN_END_EVENT_WIDTH = 3.4;

/** WCAG 2.2 1.4.11: the contrast a graphical object needs against what it sits on. */
const BPMN_MIN_CONTRAST = 3;

/** How far a stroke must stand out from the fill it outlines, so the outline reads at all. */
const BPMN_MIN_FILL_CONTRAST = 1.5;

/** How much lightness one step of searching for such a stroke moves, in percentage points. */
const BPMN_STROKE_STEP = 5;
const BPMN_STROKE_MAX_STEPS = 20;

const contrastBetween = (a, b) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

/** A colour khroma cannot read (a CSS variable, say) counts as light, the usual case. */
const isDarkColor = (color) => {
  try {
    return isDark(color);
  } catch {
    return false;
  }
};

/** The share of the line colour kept when it is softened toward the background. */
const BPMN_ANNOTATION_SHARE = 55;
const BPMN_LANE_SHARE = 25;

/** An end event is red whatever the theme; only its lightness follows the background. */
const BPMN_END_EVENT_HUE = 4;
const BPMN_END_EVENT_SATURATION = 55;
const BPMN_END_EVENT_LIGHTNESS = { onLight: 42, onDark: 68 };

/**
 * The colours BPMN paints with, derived from the theme's own variables so a custom
 * `primaryColor` or another theme changes them. A value the user set under
 * `themeVariables.bpmn` always wins, including a stroke width of `0`.
 *
 * Call it last in `updateColors`, once the variables it reads are final.
 */
export const bpmnThemeVariables = (theme) => {
  const onDark = Boolean(theme.darkMode) || isDarkColor(theme.background);
  const strokeFor = (fill) => {
    const move = onDark ? lighten : darken;
    const reads = (stroke) =>
      contrastBetween(stroke, theme.background) >= BPMN_MIN_CONTRAST &&
      contrastBetween(stroke, fill) >= BPMN_MIN_FILL_CONTRAST;
    let stroke = fill;
    for (let step = 0; step < BPMN_STROKE_MAX_STEPS && !reads(stroke); step++) {
      stroke = move(stroke, BPMN_STROKE_STEP);
    }
    return stroke;
  };
  const derived = {
    eventFill: theme.tertiaryColor,
    eventStroke: theme.lineColor,
    eventStrokeWidth: BPMN_OUTLINE_WIDTH,
    endEventStroke: hsl(
      BPMN_END_EVENT_HUE,
      BPMN_END_EVENT_SATURATION,
      onDark ? BPMN_END_EVENT_LIGHTNESS.onDark : BPMN_END_EVENT_LIGHTNESS.onLight
    ),
    endEventStrokeWidth: BPMN_END_EVENT_WIDTH,
    gatewayFill: theme.secondaryColor,
    gatewayStroke: strokeFor(theme.secondaryColor),
    gatewayStrokeWidth: BPMN_OUTLINE_WIDTH,
    activityFill: theme.primaryColor,
    activityStroke: strokeFor(theme.primaryColor),
    activityStrokeWidth: BPMN_OUTLINE_WIDTH,
    glyphColor: theme.lineColor,
    dataFill: theme.tertiaryColor,
    dataStroke: theme.lineColor,
    annotationStroke: mix(theme.lineColor, theme.background, BPMN_ANNOTATION_SHARE),
    laneFill: 'transparent',
    laneStroke: mix(theme.lineColor, theme.background, BPMN_LANE_SHARE),
    laneLabelColor: theme.titleColor,
    labelColor: theme.nodeTextColor ?? theme.primaryTextColor,
    edgeStroke: theme.lineColor,
    messageStroke: theme.lineColor,
  };
  return Object.fromEntries(
    Object.entries(derived).map(([key, value]) => [key, theme.bpmn?.[key] ?? value])
  );
};
