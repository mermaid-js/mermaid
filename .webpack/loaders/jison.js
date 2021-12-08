const { Generator } = require('jison');
const validate = require('schema-utils');

const schema = {
  title: 'Jison Parser options',
  type: 'object',
  properties: {
    'token-stack': {
      type: 'boolean',
    },
    debug: {
      type: 'boolean',
    },
  },
  additionalProperties: false,
};

module.exports = function jisonLoader(source) {
  const options = this.getOptions();
  (validate.validate || validate)(schema, options, {
    name: 'Jison Loader',
    baseDataPath: 'options',
  });
  return new Generator(source, options).generate();
};
