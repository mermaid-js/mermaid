import { sanitizeText as _sanitizeText } from './common.js';
import { getConfig } from '../../config.js';

let accTitle = '';
let diagramTitle = '';
let accDescription = '';

const sanitizeText = (txt: string): string => _sanitizeText(txt, getConfig());

export const clear = (): void => {
  accTitle = '';
  accDescription = '';
  diagramTitle = '';
};

export const setAccTitle = (txt: string): void => {
  accTitle = sanitizeText(txt).replace(/^\s+/g, '');
};

export const getAccTitle = (): string => accTitle;

export const setAccDescription = (txt: string): void => {
  accDescription = sanitizeText(txt).replace(/\n\s+/g, '\n');
};

export const getAccDescription = (): string => accDescription;

export const setDiagramTitle = (txt: string): void => {
  diagramTitle = sanitizeText(txt);
};

export const getDiagramTitle = (): string => diagramTitle;
