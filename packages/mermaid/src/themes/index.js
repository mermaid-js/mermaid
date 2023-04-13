import { getThemeVariables as baseThemeVariables } from './theme-base.js';
import { getThemeVariables as darkThemeVariables } from './theme-dark.js';
import { getThemeVariables as defaultThemeVariables } from './theme-default.js';
import { getThemeVariables as forestThemeVariables } from './theme-forest.js';
import { getThemeVariables as neutralThemeVariables } from './theme-neutral.js';

export default {
  base: {
    getThemeVariables: baseThemeVariables,
  },
  dark: {
    getThemeVariables: darkThemeVariables,
  },
  default: {
    getThemeVariables: defaultThemeVariables,
  },
  forest: {
    getThemeVariables: forestThemeVariables,
  },
  neutral: {
    getThemeVariables: neutralThemeVariables,
  },
};
