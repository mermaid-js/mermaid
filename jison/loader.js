const { Generator } = require('jison');
const validate = require('schema-utils');
const schema = require('./parser-options-schema.json');

module.exports = function jisonLoader(source) {
  const options = this.getOptions();
  (validate.validate || validate)(schema, options, {
    name: 'Jison Loader',
    baseDataPath: 'options',
  });
  return new Generator(source, options).generate();
};
