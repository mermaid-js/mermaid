/* eslint-env jasmine */
describe('class diagram, ', function () {
  describe('when rendering a classDiagram', function () {
    beforeEach(function () {
      Object.defineProperties(window.HTMLElement.prototype, {
        getBBox: {
          get: function () { return { x: 10, y: 10, width: 100, height: 100 } }
        },
        offsetLeft: {
          get: function () { return parseFloat(window.getComputedStyle(this).marginLeft) || 0 }
        },
        offsetTop: {
          get: function () { return parseFloat(window.getComputedStyle(this).marginTop) || 0 }
        },
        offsetHeight: {
          get: function () { return parseFloat(window.getComputedStyle(this).height) || 0 }
        },
        offsetWidth: {
          get: function () { return parseFloat(window.getComputedStyle(this).width) || 0 }
        }
      })
    })
  })
})
