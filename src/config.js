import { assignWithDepth } from './utils';
import { logger } from './logger';
import theme from './themes';
import config from './defaultConfig';

// debugger;

export const defaultConfig = Object.freeze(config);

let siteConfig = assignWithDepth({}, defaultConfig);
let directives = [];
let currentConfig = assignWithDepth({}, defaultConfig);

export const updateCurrentConfig = (siteCfg, _directives) => {
  let cfg = assignWithDepth({}, siteCfg);

  // Apply directives
  let themeVariables = {};
  for (let i = 0; i < _directives.length; i++) {
    const d = _directives[i];
    sanitize(d);
    cfg = assignWithDepth(cfg, d);
    if (d.themeVariables) {
      themeVariables = d.themeVariables;
    }
  }
  if (cfg.theme && theme[cfg.theme]) {
    // console.warn('cfg beeing updated main bkg', themeVariables, cfg.theme);
    const variables = theme[cfg.theme].getThemeVariables(themeVariables);
    // console.warn('cfg beeing updated 2 main bkg', variables.mainBkg);
    cfg.themeVariables = variables;
  }
  // else {
  //   console.warn('cfg not beeing updated main bkg', themeVariables, cfg.theme);
  // }

  currentConfig = cfg;
  // console.warn('cfg updated main bkg', cfg.sequence);
  return cfg;
};
/**
 *## setSiteConfig
 *| Function | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| setSiteConfig|Sets the siteConfig to desired values | Put Request | Any Values, except ones in secure array|
 ***Notes:**
 *Sets the siteConfig. The siteConfig is a protected configuration for repeat use. Calls to reset() will reset
 *the currentConfig to siteConfig. Calls to reset(configApi.defaultConfig) will reset siteConfig and currentConfig
 *to the defaultConfig
 *Note: currentConfig is set in this function
 **Default value: At default, will mirror Global Config**
 * @param conf - the base currentConfig to use as siteConfig
 * @returns {*} - the siteConfig
 */
export const setSiteConfig = conf => {
  // siteConfig = { ...defaultConfig, ...conf };
  siteConfig = assignWithDepth({}, defaultConfig);
  siteConfig = assignWithDepth(siteConfig, conf);
  currentConfig = updateCurrentConfig(siteConfig, directives);
  return siteConfig;
};
export const updateSiteConfig = conf => {
  // Object.keys(conf).forEach(key => {
  //   const manipulator = manipulators[key];
  //   conf[key] = manipulator ? manipulator(conf[key]) : conf[key];
  // });
  siteConfig = assignWithDepth(siteConfig, conf);
  console.log('updateSiteConfig', siteConfig);
  updateCurrentConfig(siteConfig, directives);
  // assignWithDesetpth(currentConfig, conf, { clobber: true });
  // // Set theme variables if user has set the theme option
  // assignWithDepth(siteConfig, conf);

  return siteConfig;
};
/**
 *## getSiteConfig
 *| Function | Description         | Type    |  Values             |
 *| --------- | ------------------- | ------- |  ------------------ |
 *| setSiteConfig|Returns the current siteConfig base configuration | Get Request | Returns Any Values  in siteConfig|
 ***Notes**:
 *Returns **any** values in siteConfig.
 * @returns {*}
 */
export const getSiteConfig = () => {
  return assignWithDepth({}, siteConfig);
};
/**
 *## setConfig
 *| Function  | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| setSiteConfig|Sets the siteConfig to desired values | Put Request| Any Values, except ones in secure array|
 ***Notes**:
 *Sets the currentConfig. The parameter conf is sanitized based on the siteConfig.secure keys. Any
 *values found in conf with key found in siteConfig.secure will be replaced with the corresponding
 *siteConfig value.
 * @param conf - the potential currentConfig
 * @returns {*} - the currentConfig merged with the sanitized conf
 */
export const setConfig = conf => {
  // sanitize(conf);
  // Object.keys(conf).forEach(key => {
  //   const manipulator = manipulators[key];
  //   conf[key] = manipulator ? manipulator(conf[key]) : conf[key];
  // });

  assignWithDepth(currentConfig, conf);

  return getConfig();
};

/**
 *   ## getConfig
 *| Function  | Description         | Type    | Return Values            |
 *| --------- | ------------------- | ------- | ------------------ |
 *| getConfig |Obtains the currentConfig | Get Request | Any Values from currentConfig|
 ***Notes**:
 *Returns **any** the currentConfig
 * @returns {*} - the currentConfig
 */
export const getConfig = () => {
  return assignWithDepth({}, currentConfig);
};
/**
 *## sanitize
 *| Function | Description         | Type    | Values             |
 *| --------- | ------------------- | ------- | ------------------ |
 *| sanitize  |Sets the siteConfig to desired values. | Put Request |None|
 *Ensures options parameter does not attempt to override siteConfig secure keys
 *Note: modifies options in-place
 * @param options - the potential setConfig parameter
 */
export const sanitize = options => {
  Object.keys(siteConfig.secure).forEach(key => {
    if (typeof options[siteConfig.secure[key]] !== 'undefined') {
      // DO NOT attempt to print options[siteConfig.secure[key]] within `${}` as a malicious script
      // can exploit the logger's attempt to stringify the value and execute arbitrary code
      logger.debug(
        `Denied attempt to modify a secure key ${siteConfig.secure[key]}`,
        options[siteConfig.secure[key]]
      );
      delete options[siteConfig.secure[key]];
    }
  });
};

export const addDirective = directive => {
  directives.push(directive);
  updateCurrentConfig(siteConfig, directives);
};

/**
 *## reset
 *| Function | Description         | Type    | Required | Values             |
 *| --------- | ------------------- | ------- | -------- | ------------------ |
 *| reset|Resets currentConfig to conf| Put Request | Required | None|
 *
 *| Parameter | Description |Type | Required | Values|
 *| --- | --- | --- | --- | --- |
 *| conf| base set of values, which currentConfig coul be **reset** to.| Dictionary | Required | Any Values, with respect to the secure Array|
 *
 **Notes :
 (default: current siteConfig ) (optional, default `getSiteConfig()`)
 * @param conf - the base currentConfig to reset to (default: current siteConfig )
 */
export const reset = () => {
  // Object.keys(siteConfig).forEach(key => delete siteConfig[key]);
  // Object.keys(currentConfig).forEach(key => delete currentConfig[key]);
  // assignWithDepth(siteConfig, conf, { clobber: true });
  // assignWithDepth(currentConfig, conf, { clobber: true });

  // Replace current config with siteConfig
  directives = [];
  // console.warn(siteConfig.sequence);
  updateCurrentConfig(siteConfig, directives);
};

// const configApi = Object.freeze({
//   sanitize,
//   setSiteConfig,
//   getSiteConfig,
//   setConfig,
//   getConfig,
//   reset,
//   defaultConfig
// });
// export default configApi;
