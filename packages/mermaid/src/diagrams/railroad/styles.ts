import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { getConfig as getConfigAPI } from '../../config.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { DEFAULT_RAILROAD_CONFIG, type RailroadStyleOptions } from './railroadTypes.js';

type ThemeVariables = ReturnType<typeof getThemeVariables>;

type RailroadStyleInput =
  | RailroadStyleOptions
  | ({
      railroad?: RailroadStyleOptions;
      svgId?: string;
      theme?: string;
      look?: string;
    } & Partial<ThemeVariables>);

const COLOR_VALUE_PATTERN =
  /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$|^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([\d\s%+,./-]+\)$|^[a-z]+$/i;
const FONT_FAMILY_PATTERN = /^[\w "',.-]+$/;
const RAILROAD_STYLE_OPTION_KEYS = new Set<keyof RailroadStyleOptions>([
  'orientation',
  'compactMode',
  'padding',
  'verticalSeparation',
  'horizontalSeparation',
  'arcRadius',
  'fontSize',
  'fontFamily',
  'terminalFill',
  'terminalStroke',
  'terminalTextColor',
  'nonTerminalFill',
  'nonTerminalStroke',
  'nonTerminalTextColor',
  'lineColor',
  'strokeWidth',
  'markerFill',
  'commentFill',
  'commentStroke',
  'commentTextColor',
  'specialFill',
  'specialStroke',
  'ruleNameColor',
  'showMarkers',
  'markerRadius',
]);

const isRailroadStyleOptions = (options?: RailroadStyleInput): options is RailroadStyleOptions => {
  if (!options) {
    return false;
  }

  return Object.keys(options).every(
    (key) => key === 'railroad' || RAILROAD_STYLE_OPTION_KEYS.has(key as keyof RailroadStyleOptions)
  );
};

const extractRailroadOverrides = (options?: RailroadStyleInput): Partial<RailroadStyleOptions> => {
  if (!options) {
    return {};
  }

  if ('railroad' in options && options.railroad) {
    return options.railroad;
  }

  return isRailroadStyleOptions(options) ? options : {};
};

const extractThemeOverrides = (options?: RailroadStyleInput): Partial<ThemeVariables> => {
  if (!options || isRailroadStyleOptions(options)) {
    return {};
  }

  const { railroad: _railroad, svgId: _svgId, theme: _theme, look: _look, ...themeOverrides } =
    options;
  return themeOverrides;
};

const sanitizeColorValue = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  return COLOR_VALUE_PATTERN.test(normalized) ? normalized : fallback;
};

const sanitizeFontFamilyValue = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim();
  return FONT_FAMILY_PATTERN.test(normalized) ? normalized : fallback;
};

const sanitizeNumberValue = (value: unknown, fallback: number): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseThemeFontSize = (value: unknown): number | undefined => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const buildThemeDefaults = (themeVariables: ThemeVariables): Required<RailroadStyleOptions> => {
  const fontFamily = sanitizeFontFamilyValue(
    themeVariables.fontFamily,
    DEFAULT_RAILROAD_CONFIG.fontFamily
  );
  const fontSize = parseThemeFontSize(themeVariables.fontSize) ?? DEFAULT_RAILROAD_CONFIG.fontSize;

  return {
    ...DEFAULT_RAILROAD_CONFIG,
    fontFamily,
    fontSize,
    terminalFill: sanitizeColorValue(
      themeVariables.secondBkg ?? themeVariables.secondaryColor,
      DEFAULT_RAILROAD_CONFIG.terminalFill
    ),
    terminalStroke: sanitizeColorValue(
      themeVariables.secondaryBorderColor ?? themeVariables.lineColor,
      DEFAULT_RAILROAD_CONFIG.terminalStroke
    ),
    terminalTextColor: sanitizeColorValue(
      themeVariables.secondaryTextColor ?? themeVariables.textColor,
      DEFAULT_RAILROAD_CONFIG.terminalTextColor
    ),
    nonTerminalFill: sanitizeColorValue(
      themeVariables.mainBkg ?? themeVariables.background,
      DEFAULT_RAILROAD_CONFIG.nonTerminalFill
    ),
    nonTerminalStroke: sanitizeColorValue(
      themeVariables.primaryBorderColor ?? themeVariables.lineColor,
      DEFAULT_RAILROAD_CONFIG.nonTerminalStroke
    ),
    nonTerminalTextColor: sanitizeColorValue(
      themeVariables.primaryTextColor ?? themeVariables.textColor,
      DEFAULT_RAILROAD_CONFIG.nonTerminalTextColor
    ),
    lineColor: sanitizeColorValue(themeVariables.lineColor, DEFAULT_RAILROAD_CONFIG.lineColor),
    markerFill: sanitizeColorValue(themeVariables.lineColor, DEFAULT_RAILROAD_CONFIG.markerFill),
    commentFill: sanitizeColorValue(
      themeVariables.labelBackground ?? themeVariables.tertiaryColor,
      DEFAULT_RAILROAD_CONFIG.commentFill
    ),
    commentStroke: sanitizeColorValue(
      themeVariables.tertiaryBorderColor ?? themeVariables.lineColor,
      DEFAULT_RAILROAD_CONFIG.commentStroke
    ),
    commentTextColor: sanitizeColorValue(
      themeVariables.tertiaryTextColor ?? themeVariables.textColor,
      DEFAULT_RAILROAD_CONFIG.commentTextColor
    ),
    specialFill: sanitizeColorValue(
      themeVariables.tertiaryColor ?? themeVariables.secondaryColor,
      DEFAULT_RAILROAD_CONFIG.specialFill
    ),
    specialStroke: sanitizeColorValue(
      themeVariables.tertiaryBorderColor ?? themeVariables.secondaryBorderColor,
      DEFAULT_RAILROAD_CONFIG.specialStroke
    ),
    ruleNameColor: sanitizeColorValue(
      themeVariables.titleColor ?? themeVariables.textColor,
      DEFAULT_RAILROAD_CONFIG.ruleNameColor
    ),
  };
};

export const buildRailroadStyleOptions = (
  options?: RailroadStyleInput
): Required<RailroadStyleOptions> => {
  const currentConfig = getConfigAPI();
  const themeVariables = {
    ...getThemeVariables(),
    ...(currentConfig.themeVariables ?? {}),
    ...extractThemeOverrides(options),
  } as ThemeVariables;
  const themeDefaults = buildThemeDefaults(themeVariables);
  const railroadOptions = {
    ...(currentConfig.railroad ?? {}),
    ...extractRailroadOverrides(options),
  } as RailroadStyleOptions;

  return {
    orientation: railroadOptions.orientation ?? themeDefaults.orientation,
    compactMode: railroadOptions.compactMode ?? themeDefaults.compactMode,
    padding: sanitizeNumberValue(railroadOptions.padding, themeDefaults.padding),
    verticalSeparation: sanitizeNumberValue(
      railroadOptions.verticalSeparation,
      themeDefaults.verticalSeparation
    ),
    horizontalSeparation: sanitizeNumberValue(
      railroadOptions.horizontalSeparation,
      themeDefaults.horizontalSeparation
    ),
    arcRadius: sanitizeNumberValue(railroadOptions.arcRadius, themeDefaults.arcRadius),
    fontSize: sanitizeNumberValue(railroadOptions.fontSize, themeDefaults.fontSize),
    fontFamily: sanitizeFontFamilyValue(railroadOptions.fontFamily, themeDefaults.fontFamily),
    terminalFill: sanitizeColorValue(railroadOptions.terminalFill, themeDefaults.terminalFill),
    terminalStroke: sanitizeColorValue(
      railroadOptions.terminalStroke,
      themeDefaults.terminalStroke
    ),
    terminalTextColor: sanitizeColorValue(
      railroadOptions.terminalTextColor,
      themeDefaults.terminalTextColor
    ),
    nonTerminalFill: sanitizeColorValue(
      railroadOptions.nonTerminalFill,
      themeDefaults.nonTerminalFill
    ),
    nonTerminalStroke: sanitizeColorValue(
      railroadOptions.nonTerminalStroke,
      themeDefaults.nonTerminalStroke
    ),
    nonTerminalTextColor: sanitizeColorValue(
      railroadOptions.nonTerminalTextColor,
      themeDefaults.nonTerminalTextColor
    ),
    lineColor: sanitizeColorValue(railroadOptions.lineColor, themeDefaults.lineColor),
    strokeWidth: sanitizeNumberValue(railroadOptions.strokeWidth, themeDefaults.strokeWidth),
    markerFill: sanitizeColorValue(railroadOptions.markerFill, themeDefaults.markerFill),
    commentFill: sanitizeColorValue(railroadOptions.commentFill, themeDefaults.commentFill),
    commentStroke: sanitizeColorValue(railroadOptions.commentStroke, themeDefaults.commentStroke),
    commentTextColor: sanitizeColorValue(
      railroadOptions.commentTextColor,
      themeDefaults.commentTextColor
    ),
    specialFill: sanitizeColorValue(railroadOptions.specialFill, themeDefaults.specialFill),
    specialStroke: sanitizeColorValue(railroadOptions.specialStroke, themeDefaults.specialStroke),
    ruleNameColor: sanitizeColorValue(railroadOptions.ruleNameColor, themeDefaults.ruleNameColor),
    showMarkers: railroadOptions.showMarkers ?? themeDefaults.showMarkers,
    markerRadius: sanitizeNumberValue(railroadOptions.markerRadius, themeDefaults.markerRadius),
  };
};

/**
 * Generate CSS styles for Railroad diagrams
 */
export const getStyles: DiagramStylesProvider = (options?: RailroadStyleInput): string => {
  const {
    fontFamily,
    fontSize,
    terminalFill,
    terminalStroke,
    terminalTextColor,
    nonTerminalFill,
    nonTerminalStroke,
    nonTerminalTextColor,
    lineColor,
    strokeWidth,
    markerFill,
    commentFill,
    commentStroke,
    commentTextColor,
    specialFill,
    specialStroke,
    ruleNameColor,
  } = buildRailroadStyleOptions(options);

  return `
  .railroad-diagram {
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
  }

  .railroad-terminal rect {
    fill: ${terminalFill};
    stroke: ${terminalStroke};
    stroke-width: ${strokeWidth}px;
  }

  .railroad-terminal text {
    fill: ${terminalTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-nonterminal rect {
    fill: ${nonTerminalFill};
    stroke: ${nonTerminalStroke};
    stroke-width: ${strokeWidth}px;
  }

  .railroad-nonterminal text {
    fill: ${nonTerminalTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-line {
    stroke: ${lineColor};
    stroke-width: ${strokeWidth}px;
    fill: none;
  }

  .railroad-start circle,
  .railroad-end circle {
    fill: ${markerFill};
  }

  .railroad-comment ellipse {
    fill: ${commentFill};
    stroke: ${commentStroke};
    stroke-width: ${strokeWidth}px;
  }

  .railroad-comment text {
    fill: ${commentTextColor};
    font-style: italic;
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-special rect {
    fill: ${specialFill};
    stroke: ${specialStroke};
    stroke-width: ${strokeWidth}px;
    stroke-dasharray: 5,3;
  }

  .railroad-special text {
    fill: ${nonTerminalTextColor};
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-rule-name {
    font-weight: bold;
    fill: ${ruleNameColor};
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
  }

  .railroad-group {
    /* Grouping container, no specific styles */
  }
`;
};

export default getStyles;
