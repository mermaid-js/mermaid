import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { getConfig as getConfigAPI } from '../../config.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import type { TimingStyleOptions } from './types.js';

type ThemeVariables = ReturnType<typeof getThemeVariables>;

const FONT_FAMILY_PATTERN = /^[\w "',.-]+$/;

const sanitizeFontFamily = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return normalized && FONT_FAMILY_PATTERN.test(normalized) ? normalized : fallback;
};

/** Generate theme-aware, CSS-safe styles for timing diagrams. */
export const styles: DiagramStylesProvider = (options: TimingStyleOptions = {}) => {
  const defaultThemeVariables = getThemeVariables();
  const themeVariables = {
    ...defaultThemeVariables,
    ...(getConfigAPI().themeVariables ?? {}),
    ...options,
  } as ThemeVariables & TimingStyleOptions;
  const lineColor = themeVariables.lineColor;
  const textColor = themeVariables.textColor;
  const titleColor = themeVariables.titleColor ?? textColor;
  const primaryColor = themeVariables.primaryColor;
  const primaryTextColor = themeVariables.primaryTextColor ?? textColor;
  const primaryBorderColor = themeVariables.primaryBorderColor ?? lineColor;
  const secondaryColor = themeVariables.secondaryColor;
  const tertiaryColor = themeVariables.tertiaryColor;
  const fontFamily = sanitizeFontFamily(
    themeVariables.fontFamily,
    sanitizeFontFamily(defaultThemeVariables.fontFamily, 'sans-serif')
  );

  return `
  .timing-root {
    font-family: ${fontFamily};
  }
  .timing-title {
    fill: ${titleColor};
    font-size: 18px;
    font-weight: 600;
  }
  .timing-axis-label, .timing-tick-label, .timing-signal-label, .timing-signal-meta {
    fill: ${textColor};
  }
  .timing-axis-label, .timing-tick-label, .timing-signal-meta {
    font-size: 11px;
  }
  .timing-signal-label {
    font-size: 13px;
    font-weight: 600;
  }
  .timing-signal-meta {
    opacity: 0.7;
  }
  .timing-grid-line, .timing-lane-separator {
    stroke: ${lineColor};
    stroke-width: 1;
    opacity: 0.2;
  }
  .timing-lane-background.even {
    fill: ${primaryColor};
    opacity: 0.12;
  }
  .timing-lane-background.odd {
    fill: transparent;
  }
  .timing-wave, .timing-transition {
    fill: none;
    stroke: ${lineColor};
    stroke-width: 2;
    stroke-linecap: square;
    stroke-linejoin: round;
  }
  .timing-wave.unknown, .timing-wave.high-impedance {
    stroke-dasharray: 4 3;
  }
  .timing-bus-segment, .timing-state-segment {
    stroke: ${primaryBorderColor};
    stroke-width: 1.5;
  }
  .timing-bus-segment {
    fill: ${primaryColor};
  }
  .timing-state-segment {
    fill: ${secondaryColor};
  }
  .timing-bus-segment.unknown, .timing-state-segment.unknown,
  .timing-bus-segment.high-impedance, .timing-state-segment.high-impedance {
    fill: ${tertiaryColor};
    stroke-dasharray: 4 3;
  }
  .timing-bus-label, .timing-state-label {
    fill: ${primaryTextColor};
    font-size: 11px;
    pointer-events: none;
  }
  .timing-analog-point {
    fill: ${lineColor};
    stroke: none;
  }
  `;
};

export default styles;
