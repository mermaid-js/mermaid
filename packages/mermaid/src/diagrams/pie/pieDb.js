import { log } from '../../logger.ts';
import mermaidAPI from '../../mermaidAPI.ts';
import * as configApi from '../../config.ts';
import common from '../common/common.ts';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb.ts';

let sections = {};
let showData = false;

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

const addSection = function (id, value) {
  id = common.sanitizeText(id, configApi.getConfig());
  if (sections[id] === undefined) {
    sections[id] = value;
    log.debug('Added new section :', id);
  }
};
const getSections = () => sections;

const setShowData = function (toggle) {
  showData = toggle;
};

const getShowData = function () {
  return showData;
};

const cleanupValue = function (value) {
  if (value.substring(0, 1) === ':') {
    value = value.substring(1).trim();
    return Number(value.trim());
  } else {
    return Number(value.trim());
  }
};

const clear = function () {
  sections = {};
  showData = false;
  commonClear();
};

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().pie,
  addSection,
  getSections,
  cleanupValue,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  setShowData,
  getShowData,
  getAccDescription,
  setAccDescription,
};
