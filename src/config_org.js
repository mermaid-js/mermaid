import { assignWithDepth } from './utils';
import { log } from './logger'; // eslint-disable-line
import theme from './themes';
import config from './defaultConfig';

// import { unflatten } from 'flat';
// import flatten from 'flat';

// import themeVariables from './theme-default';
// import themeForestVariables from './theme-forest';
// import themeNeutralVariables from './theme-neutral';

const handleThemeVariables = (value) => {
  return theme[value] ? theme[value].getThemeVariables() : theme.default.getThemeVariables();
};

const manipulators = {
  themeVariables: handleThemeVariables,
};

// debugger;
config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
config.git.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
export const defaultConfig = Object.freeze(config);

const siteConfig = assignWithDepth({}, defaultConfig);
const currentConfig = assignWithDepth({}, defaultConfig);

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
export const setSiteConfig = (conf) => {
  console.log('setSiteConfig');

  Object.keys(conf).forEach((key) => {
    const manipulator = manipulators[key];
    conf[key] = manipulator ? manipulator(conf[key]) : conf[key];
  });

  assignWithDepth(currentConfig, conf, { clobber: true });
  // Set theme variables if user has set the theme option
  assignWithDepth(siteConfig, conf);

  return getSiteConfig();
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
export const setConfig = (conf) => {
  console.log('setConfig');
  sanitize(conf);
  Object.keys(conf).forEach((key) => {
    const manipulator = manipulators[key];
    conf[key] = manipulator ? manipulator(conf[key]) : conf[key];
  });

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
export const sanitize = (options) => {
  Object.keys(siteConfig.secure).forEach((key) => {
    if (typeof options[siteConfig.secure[key]] !== 'undefined') {
      // DO NOT attempt to print options[siteConfig.secure[key]] within `${}` as a malicious script
      // can exploit the logger's attempt to stringify the value and execute arbitrary code
      log.trace(
        `Denied attempt to modify a secure key ${siteConfig.secure[key]}`,
        options[siteConfig.secure[key]]
      );
      delete options[siteConfig.secure[key]];
    }
  });
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
export const reset = (conf = getSiteConfig()) => {
  console.warn('reset');
  Object.keys(siteConfig).forEach((key) => delete siteConfig[key]);
  Object.keys(currentConfig).forEach((key) => delete currentConfig[key]);
  assignWithDepth(siteConfig, conf, { clobber: true });
  assignWithDepth(currentConfig, conf, { clobber: true });
};

const configApi = Object.freeze({
  sanitize,
  setSiteConfig,
  getSiteConfig,
  setConfig,
  getConfig,
  reset,
  defaultConfig,
});
export default configApi;
