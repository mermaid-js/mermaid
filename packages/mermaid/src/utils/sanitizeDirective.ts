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

const THEME_VARIABLE_VALUE_PATTERN = /^[\d "#%(),.;A-Za-z]+$/;

// themeVariables can nest plain color leaves under a namespace object (treeView,
// packet, ...), so this has to walk down into them instead of only checking the
// top-level keys, or a nested leaf could carry a value the top-level check would
// otherwise have blanked out.
const sanitizeThemeVariables = (themeVariables: Record<string, unknown>): void => {
  for (const key of Object.keys(themeVariables)) {
    const value = themeVariables[key];
    if (value && typeof value === 'object') {
      sanitizeThemeVariables(value as Record<string, unknown>);
    } else if (typeof value === 'string' && !THEME_VARIABLE_VALUE_PATTERN.test(value)) {
      themeVariables[key] = '';
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
    sanitizeThemeVariables(args.themeVariables);
  }
  log.debug('After sanitization', args);
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
