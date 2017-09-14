/* eslint-env jasmine */
import mermaid from './mermaid'
import graphDb from './diagrams/flowchart/graphDb'
import flowParser from './diagrams/flowchart/parser/flow'
import flowRenderer from './diagrams/flowchart/flowRenderer'

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
    beforeEach(function () {
      global.mermaid_config = { startOnLoad: false }
      flowParser.parser.yy = graphDb
      graphDb.clear()
    })
    it('it should handle edges with text', function () {
      flowParser.parser.parse('graph TD;A-->|text ex|B;')
      flowParser.parser.yy.getVertices()
      const edges = flowParser.parser.yy.getEdges()

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('normal')
          expect(options.label.match('text ex')).toBeTruthy()
        }
      }

      flowRenderer.addEdges(edges, mockG)
    })

    it('should handle edges without text', function () {
      flowParser.parser.parse('graph TD;A-->B;')
      flowParser.parser.yy.getVertices()
      const edges = flowParser.parser.yy.getEdges()

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('normal')
        }
      }

      flowRenderer.addEdges(edges, mockG)
    })

    it('should handle open-ended edges', function () {
      flowParser.parser.parse('graph TD;A---B;')
      flowParser.parser.yy.getVertices()
      const edges = flowParser.parser.yy.getEdges()

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
        }
      }

      flowRenderer.addEdges(edges, mockG)
    })

    it('should handle edges with styles defined', function () {
      flowParser.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;')
      flowParser.parser.yy.getVertices()
      const edges = flowParser.parser.yy.getEdges()

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;')
        }
      }

      flowRenderer.addEdges(edges, mockG)
    })
    it('should handle edges with interpolation defined', function () {
      flowParser.parser.parse('graph TD;A---B; linkStyle 0 interpolate basis')
      flowParser.parser.yy.getVertices()
      const edges = flowParser.parser.yy.getEdges()

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.lineInterpolate).toBe('basis')
        }
      }

      flowRenderer.addEdges(edges, mockG)
    })
    it('should handle edges with text and styles defined', function () {
      flowParser.parser.parse('graph TD;A---|the text|B; linkStyle 0 stroke:val1,stroke-width:val2;')
      flowParser.parser.yy.getVertices()
      const edges = flowParser.parser.yy.getEdges()

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.label.match('the text')).toBeTruthy()
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;')
        }
      }

      flowRenderer.addEdges(edges, mockG)
    })

    it('should set fill to "none" by default when handling edges', function () {
      flowParser.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2;')
      flowParser.parser.yy.getVertices()
      const edges = flowParser.parser.yy.getEdges()

      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:none;')
        }
      }

      flowRenderer.addEdges(edges, mockG)
    })

    it('should not set fill to none if fill is set in linkStyle', function () {
      flowParser.parser.parse('graph TD;A---B; linkStyle 0 stroke:val1,stroke-width:val2,fill:blue;')
      flowParser.parser.yy.getVertices()
      const edges = flowParser.parser.yy.getEdges()
      const mockG = {
        setEdge: function (start, end, options) {
          expect(start).toBe('A')
          expect(end).toBe('B')
          expect(options.arrowhead).toBe('none')
          expect(options.style).toBe('stroke:val1;stroke-width:val2;fill:blue;')
        }
      }

      flowRenderer.addEdges(edges, mockG)
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
      const text = 'sequenceDiagram\n' +
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
      const text = 'sequenceDiagram\n' +
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
