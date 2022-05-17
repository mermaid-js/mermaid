import { sanitizeText as _sanitizeText } from './diagrams/common/common';
import { getConfig } from './config';
let title = '';
let description = '';
const sanitizeText = (txt) => _sanitizeText(txt, getConfig());

export const clear = function () {
  title = '';
  description = '';
};

export const setAccTitle = function (txt) {
  title = sanitizeText(txt).replace(/^\s+/g, '');
};

export const getTitle = function () {
  return title;
};

export const setAccDescription = function (txt) {
  description = sanitizeText(txt).replace(/\n\s+/g, '\n');
};

export const getAccDescription = function () {
  return description;
};

export default {
  setAccTitle,
  getTitle,
  getAccDescription,
  setAccDescription,
  clear,
};
