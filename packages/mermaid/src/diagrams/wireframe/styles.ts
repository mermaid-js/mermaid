import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { getConfig } from '../../config.js';

const getStyles: DiagramStylesProvider = (options = {}) => {
  const config = getConfig();
  const wireframeConfig = config.wireframe ?? {};
  const globalConfig = config as Record<string, unknown>;
  const themeVars = config.themeVariables ?? {};
  const opts = options as Record<string, unknown>;

  const getOpt = (key: string, fallback: string): string => {
    const val =
      (wireframeConfig as Record<string, unknown>)[key] ??
      globalConfig[key] ??
      (themeVars as Record<string, unknown>)[key] ??
      opts[key] ??
      fallback;
    if (typeof val === 'string') {
      return val;
    }
    if (typeof val === 'number') {
      return `${val}px`;
    }
    return fallback;
  };

  const fontFamily = getOpt(
    'fontFamily',
    "'Chalkboard SE', 'Comic Neue', 'Comic Sans MS', cursive, sans-serif"
  );
  const fontSize = getOpt('fontSize', '14px');
  const mainBkg = getOpt('mainBkg', '#ffffff');
  const textColor = getOpt('textColor', '#2c2c2c');
  const primaryColor = getOpt('primaryColor', '#2563eb');
  const primaryTextColor = getOpt('primaryTextColor', '#ffffff');
  const secondaryColor = getOpt('secondaryColor', '#f3f4f6');
  const tertiaryColor = getOpt('tertiaryColor', '#e5e7eb');
  const lineColor = getOpt('lineColor', '#2c2c2c');
  const primaryBorderColor = getOpt('primaryBorderColor', lineColor);

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
    rx: 5px;
    ry: 5px;
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
