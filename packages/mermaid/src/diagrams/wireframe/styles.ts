import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { getConfig as getConfigAPI } from '../../config.js';

const COLOR_VALUE_PATTERN =
  /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$|^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([\d\s%+,./-]+\)$|^[a-z]+$/i;

const FONT_FAMILY_PATTERN = /^[\w "',.-]+$/;

const FONT_SIZE_PATTERN = /^\d+(?:\.\d+)?(?:px|em|rem|pt|%)?$/i;

const sanitizeColor = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return COLOR_VALUE_PATTERN.test(normalized) ? normalized : fallback;
};

const sanitizeFontFamily = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return FONT_FAMILY_PATTERN.test(normalized) ? normalized : fallback;
};

const sanitizeFontSize = (value: unknown, fallback: string): string => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return `${value}px`;
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (FONT_SIZE_PATTERN.test(normalized)) {
      return /^\d+(?:\.\d+)?$/.test(normalized) ? `${normalized}px` : normalized;
    }
  }
  return fallback;
};

const getStyles: DiagramStylesProvider = (options = {}) => {
  const defaultThemeVariables = getThemeVariables();
  const config = getConfigAPI();
  const themeVars = cleanAndMerge(
    defaultThemeVariables,
    config.themeVariables
  ) as unknown as Record<string, unknown>;
  const opts = (options ?? {}) as Record<string, unknown>;
  const wireframeOpts = (opts.wireframe ?? config.wireframe ?? {}) as Record<string, unknown>;

  const getRawOpt = (key: string): unknown => {
    return wireframeOpts[key] ?? opts[key] ?? themeVars[key];
  };

  const DEFAULT_FONT_FAMILY = "'Comic Sans MS', 'Comic Neue', 'Chalkboard SE', cursive, sans-serif";

  const fontFamily = sanitizeFontFamily(getRawOpt('fontFamily'), DEFAULT_FONT_FAMILY);
  const fontSize = sanitizeFontSize(getRawOpt('fontSize'), '14px');
  const mainBkg = sanitizeColor(getRawOpt('mainBkg'), '#ffffff');
  const textColor = sanitizeColor(getRawOpt('textColor'), '#2c2c2c');
  const primaryColor = sanitizeColor(getRawOpt('primaryColor'), '#2563eb');
  const primaryTextColor = sanitizeColor(getRawOpt('primaryTextColor'), '#ffffff');
  const secondaryColor = sanitizeColor(getRawOpt('secondaryColor'), '#f3f4f6');
  const tertiaryColor = sanitizeColor(getRawOpt('tertiaryColor'), '#e5e7eb');
  const lineColor = sanitizeColor(getRawOpt('lineColor'), '#2c2c2c');
  const primaryBorderColor = sanitizeColor(getRawOpt('primaryBorderColor'), lineColor);
  const dotCloseColor = sanitizeColor(getRawOpt('dotCloseColor'), '#ff5f56');
  const dotMinimizeColor = sanitizeColor(getRawOpt('dotMinimizeColor'), '#ffbd2e');
  const dotMaximizeColor = sanitizeColor(getRawOpt('dotMaximizeColor'), '#27c93f');

  return `
  .wireframe-sketch {
    font-family: ${fontFamily};
    font-size: ${fontSize};
  }
  
  .wireframe-container {
    fill: ${mainBkg};
    stroke: ${primaryBorderColor};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
    rx: 6px;
    ry: 6px;
  }
  
  .wireframe-container-title {
    font-family: ${fontFamily};
    font-weight: bold;
    font-size: 15px;
    fill: ${textColor};
  }
  
  .wireframe-action-bar {
    fill: ${secondaryColor};
    stroke: ${primaryBorderColor};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  .wireframe-action-button {
    fill: ${mainBkg};
    stroke: ${primaryBorderColor};
    stroke-width: 1.5px;
    stroke-linecap: round;
    rx: 4px;
    ry: 4px;
    cursor: pointer;
  }
  
  .wireframe-action-button-primary {
    fill: ${primaryColor};
    stroke: ${primaryBorderColor};
    color: ${primaryTextColor};
  }
  
  .wireframe-text {
    font-family: ${fontFamily};
    font-size: ${fontSize};
    fill: ${textColor};
  }
  
  .wireframe-text-primary {
    fill: ${primaryTextColor};
  }
  
  .wireframe-input {
    fill: ${mainBkg};
    stroke: ${primaryBorderColor};
    stroke-width: 1.8px;
    stroke-linecap: round;
  }
  
  .wireframe-button {
    fill: ${tertiaryColor};
    stroke: ${primaryBorderColor};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
    rx: 5px;
    ry: 5px;
  }
  
  .wireframe-button-primary {
    fill: ${primaryColor};
    stroke: ${primaryBorderColor};
  }
  
  .wireframe-tab {
    fill: ${secondaryColor};
    stroke: ${primaryBorderColor};
    stroke-width: 1.8px;
    stroke-linecap: round;
  }
  
  .wireframe-tab-active {
    fill: ${mainBkg};
    font-weight: bold;
  }
  
  .wireframe-rule {
    stroke: ${lineColor};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-dasharray: 4 2;
  }

  .wireframe-arrow-head {
    fill: ${lineColor};
    stroke: ${lineColor};
  }
  
  .wireframe-checkbox-box {
    fill: ${mainBkg};
    stroke: ${primaryBorderColor};
    stroke-width: 1.8px;
  }
  
  .wireframe-checkmark {
    stroke: ${primaryColor};
    stroke-width: 2.5px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  .wireframe-radio-circle {
    fill: ${mainBkg};
    stroke: ${primaryBorderColor};
    stroke-width: 1.8px;
  }
  
  .wireframe-radio-dot {
    fill: ${primaryColor};
  }

  .wireframe-dropdown-arrow {
    fill: ${textColor};
  }

  .wireframe-title-bar {
    fill: ${secondaryColor};
    stroke: ${primaryBorderColor};
    stroke-width: 1.5px;
  }

  .wireframe-title-bar-dot {
    stroke: none;
  }

  .wireframe-title-bar-dot-close {
    fill: ${dotCloseColor};
  }

  .wireframe-title-bar-dot-minimize {
    fill: ${dotMinimizeColor};
  }

  .wireframe-title-bar-dot-maximize {
    fill: ${dotMaximizeColor};
  }

  .wireframe-icon-box {
    fill: ${tertiaryColor};
    stroke: ${primaryBorderColor};
    stroke-width: 1.5px;
  }

  .wireframe-menu-box {
    fill: ${mainBkg};
    stroke: ${primaryBorderColor};
    stroke-width: 1.8px;
    filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.1));
  }

  .wireframe-bold {
    font-weight: bold;
  }

  .wireframe-italic {
    font-style: italic;
  }

  .wireframe-underline {
    text-decoration: underline;
  }

  .wireframe-strikethrough {
    text-decoration: line-through;
  }

  .wireframe-text-small {
    font-size: 10px;
  }

  .wireframe-fieldset-legend-bg {
    fill: ${mainBkg};
    stroke: ${primaryBorderColor};
    stroke-width: 1.5px;
  }

  .wireframe-section-header {
    fill: ${secondaryColor};
  }

  .wireframe-section-divider {
    stroke: ${primaryBorderColor};
    stroke-width: 1.5px;
  }
`;
};

export default getStyles;
