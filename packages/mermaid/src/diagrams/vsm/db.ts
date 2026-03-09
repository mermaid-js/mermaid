import { getConfig as commonGetConfig } from '../../config.js';
import type { BaseDiagramConfig } from '../../config.type.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { VsmDB, VsmData, VsmFlowItem, VsmStep, VsmQueue, VsmSummary } from './types.js';

const defaultData: VsmData = {
  flow: [],
  steps: [],
  queues: [],
  summary: undefined,
};

let data: VsmData = structuredClone(defaultData);

const getConfig = (): Required<BaseDiagramConfig> => {
  return commonGetConfig() as Required<BaseDiagramConfig>;
};

const getFlow = (): VsmFlowItem[] => data.flow;
const getSteps = (): VsmStep[] => data.steps;
const getQueues = (): VsmQueue[] => data.queues;
const getSummary = (): VsmSummary | undefined => data.summary;

const setFlow = (flow: VsmFlowItem[]) => {
  data.flow = flow;
};

const setSteps = (steps: VsmStep[]) => {
  data.steps = steps;
};

const setQueues = (queues: VsmQueue[]) => {
  data.queues = queues;
};

const setSummary = (summary: VsmSummary) => {
  data.summary = summary;
};

const clear = () => {
  commonClear();
  data = structuredClone(defaultData);
};

export const db: VsmDB = {
  getFlow,
  getSteps,
  getQueues,
  getSummary,
  setFlow,
  setSteps,
  setQueues,
  setSummary,
  getConfig,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
