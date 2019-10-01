const { Generator } = require('jison')
const { getOptions } = require('loader-utils')

module.exports = function jisonLoader (source) {
  return new Generator(source, getOptions(this)).generate()
}
