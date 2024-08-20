import assignWithDepth from './assignWithDepth.js';
import { log } from './logger.js';
import theme from './themes/index.js';
import config from './defaultConfig.js';
import type { MermaidConfig } from './config.type.js';
import { sanitizeDirective } from './utils/sanitizeDirective.js';

export const defaultConfig: MermaidConfig = Object.freeze(config);

let siteConfig: MermaidConfig = assignWithDepth({}, defaultConfig);
let configFromInitialize: MermaidConfig;
let directives: MermaidConfig[] = [];
let currentConfig: MermaidConfig = assignWithDepth({}, defaultConfig);

export const updateCurrentConfig = (siteCfg: MermaidConfig, _directives: MermaidConfig[]) => {
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
 * ## setSiteConfig
 *
 * | Function      | Description                           | Type        | Values                                  |
 * | ------------- | ------------------------------------- | ----------- | --------------------------------------- |
 * | setSiteConfig | Sets the siteConfig to desired values | Put Request | Any Values, except ones in secure array |
 *
 * **Notes:** Sets the siteConfig. The siteConfig is a protected configuration for repeat use. Calls
 * to reset() will reset the currentConfig to siteConfig. Calls to reset(configApi.defaultConfig)
 * will reset siteConfig and currentConfig to the defaultConfig Note: currentConfig is set in this
 * function _Default value: At default, will mirror Global Config_
 *
 * @param conf - The base currentConfig to use as siteConfig
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
 * ## getSiteConfig
 *
 * | Function      | Description                                       | Type        | Values                           |
 * | ------------- | ------------------------------------------------- | ----------- | -------------------------------- |
 * | setSiteConfig | Returns the current siteConfig base configuration | Get Request | Returns Any Values in siteConfig |
 *
 * **Notes**: Returns **any** values in siteConfig.
 *
 * @returns The siteConfig
 */
export const getSiteConfig = (): MermaidConfig => {
  return assignWithDepth({}, siteConfig);
};
/**
 * ## setConfig
 *
 * | Function      | Description                           | Type        | Values                                  |
 * | ------------- | ------------------------------------- | ----------- | --------------------------------------- |
 * | setSiteConfig | Sets the siteConfig to desired values | Put Request | Any Values, except ones in secure array |
 *
 * **Notes**: Sets the currentConfig. The parameter conf is sanitized based on the siteConfig.secure
 * keys. Any values found in conf with key found in siteConfig.secure will be replaced with the
 * corresponding siteConfig value.
 *
 * @param conf - The potential currentConfig
 * @returns The currentConfig merged with the sanitized conf
 */
export const setConfig = (conf: MermaidConfig): MermaidConfig => {
  checkConfig(conf);
  assignWithDepth(currentConfig, conf);

  return getConfig();
};

/**
 * ## getConfig
 *
 * | Function  | Description               | Type        | Return Values                  |
 * | --------- | ------------------------- | ----------- | ------------------------------ |
 * | getConfig | Obtains the currentConfig | Get Request | Any Values from current Config |
 *
 * **Notes**: Avoid calling this function repeatedly. Instead, store the result in a variable and use it, and pass it down to function calls.
 *
 * @returns The currentConfig
 */
export const getConfig = (): MermaidConfig => {
  return assignWithDepth({}, currentConfig);
};
/**
 * ## sanitize
 *
 * | Function | Description                            | Type        | Values |
 * | -------- | -------------------------------------- | ----------- | ------ |
 * | sanitize | Sets the siteConfig to desired values. | Put Request | None   |
 *
 * Ensures options parameter does not attempt to override siteConfig secure keys **Notes**: modifies
 * options in-place
 *
 * @param options - The potential setConfig parameter
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
    if (
      typeof options[key] === 'string' &&
      (options[key].includes('<') ||
        options[key].includes('>') ||
        options[key].includes('url(data:'))
    ) {
      delete options[key];
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
 * ## reset
 *
 * | Function | Description                  | Type        | Required | Values |
 * | -------- | ---------------------------- | ----------- | -------- | ------ |
 * | reset    | Resets currentConfig to conf | Put Request | Required | None   |
 *
 * ## conf
 *
 * | Parameter | Description                                                    | Type       | Required | Values                                       |
 * | --------- | -------------------------------------------------------------- | ---------- | -------- | -------------------------------------------- |
 * | conf      | base set of values, which currentConfig could be **reset** to. | Dictionary | Required | Any Values, with respect to the secure Array |
 *
 * **Notes**: (default: current siteConfig ) (optional, default `getSiteConfig()`)
 *
 * @param config - base set of values, which currentConfig could be **reset** to.
 * Defaults to the current siteConfig (e.g returned by {@link getSiteConfig}).
 */
export const reset = (config = siteConfig): void => {
  // Replace current config with siteConfig
  directives = [];
  updateCurrentConfig(config, directives);
};

const ConfigWarning = {
  LAZY_LOAD_DEPRECATED:
    'The configuration options lazyLoadedDiagrams and loadExternalDiagramsAtStartup are deprecated. Please use registerExternalDiagrams instead.',
} as const;

type ConfigWarningStrings = keyof typeof ConfigWarning;
const issuedWarnings: { [key in ConfigWarningStrings]?: boolean } = {};
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
