import { getThemeVariables as baseThemeVariables } from './theme-base';
import { getThemeVariables as darkThemeVariables } from './theme-dark';
import { getThemeVariables as defaultThemeVariables } from './theme-default';
import { getThemeVariables as forestThemeVariables } from './theme-forest';
import { getThemeVariables as neutralThemeVariables } from './theme-neutral';

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
