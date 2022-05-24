import { sanitizeText as _sanitizeText } from './diagrams/common/common';
import { getConfig } from './config';
let title = '';
let diagramTitle = '';
let description = '';
const sanitizeText = (txt) => _sanitizeText(txt, getConfig());

export const clear = function () {
  title = '';
  description = '';
  diagramTitle = '';
};

export const setAccTitle = function (txt) {
  title = sanitizeText(txt).replace(/^\s+/g, '');
};

export const getAccTitle = function () {
  return title || diagramTitle;
};

export const setAccDescription = function (txt) {
  description = sanitizeText(txt).replace(/\n\s+/g, '\n');
};

export const getAccDescription = function () {
  return description;
};

export const setDiagramTitle = function (txt) {
  diagramTitle = sanitizeText(txt);
};

export const getDiagramTitle = function () {
  return diagramTitle;
};

export default {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle: getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear,
};
