import type { WardleyDiagramConfig } from '../../config.type.js';
import { getConfig as commonGetConfig } from '../../config.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { cleanAndMerge } from '../../utils.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import type { WardleyThemeVars } from './types.js';

// Evolution stages and labels
export const DEFAULT_EVOLUTION_STAGES = ['Genesis', 'Custom Built', 'Product', 'Commodity'];
export const DEFAULT_Y_AXIS_LABEL = 'Visibility';
export const DEFAULT_X_AXIS_LABEL = 'Evolution';

const DEFAULT_WARDLEY_CONFIG: Required<WardleyDiagramConfig> = DEFAULT_CONFIG.wardley;

export const getWardleyConfig = (): Required<WardleyDiagramConfig> => {
  return cleanAndMerge({
    ...DEFAULT_WARDLEY_CONFIG,
    ...commonGetConfig().wardley,
  });
};

export const getWardleyThemeVars = (): WardleyThemeVars => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = commonGetConfig();
  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);
  return themeVariables.wardley as WardleyThemeVars;
};

// Canvas sizing constants
export const CANVAS_SIZING = {
  verticalSpacing: 0.1,
  verticalMultiplier: 1100,
  horizontalMultiplier: 1400,
  minHeight: 250,
  minWidth: 600,
};

// Stage background styling
export const STAGE_BACKGROUND_STYLE = {
  strokeWidth: 0.5,
  opacity: 0.5,
};

// Stage label styling
export const STAGE_LABEL_STYLE = {
  fontSize: '11px',
  fontWeight: 'bold',
  offset: -15,
};

// Axis styling
export const AXIS_STYLE = {
  strokeWidth: 1,
};

// Axis label styling
export const AXIS_LABEL_STYLE = {
  fontSize: '12px',
  fontWeight: 'bold',
  yAxisOffset: 15,
  xAxisOffset: -5,
};

// Edge styling
export const EDGE_STYLE = {
  strokeWidth: 1,
  opacity: 0.5,
  curveAmountFactor: 0.15,
  maxCurveAmount: 40,
};

// Arrow marker styling
export const ARROW_MARKER = {
  width: 12,
  height: 12,
  refX: 10,
  refY: 3.5,
  points: '0 0, 10 3.5, 0 7',
};

// Component circle styling
export const COMPONENT_STYLE = {
  strokeWidth: 0.8,
  opacity: 0.9,
};

// Component label styling
export const LABEL_STYLE = {
  fontSize: '9px',
  fontWeight: '600',
  borderWidth: 0.5,
  borderRadius: 3,
  backgroundOpacity: 0.9,
  height: 16,
  offsetAbove: 18,
  offsetBelow: -20,
  charWidth: 5.5,
  maxWidth: 90,
  truncationLength: 16,
  truncationChars: 13,
};

/**
 * Get component color based on x position (evolution axis, 0-1).
 * Colors are read from theme at call time.
 */
export const getComponentColor = (x: number): string => {
  const theme = getWardleyThemeVars();
  if (x < 0.25) {
    return theme.genesisColor;
  }
  if (x < 0.5) {
    return theme.customColor;
  }
  if (x < 0.75) {
    return theme.productColor;
  }
  return theme.commodityColor;
};

export const getStageBackgroundColors = (): [string, string, string, string] => {
  const theme = getWardleyThemeVars();
  return [
    theme.stageBackground0,
    theme.stageBackground1,
    theme.stageBackground2,
    theme.stageBackground3,
  ];
};
