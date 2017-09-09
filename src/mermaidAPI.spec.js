/* eslint-env jasmine */
/**
 * Created by knut on 14-11-26.
 */
/**
 * Created by knut on 14-11-23.
 */
var api = require('./mermaidAPI.js')

const validateDefinition = (text, valid) => {
  const foo = {
    onError: () => {
    }
  }
  spyOn(foo, 'onError')
  global.mermaidAPI.eventEmitter.on('parseError', (err, hash) => {
    foo.onError(err)
  })
  var res = api.parse(text)

  if (valid) {
    expect(res).toBe(true)
    expect(foo.onError).not.toHaveBeenCalled()
  } else {
    expect(res).toBe(false)
    expect(foo.onError).toHaveBeenCalled()
  }
}

describe('when using mermaidAPI and ', function () {
  describe('doing initialize ', function () {
    beforeEach(function () {
      delete global.mermaid_config
      document.body.innerHTML = ''
    })

    it('should copy a literal into the configuration', function () {
      var orgConfig = api.getConfig()
      expect(orgConfig.testLiteral).toBe(undefined)

      api.initialize({ 'testLiteral': true })
      var config = api.getConfig()

      expect(config.testLiteral).toBe(true)
    })
    it('should copy a an object into the configuration', function () {
      var orgConfig = api.getConfig()
      expect(orgConfig.testObject).toBe(undefined)

      var object = {
        test1: 1,
        test2: false
      }

      api.initialize({ 'testObject': object })
      api.initialize({ 'testObject': { 'test3': true } })
      var config = api.getConfig()

      expect(config.testObject.test1).toBe(1)
      expect(config.testObject.test2).toBe(false)
      expect(config.testObject.test3).toBe(true)
      expect(config.cloneCssStyles).toBe(orgConfig.cloneCssStyles)
    })
  })
  describe('checking validity of input ', function () {
    it('it should return false for an invalid definiton', function () {
      validateDefinition('this is not a mermaid diagram definition', false)
    })
    it('it should return true for a valid definiton', function () {
      validateDefinition('graph TD;A--x|text including URL space|B;', true)
    })
  })
})
