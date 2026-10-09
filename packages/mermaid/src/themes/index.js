import { getThemeVariables as baseThemeVariables } from './theme-base.js';
import { getThemeVariables as darkThemeVariables } from './theme-dark.js';
import { getThemeVariables as defaultThemeVariables } from './theme-default.js';
import { getThemeVariables as forestThemeVariables } from './theme-forest.js';
import { getThemeVariables as neutralThemeVariables } from './theme-neutral.js';
import { getThemeVariables as neoThemeVariables } from './theme-neo.js';
import { getThemeVariables as neoDarkThemeVariables } from './theme-neo-dark.js';
import { getThemeVariables as reduxThemeVariables } from './theme-redux.js';
import { getThemeVariables as reduxDarkThemeVariables } from './theme-redux-dark.js';
import { getThemeVariables as reduxColorThemeVariables } from './theme-redux-color.js';
import { getThemeVariables as reduxDarkColorThemeVariables } from './theme-redux-dark-color.js';

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
  neo: {
    getThemeVariables: neoThemeVariables,
  },
  'neo-dark': {
    getThemeVariables: neoDarkThemeVariables,
  },
  redux: {
    getThemeVariables: reduxThemeVariables,
  },
  'redux-dark': {
    getThemeVariables: reduxDarkThemeVariables,
  },
  'redux-color': {
    getThemeVariables: reduxColorThemeVariables,
  },
  'redux-dark-color': {
    getThemeVariables: reduxDarkColorThemeVariables,
  },
};
