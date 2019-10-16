const { Parser } = require('jison-gho');
const { getOptions } = require('loader-utils');

module.exports = function jisonLoader (source) {
  return new Parser(source, getOptions(this)).generate();
}
