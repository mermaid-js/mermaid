import { sanitizeText as _sanitizeText } from './diagrams/common/common';
import { getConfig } from './config';
let title = '';
let diagramTitle = '';
let description = '';
const sanitizeText = (txt: string): string => _sanitizeText(txt, getConfig());

export const clear = function (): void {
  title = '';
  description = '';
  diagramTitle = '';
};

export const setAccTitle = function (txt: string): void {
  title = sanitizeText(txt).replace(/^\s+/g, '');
};

export const getAccTitle = function (): string {
  return title || diagramTitle;
};

export const setAccDescription = function (txt: string): void {
  description = sanitizeText(txt).replace(/\n\s+/g, '\n');
};

export const getAccDescription = function (): string {
  return description;
};

export const setDiagramTitle = function (txt: string): void {
  diagramTitle = sanitizeText(txt);
};

export const getDiagramTitle = function (): string {
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
