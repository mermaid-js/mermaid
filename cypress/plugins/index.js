// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

// module.exports = (on, config) => {
//   // `on` is used to hook into various events Cypress emits
//   // `config` is the resolved Cypress config
// }

const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
require('@applitools/eyes-cypress')(module);

module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config);
  // copy any needed variables from process.env to config.env
  config.env.useAppli = process.env.USE_APPLI ? true : false;
  config.env.codeBranch = process.env.APPLI_BRANCH;

  // do not forget to return the changed config object!
  return config;
};

require('@applitools/eyes-cypress')(module);
