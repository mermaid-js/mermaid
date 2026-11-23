import { sanitizeText as _sanitizeText } from './common.js';
import { getConfig } from '../../config.js';
import { entityDecode } from '../../utils.js';

let accTitle = '';
let diagramTitle = '';
let accDescription = '';

const sanitizeText = (txt: string): string => _sanitizeText(txt, getConfig());

/**
 * Sanitizes the text and decodes the HTML entities DOMPurify adds, since these values are
 * rendered as plain text. Without a DOM there is nothing to decode with, so the sanitized
 * text is returned as is.
 */
const sanitizePlainText = (txt: string): string => {
  const sanitized = sanitizeText(txt);
  if (!sanitized.includes('&') || typeof document === 'undefined') {
    return sanitized;
  }
  return entityDecode(sanitized);
};

export const clear = (): void => {
  accTitle = '';
  accDescription = '';
  diagramTitle = '';
};

export const setAccTitle = (txt: string): void => {
  accTitle = sanitizePlainText(txt).replace(/^\s+/g, '');
};

export const getAccTitle = (): string => accTitle;

export const setAccDescription = (txt: string): void => {
  accDescription = sanitizePlainText(txt).replace(/\n\s+/g, '\n');
};

export const getAccDescription = (): string => accDescription;

export const setDiagramTitle = (txt: string): void => {
  diagramTitle = sanitizePlainText(txt);
};

export const getDiagramTitle = (): string => diagramTitle;
