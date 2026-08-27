import assignWithDepth from './assignWithDepth.js';
import { log } from './logger.js';
import theme from './themes/index.js';
import config from './defaultConfig.js';
import type { MermaidConfig } from './config.type.js';
import { sanitizeDirective } from './utils/sanitizeDirective.js';

export const defaultConfig: MermaidConfig = Object.freeze(config);

/**
 * Converts a string/boolean into a boolean
 *
 * @param val - String or boolean to convert
 * @returns The result from the input
 */
export const evaluate = (val?: string | boolean | null): boolean =>
  val === false || ['false', 'null', '0'].includes(String(val).trim().toLowerCase()) ? false : true;

let siteConfig: MermaidConfig = assignWithDepth({}, defaultConfig);
let configFromInitialize: MermaidConfig;
let directives: MermaidConfig[] = [];
let currentConfig: MermaidConfig = assignWithDepth({}, defaultConfig);

const updateCurrentConfig = (siteCfg: MermaidConfig, _directives: MermaidConfig[]) => {
  // start with config being the siteConfig
  let cfg: MermaidConfig = assignWithDepth({}, siteCfg);
  // let sCfg = assignWithDepth(defaultConfig, siteConfigDelta);

  // Join directives
  let sumOfDirectives: MermaidConfig = {};
  for (const d of _directives) {
    sanitize(d);
    // Apply the data from the directive where the overrides the themeVariables
    sumOfDirectives = assignWithDepth(sumOfDirectives, d);
  }

  cfg = assignWithDepth(cfg, sumOfDirectives);

  if (sumOfDirectives.theme && sumOfDirectives.theme in theme) {
    const tmpConfigFromInitialize = assignWithDepth({}, configFromInitialize);
    const themeVariables = assignWithDepth(
      tmpConfigFromInitialize.themeVariables || {},
      sumOfDirectives.themeVariables
    );
    if (cfg.theme && cfg.theme in theme) {
      cfg.themeVariables = theme[cfg.theme as keyof typeof theme].getThemeVariables(themeVariables);
    }
  }

  currentConfig = cfg;
  checkConfig(currentConfig);
  return currentConfig;
};

/**
 * Sets the `siteConfig` to the desired values.
 *
 * The `siteConfig` is a protected configuration for repeat use. Calls
 * to {@link reset} will reset the `currentConfig` to `siteConfig`.
 *
 * @param conf - The config to use as `siteConfig`. This will be merged with the `defaultConfig`.
 * @returns The new siteConfig
 */
export const setSiteConfig = (conf: MermaidConfig): MermaidConfig => {
  siteConfig = assignWithDepth({}, defaultConfig);
  siteConfig = assignWithDepth(siteConfig, conf);

  // @ts-ignore: TODO Fix ts errors
  if (conf.theme && theme[conf.theme]) {
    // @ts-ignore: TODO Fix ts errors
    siteConfig.themeVariables = theme[conf.theme].getThemeVariables(conf.themeVariables);
  }

  updateCurrentConfig(siteConfig, directives);
  return siteConfig;
};

export const saveConfigFromInitialize = (conf: MermaidConfig): void => {
  configFromInitialize = assignWithDepth({}, conf);
};

export const updateSiteConfig = (conf: MermaidConfig): MermaidConfig => {
  siteConfig = assignWithDepth(siteConfig, conf);
  updateCurrentConfig(siteConfig, directives);

  return siteConfig;
};

/**
 * Returns a copy of the current `siteConfig` base configuration.
 *
 * @returns The siteConfig
 */
export const getSiteConfig = (): MermaidConfig => {
  return assignWithDepth({}, siteConfig);
};

/**
 * Updates the `currentConfig` with the provided `conf` after sanitization.
 *
 * @deprecated Any changes to the `currentConfig` would be overwritten by the
 *             next call to {@link addDirective} or {@link reset}.
 * @param conf - The potential currentConfig
 * @returns The currentConfig merged with the sanitized conf
 */
export const setConfig = (conf: MermaidConfig): MermaidConfig => {
  updateCurrentConfig(currentConfig, [conf]);

  return getConfig();
};

/**
 * Returns a copy of the `currentConfig`.
 *
 * @remarks Avoid calling this function repeatedly.
 * Instead, store the result in a variable and use it, and pass it down to function calls.
 *
 * @returns The currentConfig
 */
export const getConfig = (): MermaidConfig => {
  return assignWithDepth({}, currentConfig);
};

/**
 * Ensures options parameter does not attempt to override `siteConfig` secure keys.
 *
 * @remarks Modifies options in-place.
 *
 * @param options - The potential `setConfig` parameter
 */
export const sanitize = (options: any) => {
  if (!options) {
    return;
  }
  // Checking that options are not in the list of excluded options
  ['secure', ...(siteConfig.secure ?? [])].forEach((key) => {
    if (Object.hasOwn(options, key)) {
      // DO NOT attempt to print options[key] within `${}` as a malicious script
      // can exploit the logger's attempt to stringify the value and execute arbitrary code
      log.debug(`Denied attempt to modify a secure key ${key}`, options[key]);
      delete options[key];
    }
  });

  // Check that there no attempts of prototype pollution
  Object.keys(options).forEach((key) => {
    if (key.startsWith('__')) {
      delete options[key];
    }
  });
  // Check that there no attempts of xss, there should be no tags at all in the directive
  // blocking data urls as base64 urls can contain svg's with inline script tags
  Object.keys(options).forEach((key) => {
    if (typeof options[key] === 'string') {
      const isCssKey = key === 'themeCSS' || key.endsWith('themeCSS');
      const hasInvalidChars = isCssKey
        ? options[key].includes('<') || options[key].includes('url(data:')
        : options[key].includes('<') || options[key].includes('>') || options[key].includes('url(data:');

      if (hasInvalidChars) {
        delete options[key];
      }
    }
    if (typeof options[key] === 'object') {
      sanitize(options[key]);
    }
  });
};

/**
 * Pushes in a directive to the configuration
 *
 * @param directive - The directive to push in
 */
export const addDirective = (directive: MermaidConfig) => {
  sanitizeDirective(directive);

  // If the directive has a fontFamily, but no themeVariables, add the fontFamily to the themeVariables
  if (directive.fontFamily && !directive.themeVariables?.fontFamily) {
    directive.themeVariables = {
      ...directive.themeVariables,
      fontFamily: directive.fontFamily,
    };
  }

  directives.push(directive);
  updateCurrentConfig(siteConfig, directives);
};

/**
 * Resets the current config and applied directives to the provided config.
 *
 * @param config - the value to reset the `currentConfig` to.
 * Defaults to the current `siteConfig` (e.g the value returned by {@link getSiteConfig}).
 */
export const reset = (config = siteConfig): void => {
  // Replace current config with siteConfig
  directives = [];
  updateCurrentConfig(config, directives);
};

const ConfigWarning = {
  LAZY_LOAD_DEPRECATED:
    'The configuration options lazyLoadedDiagrams and loadExternalDiagramsAtStartup are deprecated. Please use registerExternalDiagrams instead.',
  FLOWCHART_HTML_LABELS_DEPRECATED:
    'flowchart.htmlLabels is deprecated. Please use global htmlLabels instead.',
} as const;

type ConfigWarningStrings = keyof typeof ConfigWarning;
const issuedWarnings: Partial<Record<ConfigWarningStrings, boolean>> = {};
const issueWarning = (warning: ConfigWarningStrings) => {
  if (issuedWarnings[warning]) {
    return;
  }
  log.warn(ConfigWarning[warning]);
  issuedWarnings[warning] = true;
};

const checkConfig = (config: MermaidConfig) => {
  if (!config) {
    return;
  }
  // @ts-expect-error Properties were removed in v10. Warning should exist.
  if (config.lazyLoadedDiagrams || config.loadExternalDiagramsAtStartup) {
    issueWarning('LAZY_LOAD_DEPRECATED');
  }
};

export const getUserDefinedConfig = (): MermaidConfig => {
  let userConfig: MermaidConfig = {};

  if (configFromInitialize) {
    userConfig = assignWithDepth(userConfig, configFromInitialize);
  }

  for (const d of directives) {
    userConfig = assignWithDepth(userConfig, d);
  }

  return userConfig;
};

/**
 * Helper function to handle deprecated flowchart.htmlLabels
 * @param config - The configuration object (merged config with defaults)
 * @returns The effective htmlLabels value based on precedence: root flowchart  default
 */
export const getEffectiveHtmlLabels = (config: MermaidConfig): boolean => {
  // != instead of !== handles null case
  if (config.flowchart?.htmlLabels != undefined) {
    issueWarning('FLOWCHART_HTML_LABELS_DEPRECATED');
  }
  return evaluate(config.htmlLabels ?? config.flowchart?.htmlLabels ?? true);
};
