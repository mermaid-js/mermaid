/**
 *
 */
import { logger } from '../../logger';
import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';

let sections = {};
let title = '';

export const parseDirective = function(statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

const addSection = function(id, value) {
  if (typeof sections[id] === 'undefined') {
    sections[id] = value;
    logger.debug('Added new section :', id);
  }
};
const getSections = () => sections;

const setTitle = function(txt) {
  title = txt;
};

const getTitle = function() {
  return title;
};
const cleanupValue = function(value) {
  if (value.substring(0, 1) === ':') {
    value = value.substring(1).trim();
    return Number(value.trim());
  } else {
    return Number(value.trim());
  }
};

const clear = function() {
  sections = {};
  title = '';
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
  getTitle
  // parseError
};
