const { Generator } = require('jison')

module.exports = {
  process (source, filename, config, transformOptions) {
    return new Generator(source, {
      'token-stack': true
    }).generate()
  }
}
