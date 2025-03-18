import { log } from '../../logger.js';
import { cleanAndMerge } from '../../utils.js';
import { getConfig as commonGetConfig } from '../../config.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import type { EventModelingDB } from './types.js';

import DEFAULT_CONFIG from '../../defaultConfig.js';

import type { EventModelingDiagramConfig } from '../../config.type.js';
import type { EventModeling } from '@mermaid-js/parser';

export const setOptions = function (rawOptString: string) {
  log.debug('options str', rawOptString);
  // rawOptString = rawOptString?.trim();
  // rawOptString = rawOptString || '{}';
  // try {
  //   state.records.options = JSON.parse(rawOptString);
  // } catch (e: any) {
  //   log.error('error while parsing gitGraph options', e.message);
  // }
};

export const getOptions = function () {
  // return state.records.options;
  return {};
};

export const clear = function () {
  // state.reset();
  commonClear();
};

export const getDirection = function () {
  // return state.records.direction;
  return 'the direction';
};

const DEFAULT_EVENTMODELING_CONFIG: Required<EventModelingDiagramConfig> =
  DEFAULT_CONFIG.eventmodeling;
const getConfig = (): Required<EventModelingDiagramConfig> => {
  const config = cleanAndMerge({
    ...DEFAULT_EVENTMODELING_CONFIG,
    ...commonGetConfig().eventmodeling,
  });
  return config;
};

export interface EmState {
  ast?: EventModeling;
}

const store: EmState = {};

function getAst(): EventModeling | undefined {
  return store.ast;
}

function setAst(ast: EventModeling) {
  store.ast = ast;
}

export const db: EventModelingDB = {
  getConfig,

  setOptions,
  getOptions,
  clear,

  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,

  getAst,
  setAst,
};
