/* eslint-env jasmine */
/**
 * Created by knut on 14-11-26.
 */
/**
 * Created by knut on 14-11-23.
 */
import mermaid from './mermaid'

describe('when using mermaid and ', function () {
  describe('when detecting chart type ', function () {
    it('should not start rendering with mermaid_config.startOnLoad set to false', function () {
      global.mermaid_config = { startOnLoad: false }

      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>'
      spyOn(mermaid, 'init')
      mermaid.contentLoaded()
      expect(mermaid.init).not.toHaveBeenCalled()
    })

    it('should not start rendering with mermaid.startOnLoad set to false', function () {
      mermaid.startOnLoad = false
      global.mermaid_config = { startOnLoad: true }

      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>'
      spyOn(mermaid, 'init')
      mermaid.contentLoaded()
      expect(mermaid.init).not.toHaveBeenCalled()
    })

    it('should start rendering with both startOnLoad set', function () {
      mermaid.startOnLoad = true
      global.mermaid_config = { startOnLoad: true }
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>'
      spyOn(mermaid, 'init')
      mermaid.contentLoaded()
      expect(mermaid.init).toHaveBeenCalled()
    })

    it('should start rendering with mermaid.startOnLoad set and no mermaid_config defined', function () {
      mermaid.startOnLoad = true
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>'
      spyOn(mermaid, 'init')
      mermaid.contentLoaded()
      expect(mermaid.init).toHaveBeenCalled()
    })

    it('should start rendering as a default with no changes performed', function () {
      document.body.innerHTML = '<div class="mermaid">graph TD;\na;</div>'
      spyOn(mermaid, 'init')
      mermaid.contentLoaded()
      expect(mermaid.init).toHaveBeenCalled()
    })
  })

  describe('when calling addEdges ', function () {
    var graph = require('./diagrams/flowchart/graphDb')
    var flow = require('./diagrams/flowchart/parser/flow')
    var flowRend = require('./diagrams/flowchart/flowRenderer')

    beforeEach(function () {
      global.mermaid_config = { startOnLoad: false }
      flow.parser.yy = graph
      graph.clear()
    })
    it('it should handle edges with text', function () {
      flow.parser.parse('graph TD;A-->|text ex|B;')
      flow.parser.yy.getVertices()
      var edges = flow.parser.yy.getEdges()

      var mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('normal')
          expect(options.label.match('text ex')).toBeTruthy()
        }
      }

      flowRend.addEdges(edges, mockG)
    })

    it('should handle edges without text', function () {
      flow.parser.parse('graph TD;A-->B;')
      flow.parser.yy.getVertices()
      var edges = flow.parser.yy.getEdges()

      var mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('normal')
        }
      }

      flowRend.addEdges(edges, mockG)
    })

    it('should handle open-ended edges', function () {
      flow.parser.parse('graph TD;A---B;')
      flow.parser.yy.getVertices()
      var edges = flow.parser.yy.getEdges()

      var mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
        }
      }

      flowRend.addEdges(edges, mockG)
    })

    it('should handle edges with styles defined', function () {
      flow.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;')
      flow.parser.yy.getVertices()
      var edges = flow.parser.yy.getEdges()

      var mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;')
        }
      }

      flowRend.addEdges(edges, mockG)
    })
    it('should handle edges with interpolation defined', function () {
      flow.parser.parse('graph TD;A---B; linkStyle 0 interpolate basis')
      flow.parser.yy.getVertices()
      var edges = flow.parser.yy.getEdges()

      var mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.lineInterpolate).toBe('basis')
        }
      }

      flowRend.addEdges(edges, mockG)
    })
    it('should handle edges with text and styles defined', function () {
      flow.parser.parse('graph TD;A---|the text|B; linkStyle 0 stroke:val1,stroke-width:val2;')
      flow.parser.yy.getVertices()
      var edges = flow.parser.yy.getEdges()

      var mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.label.match('the text')).toBeTruthy()
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;')
        }
      }

      flowRend.addEdges(edges, mockG)
    })

    it('should set fill to "none" by default when handling edges', function () {
      flow.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;')
      flow.parser.yy.getVertices()
      var edges = flow.parser.yy.getEdges()

      var mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;')
        }
      }

      flowRend.addEdges(edges, mockG)
    })

    it('should not set fill to none if fill is set in linkStyle', function () {
      flow.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2,fill:blue;')
      flow.parser.yy.getVertices()
      var edges = flow.parser.yy.getEdges()
      var mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:blue;')
        }
      }

      flowRend.addEdges(edges, mockG)
    })
  })

  describe('checking validity of input ', function () {
    it('it should throw for an invalid definiton', function () {
      expect(() => mermaid.parse('this is not a mermaid diagram definition')).toThrow()
    })

    it('it should not throw for a valid flow definition', function () {
      expect(() => mermaid.parse('graph TD;A--x|text including URL space|B;')).not.toThrow()
    })
    it('it should throw for an invalid flow definition', function () {
      expect(() => mermaid.parse('graph TQ;A--x|text including URL space|B;')).toThrow()
    })

    it('it should not throw for a valid sequenceDiagram definition', function () {
      var text = 'sequenceDiagram\n' +
        'Alice->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'alt isWell\n\n' +
        'Bob-->Alice: I am good thanks!\n' +
        'else isSick\n' +
        'Bob-->Alice: Feel sick...\n' +
        'end'
      expect(() => mermaid.parse(text)).not.toThrow()
    })

    it('it should throw for an invalid sequenceDiagram definition', function () {
      var text = 'sequenceDiagram\n' +
        'Alice:->Bob: Hello Bob, how are you?\n\n' +
        '%% Comment\n' +
        'Note right of Bob: Bob thinks\n' +
        'alt isWell\n\n' +
        'Bob-->Alice: I am good thanks!\n' +
        'else isSick\n' +
        'Bob-->Alice: Feel sick...\n' +
        'end'
      expect(() => mermaid.parse(text)).toThrow()
    })

    it('it should not throw for a valid dot definition', function () {
      const text = 'digraph\n' +
        '{\n' +
        ' a -> b -> c -- d -> e;\n' +
        ' a -- e;\n' +
        '}'
      expect(() => mermaid.parse(text)).not.toThrow()
    })

    it('it should throw for an invalid dot definition', function () {
      const text = 'digraph\n' +
        '{\n' +
        'a -:> b -> c -- d -> e;\n' +
        'a -- e;\n' +
        '}'
      expect(() => mermaid.parse(text)).toThrow()
    })
  })
})
