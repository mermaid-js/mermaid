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
      // Nested option objects whose keys are not top-level MermaidConfig keys.
      if (key === 'cssVariableTheme' || key === 'webCompatibility') {
        sanitizeSvgPostProcessOptions(key, args[key]);
        continue;
      }
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
    for (const k of Object.keys(args.themeVariables)) {
      const val = args.themeVariables[k];
      if (val?.match && !val.match(/^[\d "#%(),.;A-Za-z]+$/)) {
        args.themeVariables[k] = '';
      }
    }
  }
  log.debug('After sanitization', args);
};

/** Reject `"`, `<`, `>`, `)`, `;` so values cannot break out of SVG attrs / CSS `var()`. */
const SAFE_OPTION_STRING = /^[^");<>]+$/;
const CSS_VAR_PREFIX = /^(--)?[\w-]*$/;

const CSS_VARIABLE_THEME_NESTED = new Set(['prefix']);
const WEB_COMPATIBILITY_NESTED = new Set([
  'responsiveWidth',
  'responsiveHeight',
  'ensureViewBox',
  'stripBackground',
  'preserveAspectRatio',
]);

const sanitizeSvgPostProcessOptions = (
  topKey: 'cssVariableTheme' | 'webCompatibility',
  opts: Record<string, unknown>
): void => {
  const allowed =
    topKey === 'cssVariableTheme' ? CSS_VARIABLE_THEME_NESTED : WEB_COMPATIBILITY_NESTED;
  for (const nested of Object.keys(opts)) {
    const value = opts[nested];
    if (
      nested.startsWith('__') ||
      nested.includes('proto') ||
      nested.includes('constr') ||
      !allowed.has(nested)
    ) {
      log.debug('sanitize deleting nested key:', topKey, nested);
      delete opts[nested];
      continue;
    }
    if (nested === 'prefix') {
      if (
        typeof value !== 'string' ||
        !CSS_VAR_PREFIX.test(value) ||
        !SAFE_OPTION_STRING.test(value)
      ) {
        log.debug('sanitize deleting invalid prefix:', value);
        delete opts[nested];
      }
      continue;
    }
    if (nested === 'preserveAspectRatio') {
      if (typeof value === 'boolean') {
        continue;
      }
      if (typeof value !== 'string' || !SAFE_OPTION_STRING.test(value)) {
        log.debug('sanitize deleting invalid preserveAspectRatio:', value);
        delete opts[nested];
      }
      continue;
    }
    if (typeof value !== 'boolean') {
      log.debug('sanitize deleting non-boolean nested option:', nested, value);
      delete opts[nested];
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
