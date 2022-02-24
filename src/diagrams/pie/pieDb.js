import { log } from '../../logger';
import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';
import common from '../common/common';
const sanitizeText = (txt) => common.sanitizeText(txt, configApi.getConfig());

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

const setTitle = function (txt) {
  title = common.sanitizeText(txt, configApi.getConfig());
};

const setShowData = function (toggle) {
  showData = toggle;
};

const getShowData = function () {
  return showData;
};

const getTitle = function () {
  return title;
};

const setAccDescription = function (txt) {
  description = common.sanitizeText(txt, configApi.getConfig());
};

const getAccDescription = function () {
  return description;
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
};
// export const parseError = (err, hash) => {
//   global.mermaidAPI.parseError(err, hash)
// }

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().pie,
  addSection,
  getSections,
  cleanupValue,
  clear,
  setTitle,
  getTitle,
  setShowData,
  getShowData,
  getAccDescription,
  setAccDescription,
  // parseError
};
