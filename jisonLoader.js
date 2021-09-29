const { Generator } = require('jison');

module.exports = function jisonLoader(source) {
  return new Generator(source, this.getOptions()).generate();
};
