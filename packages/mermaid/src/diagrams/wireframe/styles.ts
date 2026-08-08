import type { DiagramStylesProvider } from '../../diagram-api/types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStyles: DiagramStylesProvider = (options: any) => `
  .wireframe-sketch {
    font-family: ${options?.fontFamily ?? "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif"};
    font-size: ${options?.fontSize ?? '14px'};
  }
  
  .wireframe-container {
    fill: ${options?.mainBkg ?? '#ffffff'};
    stroke: ${options?.primaryBorderColor ?? options?.lineColor ?? '#2c2c2c'};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
    rx: 6px;
    ry: 6px;
  }
  
  .wireframe-container-title {
    font-family: ${options?.fontFamily ?? "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif"};
    font-weight: bold;
    font-size: 15px;
    fill: ${options?.textColor ?? '#2c2c2c'};
  }
  
  .wireframe-action-bar {
    fill: ${options?.secondaryColor ?? '#f3f4f6'};
    stroke: ${options?.primaryBorderColor ?? options?.lineColor ?? '#2c2c2c'};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  .wireframe-action-button {
    fill: ${options?.mainBkg ?? '#ffffff'};
    stroke: ${options?.primaryBorderColor ?? '#444444'};
    stroke-width: 1.5px;
    stroke-linecap: round;
    rx: 4px;
    ry: 4px;
    cursor: pointer;
  }
  
  .wireframe-action-button-primary {
    fill: ${options?.primaryColor ?? '#2563eb'};
    stroke: ${options?.primaryBorderColor ?? '#1d4ed8'};
    color: ${options?.primaryTextColor ?? '#ffffff'};
  }
  
  .wireframe-text {
    font-family: ${options?.fontFamily ?? "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif"};
    font-size: ${options?.fontSize ?? '14px'};
    fill: ${options?.textColor ?? '#2c2c2c'};
  }
  
  .wireframe-input {
    fill: ${options?.mainBkg ?? '#ffffff'};
    stroke: ${options?.primaryBorderColor ?? options?.lineColor ?? '#333333'};
    stroke-width: 1.8px;
    stroke-linecap: round;
    rx: 5px;
    ry: 5px;
  }
  
  .wireframe-button {
    fill: ${options?.tertiaryColor ?? '#e5e7eb'};
    stroke: ${options?.primaryBorderColor ?? options?.lineColor ?? '#333333'};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
    rx: 5px;
    ry: 5px;
  }
  
  .wireframe-button-primary {
    fill: ${options?.primaryColor ?? '#2563eb'};
    stroke: ${options?.primaryBorderColor ?? '#1d4ed8'};
  }
  
  .wireframe-tab {
    fill: ${options?.secondaryColor ?? '#e5e7eb'};
    stroke: ${options?.primaryBorderColor ?? '#444444'};
    stroke-width: 1.8px;
    stroke-linecap: round;
  }
  
  .wireframe-tab-active {
    fill: ${options?.mainBkg ?? '#ffffff'};
    font-weight: bold;
  }
  
  .wireframe-rule {
    stroke: ${options?.lineColor ?? '#666666'};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-dasharray: 4 2;
  }
  
  .wireframe-checkbox-box {
    fill: ${options?.mainBkg ?? '#ffffff'};
    stroke: ${options?.primaryBorderColor ?? options?.lineColor ?? '#333333'};
    stroke-width: 1.8px;
  }
  
  .wireframe-checkmark {
    stroke: ${options?.primaryColor ?? '#2563eb'};
    stroke-width: 2.5px;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  
  .wireframe-radio-circle {
    fill: ${options?.mainBkg ?? '#ffffff'};
    stroke: ${options?.primaryBorderColor ?? options?.lineColor ?? '#333333'};
    stroke-width: 1.8px;
  }
  
  .wireframe-radio-dot {
    fill: ${options?.primaryColor ?? '#2563eb'};
  }

  .wireframe-dropdown-arrow {
    fill: ${options?.textColor ?? '#444444'};
  }

  .wireframe-title-bar {
    fill: ${options?.secondaryColor ?? '#e5e7eb'};
    stroke: ${options?.primaryBorderColor ?? '#333333'};
    stroke-width: 1.5px;
  }

  .wireframe-icon-box {
    fill: ${options?.tertiaryColor ?? '#f3f4f6'};
    stroke: ${options?.primaryBorderColor ?? '#666666'};
    stroke-width: 1.5px;
  }

  .wireframe-menu-box {
    fill: ${options?.mainBkg ?? '#ffffff'};
    stroke: ${options?.primaryBorderColor ?? '#333333'};
    stroke-width: 1.8px;
    filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.1));
  }

  .wireframe-bold {
    font-weight: bold;
  }
`;

export default getStyles;
