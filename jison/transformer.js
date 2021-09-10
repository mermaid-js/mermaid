const { Parser } = require('jison');

module.exports = {
  process(source, filename, config, transformOptions) {
    return new Parser(source, { 'token-stack': true }).generate();
  },
};
