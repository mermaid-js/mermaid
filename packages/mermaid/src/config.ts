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

interface ConfigStore {
  siteConfig: MermaidConfig;
  configFromInitialize?: MermaidConfig;
  directives: MermaidConfig[];
  currentConfig: MermaidConfig;
}

const createConfigStore = (): ConfigStore => ({
  siteConfig: assignWithDepth({}, defaultConfig),
  configFromInitialize: undefined,
  directives: [],
  currentConfig: assignWithDepth({}, defaultConfig),
});

/**
 * The global configuration state.
 *
 * All exported functions in this module operate on this store, so that
 * {@link evaluateConfigInIsolation} can temporarily swap in a scratch copy.
 */
let store: ConfigStore = createConfigStore();

/**
 * Runs `fn` against a scratch copy of the global configuration state and
 * restores the real state afterwards, returning `fn`'s result.
 *
 * This makes it possible to compute the effective configuration of a diagram
 * (including `reset()`, `addDirective()` and the side effects a diagram's
 * `init()` applies through `setConfig()`) without mutating the configuration
 * observed by other, concurrently running renders.
 *
 * `fn` must be synchronous: the scratch state is shared module state, so an
 * `await` inside `fn` would leak it to interleaved callers.
 */
export const evaluateConfigInIsolation = <T>(fn: () => T): T => {
  const realStore = store;
  store = {
    siteConfig: assignWithDepth({}, realStore.siteConfig),
    configFromInitialize: realStore.configFromInitialize
      ? assignWithDepth({}, realStore.configFromInitialize)
      : undefined,
    directives: [...realStore.directives],
    currentConfig: assignWithDepth({}, realStore.currentConfig),
  };
  try {
    return fn();
  } finally {
    store = realStore;
  }
};

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
    const tmpConfigFromInitialize = assignWithDepth({}, store.configFromInitialize);
    const themeVariables = assignWithDepth(
      tmpConfigFromInitialize.themeVariables || {},
      sumOfDirectives.themeVariables
    );
    if (cfg.theme && cfg.theme in theme) {
      cfg.themeVariables = theme[cfg.theme as keyof typeof theme].getThemeVariables(themeVariables);
    }
  }

  store.currentConfig = cfg;
  checkConfig(store.currentConfig);
  return store.currentConfig;
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
  store.siteConfig = assignWithDepth({}, defaultConfig);
  store.siteConfig = assignWithDepth(store.siteConfig, conf);

  // @ts-ignore: TODO Fix ts errors
  if (conf.theme && theme[conf.theme]) {
    // @ts-ignore: TODO Fix ts errors
    store.siteConfig.themeVariables = theme[conf.theme].getThemeVariables(conf.themeVariables);
  }

  updateCurrentConfig(store.siteConfig, store.directives);
  return store.siteConfig;
};

export const saveConfigFromInitialize = (conf: MermaidConfig): void => {
  store.configFromInitialize = assignWithDepth({}, conf);
};

export const updateSiteConfig = (conf: MermaidConfig): MermaidConfig => {
  store.siteConfig = assignWithDepth(store.siteConfig, conf);
  updateCurrentConfig(store.siteConfig, store.directives);

  return store.siteConfig;
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
  return assignWithDepth({}, store.siteConfig);
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
  assignWithDepth(store.currentConfig, conf);

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
  return assignWithDepth({}, store.currentConfig);
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
  ['secure', ...(store.siteConfig.secure ?? [])].forEach((key) => {
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

  store.directives.push(directive);
  updateCurrentConfig(store.siteConfig, store.directives);
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
export const reset = (config = store.siteConfig): void => {
  // Replace current config with siteConfig
  store.directives = [];
  updateCurrentConfig(config, store.directives);
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

  if (store.configFromInitialize) {
    userConfig = assignWithDepth(userConfig, store.configFromInitialize);
  }

  for (const d of store.directives) {
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
