import { configKeys } from '../defaultConfig.js';
import { log } from '../logger.js';

/**
 * Dictionary-style configs have arbitrary user-defined keys, so instead of
 * checking the keys against configKeys, their values are validated against a
 * pattern (and suspicious keys are dropped).
 */
const DICTIONARY_CONFIG_PATTERNS: Record<string, RegExp> = {
  // CSS colors (sankey)
  nodeColors: /^#[\da-f]{3,8}$|^rgb\([\d\s%,.]+\)$|^hsl\([\d\s%,.]+\)$|^[a-z]+$/i,
  // iconify icon references (treeView filenameIcons/extensionIcons)
  filenameIcons: /^[\w-]+(?::[\w-]+)?$/,
  extensionIcons: /^[\w-]+(?::[\w-]+)?$/,
};

const sanitizeDictionaryConfig = (dict: Record<string, unknown>, valuePattern: RegExp): void => {
  for (const key of Object.keys(dict)) {
    const value = dict[key];
    if (
      key.startsWith('__') ||
      key.includes('proto') ||
      key.includes('constr') ||
      typeof value !== 'string' ||
      !valuePattern.test(value)
    ) {
      log.debug('sanitize deleting dictionary entry:', key, value);
      delete dict[key];
    }
  }
};

/**
 * Sanitizes directive objects
 *
 * @param args - Directive's JSON
 */
export const sanitizeDirective = (args: any): void => {
  log.debug('sanitizeDirective called with', args);

  // Return if not an object
  if (typeof args !== 'object' || args == null) {
    return;
  }

  // Sanitize each element if an array
  if (Array.isArray(args)) {
    args.forEach((arg) => sanitizeDirective(arg));
    return;
  }

  // Sanitize each key if an object
  for (const key of Object.keys(args)) {
    log.debug('Checking key', key);
    if (
      key.startsWith('__') ||
      key.includes('proto') ||
      key.includes('constr') ||
      !configKeys.has(key) ||
      args[key] == null
    ) {
      log.debug('sanitize deleting key: ', key);
      delete args[key];
      continue;
    }

    // Recurse if an object, but handle dictionary-style configs specially
    // (like nodeColors or filenameIcons) by validating their values instead
    if (typeof args[key] === 'object') {
      const valuePattern = DICTIONARY_CONFIG_PATTERNS[key];
      if (valuePattern) {
        sanitizeDictionaryConfig(args[key], valuePattern);
      } else {
        log.debug('sanitizing object', key);
        sanitizeDirective(args[key]);
      }
      continue;
    }

    const cssMatchers = ['themeCSS', 'fontFamily', 'altFontFamily'];
    for (const cssKey of cssMatchers) {
      if (key.includes(cssKey)) {
        log.debug('sanitizing css option', key);
        args[key] = sanitizeCss(args[key]);
      }
    }
  }

  if (args.themeVariables) {
    blankUnsafeCssValues(args.themeVariables);
    // The bpmn values are written into the stylesheet like the top-level ones.
    if (args.themeVariables.bpmn && typeof args.themeVariables.bpmn === 'object') {
      blankNonCssValues(args.themeVariables.bpmn);
    }
  }
  log.debug('After sanitization', args);
};

// Every bpmn value is a colour or a width that the stylesheet writes out as text, and a
// template literal turns an array or an object into text this check never saw, so only a
// safe string or a finite number may stay.
const blankNonCssValues = (values: Record<string, unknown>): void => {
  blankUnsafeCssValues(values);
  for (const k of Object.keys(values)) {
    const val = values[k];
    if (typeof val !== 'string' && !(typeof val === 'number' && Number.isFinite(val))) {
      values[k] = '';
    }
  }
};

const blankUnsafeCssValues = (values: Record<string, unknown>): void => {
  for (const k of Object.keys(values)) {
    const val = values[k];
    if (typeof val === 'string' && !/^[\d "#%(),.;A-Za-z]+$/.test(val)) {
      values[k] = '';
    }
  }
};

export const sanitizeCss = (str: string): string => {
  let startCnt = 0;
  let endCnt = 0;

  for (const element of str) {
    if (startCnt < endCnt) {
      return '{ /* ERROR: Unbalanced CSS */ }';
    }
    if (element === '{') {
      startCnt++;
    } else if (element === '}') {
      endCnt++;
    }
  }
  if (startCnt !== endCnt) {
    return '{ /* ERROR: Unbalanced CSS */ }';
  }
  // Todo add more checks here
  return str;
};
