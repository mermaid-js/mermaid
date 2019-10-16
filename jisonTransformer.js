const { Generator } = require('jison-gho')

module.exports = {
  process (source, filename, config, transformOptions) {
    return new Generator(source, {
      'token-stack': true
    }).generate()
  }
}
