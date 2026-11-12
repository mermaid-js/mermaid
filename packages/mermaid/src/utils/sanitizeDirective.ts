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

const GRID_PLACEMENT_ALIGNMENTS: Record<string, ReadonlySet<unknown>> = {
  horizontalAlign: new Set(['left', 'center', 'right']),
  verticalAlign: new Set(['top', 'center', 'bottom']),
};

/**
 * `grid.placements` is keyed by node or group id, so its keys cannot be
 * checked against configKeys. Any id is allowed (apart from suspicious ones),
 * and each entry keeps only the placement fields declared in the config
 * schema. Coordinates only need to be numbers here; the grid layout reports
 * out-of-range values itself.
 */
const sanitizeGridPlacements = (placements: Record<string, unknown>): void => {
  for (const id of Object.keys(placements)) {
    const placement = placements[id];
    if (
      Array.isArray(placements) ||
      id.startsWith('__') ||
      id.includes('proto') ||
      id.includes('constr') ||
      typeof placement !== 'object' ||
      placement === null ||
      Array.isArray(placement)
    ) {
      log.debug('sanitize deleting grid placement:', id);
      delete placements[id];
      continue;
    }
    const fields = placement as Record<string, unknown>;
    for (const field of Object.keys(fields)) {
      const value = fields[field];
      const isValid =
        field === 'row' || field === 'column'
          ? typeof value === 'number' && Number.isFinite(value)
          : (GRID_PLACEMENT_ALIGNMENTS[field]?.has(value) ?? false);
      if (!isValid) {
        log.debug('sanitize deleting grid placement field:', id, field);
        delete fields[field];
      }
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
      } else if (key === 'placements') {
        sanitizeGridPlacements(args[key]);
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
