import { log } from '../../logger';
import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';
import common from '../common/common';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../../commonDb';

let sections = {};
let title = '';
let description = '';
let showData = false;

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

const addSection = function (id, value) {
  id = common.sanitizeText(id, configApi.getConfig());
  if (typeof sections[id] === 'undefined') {
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
  title = '';
  showData = false;
  commonClear();
};

export const setDiagramTitle = function (txt) {
  let sanitizedText = common.sanitizeText(txt, configApi.getConfig());
  title = sanitizedText;
};

export const getDiagramTitle = function () {
  return title;
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
