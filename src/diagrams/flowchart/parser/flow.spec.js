import graphDb from '../graphDb'
import flow from './flow'

describe('when parsing ', function () {
  beforeEach(function () {
    flow.parser.yy = graphDb
    flow.parser.yy.clear()
  })

  it('should handle a nodes and edges', function () {
    const res = flow.parser.parse('graph TD;\nA-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle angle bracket ' > ' as direction LR', function () {
    const res = flow.parser.parse('graph >;A-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()
    const direction = flow.parser.yy.getDirection()

    expect(direction).toBe('LR')

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle angle bracket ' < ' as direction RL', function () {
    const res = flow.parser.parse('graph <;A-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()
    const direction = flow.parser.yy.getDirection()

    expect(direction).toBe('RL')

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle caret ' ^ ' as direction BT', function () {
    const res = flow.parser.parse('graph ^;A-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()
    const direction = flow.parser.yy.getDirection()

    expect(direction).toBe('BT')

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle lower-case \'v\' as direction TB', function () {
    const res = flow.parser.parse('graph v;A-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()
    const direction = flow.parser.yy.getDirection()

    expect(direction).toBe('TB')

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle a nodes and edges and a space between link and node', function () {
    const res = flow.parser.parse('graph TD;A --> B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle a nodes and edges, a space between link and node and each line ending without semicolon', function () {
    const res = flow.parser.parse('graph TD\nA --> B\n style e red')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })
  it('should handle statements ending without semicolon', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nB-->C')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(2)
    expect(edges[1].start).toBe('B')
    expect(edges[1].end).toBe('C')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle a comments', function () {
    const res = flow.parser.parse('graph TD;\n%% CComment\n A-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })
  it('should handle comments a at the start', function () {
    const res = flow.parser.parse('%% Comment\ngraph TD;\n A-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })
  it('should handle comments at the end', function () {
    const res = flow.parser.parse('graph TD;\n A-->B\n %% Comment at the find\n')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })
  it('should handle comments at the end no trailing newline', function () {
    const res = flow.parser.parse('graph TD;\n A-->B\n%% Commento')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })
  it('should handle comments at the end many trailing newlines', function () {
    const res = flow.parser.parse('graph TD;\n A-->B\n%% Commento\n\n\n')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })
  it('should handle no trailing newlines', function () {
    const res = flow.parser.parse('graph TD;\n A-->B')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })
  it('should handle many trailing newlines', function () {
    const res = flow.parser.parse('graph TD;\n A-->B\n\n')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })
  it('should handle a comments with blank rows in-between', function () {
    const res = flow.parser.parse('graph TD;\n\n\n %% Comment\n A-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle a comments mermaid flowchart code in them', function () {
    const res = flow.parser.parse('graph TD;\n\n\n %% Test od>Odd shape]-->|Two line<br>edge comment|ro;\n A-->B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(1)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('it should handle a trailing whitespaces after statememnts', function () {
    const res = flow.parser.parse('graph TD;\n\n\n %% Comment\n A-->B; \n B-->C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(2)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].type).toBe('arrow')
    expect(edges[0].text).toBe('')
  })

  it('should handle node names with "end" substring', function () {
    const res = flow.parser.parse('graph TD\nendpoint --> sender')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['endpoint'].id).toBe('endpoint')
    expect(vert['sender'].id).toBe('sender')
    expect(edges[0].start).toBe('endpoint')
    expect(edges[0].end).toBe('sender')
  })

  it('should handle node names ending with keywords', function () {
    const res = flow.parser.parse('graph TD\nblend --> monograph')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['blend'].id).toBe('blend')
    expect(vert['monograph'].id).toBe('monograph')
    expect(edges[0].start).toBe('blend')
    expect(edges[0].end).toBe('monograph')
  })

  it('should handle open ended edges', function () {
    const res = flow.parser.parse('graph TD;A---B;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow_open')
  })

  it('should handle cross ended edges', function () {
    const res = flow.parser.parse('graph TD;A--xB;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow_cross')
  })

  it('should handle open ended edges', function () {
    const res = flow.parser.parse('graph TD;A--oB;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow_circle')
  })
  it('should handle subgraphs', function () {
    const res = flow.parser.parse('graph TD;A-->B;subgraph myTitle;c-->d;end;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle subgraphs', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\n\n c-->d \nend\n')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle nested subgraphs', function () {
    const str = 'graph TD\n' +
            'A-->B\n' +
            'subgraph myTitle\n\n' +
            ' c-->d \n\n' +
            ' subgraph inner\n\n   e-->f \n end \n\n' +
            ' subgraph inner\n\n   h-->i \n end \n\n' +
            'end\n'
    const res = flow.parser.parse(str)
  })

  it('should handle subgraphs', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-->d\nend;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle subgraphs', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nsubgraph myTitle\nc-- text -->d\nd-->e\n end;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle classDefs with style in classes', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nclassDef exClass font-style:bold;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle classDefs with % in classes', function () {
    const res = flow.parser.parse('graph TD\nA-->B\nclassDef exClass fill:#f96,stroke:#333,stroke-width:4px,font-size:50%,font-style:bold;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle style definitons with more then 1 digit in a row', function () {
    const res = flow.parser.parse('graph TD\n' +
        'A-->B1\n' +
        'A-->B2\n' +
        'A-->B3\n' +
        'A-->B4\n' +
        'A-->B5\n' +
        'A-->B6\n' +
        'A-->B7\n' +
        'A-->B8\n' +
        'A-->B9\n' +
        'A-->B10\n' +
        'A-->B11\n' +
        'linkStyle 10 stroke-width:1px;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow')
  })

  it('should handle line interpolation default definitions', function () {
    const res = flow.parser.parse('graph TD\n' +
        'A-->B\n' +
        'linkStyle default interpolate basis')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.defaultInterpolate).toBe('basis')
  })

  it('should handle line interpolation numbered definitions', function () {
    const res = flow.parser.parse('graph TD\n' +
        'A-->B\n' +
        'A-->C\n' +
        'linkStyle 0 interpolate basis\n' +
        'linkStyle 1 interpolate cardinal')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].interpolate).toBe('basis')
    expect(edges[1].interpolate).toBe('cardinal')
  })

  it('should handle line interpolation default with style', function () {
    const res = flow.parser.parse('graph TD\n' +
        'A-->B\n' +
        'linkStyle default interpolate basis stroke-width:1px;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.defaultInterpolate).toBe('basis')
  })

  it('should handle line interpolation numbered with style', function () {
    const res = flow.parser.parse('graph TD\n' +
        'A-->B\n' +
        'A-->C\n' +
        'linkStyle 0 interpolate basis stroke-width:1px;\n' +
        'linkStyle 1 interpolate cardinal stroke-width:1px;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].interpolate).toBe('basis')
    expect(edges[1].interpolate).toBe('cardinal')
  })

  describe('it should handle interaction, ', function () {
    it('it should be possible to use click to a callback', function () {
      spyOn(graphDb, 'setClickEvent')
      const res = flow.parser.parse('graph TD\nA-->B\nclick A callback')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(graphDb.setClickEvent).toHaveBeenCalledWith('A', 'callback', undefined, undefined)
    })

    it('it should be possible to use click to a callback with toolip', function () {
      spyOn(graphDb, 'setClickEvent')
      const res = flow.parser.parse('graph TD\nA-->B\nclick A callback "tooltip"')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(graphDb.setClickEvent).toHaveBeenCalledWith('A', 'callback', undefined, 'tooltip')
    })

    it('should handle interaction - click to a link', function () {
      spyOn(graphDb, 'setClickEvent')
      const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html"')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(graphDb.setClickEvent).toHaveBeenCalledWith('A', undefined, 'click.html', undefined)
    })
    it('should handle interaction - click to a link with tooltip', function () {
      spyOn(graphDb, 'setClickEvent')
      const res = flow.parser.parse('graph TD\nA-->B\nclick A "click.html" "tooltip"')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(graphDb.setClickEvent).toHaveBeenCalledWith('A', undefined, 'click.html', 'tooltip')
    })
  })

  describe('it should handle text on edges', function () {
    it('it should handle text without space', function () {
      const res = flow.parser.parse('graph TD;A--x|textNoSpace|B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('should handle  with space', function () {
      const res = flow.parser.parse('graph TD;A--x|text including space|B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('it should handle text with /', function () {
      const res = flow.parser.parse('graph TD;A--x|text with / should work|B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].text).toBe('text with / should work')
    })

    it('it should handle space and space between vertices and link', function () {
      const res = flow.parser.parse('graph TD;A --x|textNoSpace| B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('should handle space and CAPS', function () {
      const res = flow.parser.parse('graph TD;A--x|text including CAPS space|B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('should handle space and dir', function () {
      const res = flow.parser.parse('graph TD;A--x|text including URL space|B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(edges[0].text).toBe('text including URL space')
    })

    it('should handle space and send', function () {
      const res = flow.parser.parse('graph TD;A--text including URL space and send-->B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow')
      expect(edges[0].text).toBe('text including URL space and send')
    })
    it('should handle space and send', function () {
      const res = flow.parser.parse('graph TD;A-- text including URL space and send -->B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow')
      expect(edges[0].text).toBe('text including URL space and send')
    })

    it('should handle space and dir (TD)', function () {
      const res = flow.parser.parse('graph TD;A--x|text including R TD space|B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(edges[0].text).toBe('text including R TD space')
    })
    it('should handle `', function () {
      const res = flow.parser.parse('graph TD;A--x|text including `|B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(edges[0].text).toBe('text including `')
    })
    it('should handle v in node ids only v', function () {
            // only v
      const res = flow.parser.parse('graph TD;A--xv(my text);')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(vert['v'].text).toBe('my text')
    })
    it('should handle v in node ids v at end', function () {
            // v at end
      const res = flow.parser.parse('graph TD;A--xcsv(my text);')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(vert['csv'].text).toBe('my text')
    })
    it('should handle v in node ids v in middle', function () {
            // v in middle
      const res = flow.parser.parse('graph TD;A--xava(my text);')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(vert['ava'].text).toBe('my text')
    })
    it('should handle v in node ids, v at start', function () {
            // v at start
      const res = flow.parser.parse('graph TD;A--xva(my text);')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(vert['va'].text).toBe('my text')
    })
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;A--x|text including graph space|B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].text).toBe('text including graph space')
    })
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;V-->a[v]')
      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()
      expect(vert['a'].text).toBe('v')
    })
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;V-->a[v]')
      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()
      expect(vert['a'].text).toBe('v')
    })
    it('should handle quoted text', function () {
      const res = flow.parser.parse('graph TD;V-- "test string()" -->a[v]')
      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()
      expect(edges[0].text).toBe('test string()')
    })
  })

  describe('it should handle new line type notation', function () {
    it('it should handle regular lines', function () {
      const res = flow.parser.parse('graph TD;A-->B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].stroke).toBe('normal')
    })
    it('it should handle dotted lines', function () {
      const res = flow.parser.parse('graph TD;A-.->B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].stroke).toBe('dotted')
    })
    it('it should handle dotted lines', function () {
      const res = flow.parser.parse('graph TD;A==>B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].stroke).toBe('thick')
    })
    it('it should handle text on lines', function () {
      const res = flow.parser.parse('graph TD;A-- test text with == -->B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].stroke).toBe('normal')
    })
    it('it should handle text on lines', function () {
      const res = flow.parser.parse('graph TD;A-. test text with == .->B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].stroke).toBe('dotted')
    })
    it('it should handle text on lines', function () {
      const res = flow.parser.parse('graph TD;A== test text with - ==>B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].stroke).toBe('thick')
    })
  })

  describe('it should handle text on edges using the new notation', function () {
    it('it should handle text without space', function () {
      const res = flow.parser.parse('graph TD;A-- textNoSpace --xB;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('it should handle text with multiple leading space', function () {
      const res = flow.parser.parse('graph TD;A--    textNoSpace --xB;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('should handle  with space', function () {
      const res = flow.parser.parse('graph TD;A-- text including space --xB;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('it should handle text with /', function () {
      const res = flow.parser.parse('graph TD;A -- text with / should work --x B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].text).toBe('text with / should work')
    })

    it('it should handle space and space between vertices and link', function () {
      const res = flow.parser.parse('graph TD;A -- textNoSpace --x B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('should handle space and CAPS', function () {
      const res = flow.parser.parse('graph TD;A-- text including CAPS space --xB;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
    })

    it('should handle space and dir', function () {
      const res = flow.parser.parse('graph TD;A-- text including URL space --xB;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(edges[0].text).toBe('text including URL space')
    })

    it('should handle space and dir (TD)', function () {
      const res = flow.parser.parse('graph TD;A-- text including R TD space --xB;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].type).toBe('arrow_cross')
      expect(edges[0].text).toBe('text including R TD space')
    })
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;A-- text including graph space and v --xB;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].text).toBe('text including graph space and v')
    })
    it('should handle keywords', function () {
      const res = flow.parser.parse('graph TD;A-- text including graph space and v --xB[blav]')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(edges[0].text).toBe('text including graph space and v')
    })
        // xit('should handle text on open links',function(){
        //    const res = flow.parser.parse('graph TD;A-- text including graph space --B');
        //
        //    const vert = flow.parser.yy.getVertices();
        //    const edges = flow.parser.yy.getEdges();
        //
        //    expect(edges[0].text).toBe('text including graph space');
        //
        // });
  })

  it('should handle multi-line text', function () {
    const res = flow.parser.parse('graph TD;A--o|text space|B;\n B-->|more text with space|C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges[0].type).toBe('arrow_circle')
    expect(edges[1].type).toBe('arrow')
    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(vert['C'].id).toBe('C')
    expect(edges.length).toBe(2)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
        // expect(edges[0].text).toBe('text space');
    expect(edges[1].start).toBe('B')
    expect(edges[1].end).toBe('C')
    expect(edges[1].text).toBe('more text with space')
  })

  it('should handle multiple edges', function () {
    const res = flow.parser.parse('graph TD;A---|This is the 123 s text|B;\nA---|This is the second edge|B;')
    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].id).toBe('A')
    expect(vert['B'].id).toBe('B')
    expect(edges.length).toBe(2)
    expect(edges[0].start).toBe('A')
    expect(edges[0].end).toBe('B')
    expect(edges[0].text).toBe('This is the 123 s text')
    expect(edges[1].start).toBe('A')
    expect(edges[1].end).toBe('B')
    expect(edges[1].text).toBe('This is the second edge')
  })

  it('should handle text in vertices with space', function () {
    const res = flow.parser.parse('graph TD;A[chimpansen hoppar]-->C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].type).toBe('square')
    expect(vert['A'].text).toBe('chimpansen hoppar')
  })

  it('should handle text in vertices with space with spaces between vertices and link', function () {
    const res = flow.parser.parse('graph TD;A[chimpansen hoppar] --> C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].type).toBe('square')
    expect(vert['A'].text).toBe('chimpansen hoppar')
  })

  it('should handle quoted text in vertices ', function () {
    const res = flow.parser.parse('graph TD;A["chimpansen hoppar ()[]"] --> C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].type).toBe('square')
    expect(vert['A'].text).toBe('chimpansen hoppar ()[]')
  })

  it('should handle text in circle vertices with space', function () {
    const res = flow.parser.parse('graph TD;A((chimpansen hoppar))-->C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].type).toBe('circle')
    expect(vert['A'].text).toBe('chimpansen hoppar')
  })

  it('should handle text in ellipse vertices', function () {
    const res = flow.parser.parse('graph TD\nA(-this is an ellipse-)-->B')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].type).toBe('ellipse')
    expect(vert['A'].text).toBe('this is an ellipse')
  })

  it('should handle text in diamond vertices with space', function () {
    const res = flow.parser.parse('graph TD;A(chimpansen hoppar)-->C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].type).toBe('round')
    expect(vert['A'].text).toBe('chimpansen hoppar')
  })

  it('should handle text in with ?', function () {
    const res = flow.parser.parse('graph TD;A(?)-->|?|C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].text).toBe('?')
    expect(edges[0].text).toBe('?')
  })
  it('should handle text in with éèêàçô', function () {
    const res = flow.parser.parse('graph TD;A(éèêàçô)-->|éèêàçô|C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].text).toBe('éèêàçô')
    expect(edges[0].text).toBe('éèêàçô')
  })

  it('should handle text in with ,.?!+-*', function () {
    const res = flow.parser.parse('graph TD;A(,.?!+-*)-->|,.?!+-*|C;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['A'].text).toBe(',.?!+-*')
    expect(edges[0].text).toBe(',.?!+-*')
  })

  describe('it should handle text in vertices, ', function () {
    it('it should handle space', function () {
      const res = flow.parser.parse('graph TD;A-->C(Chimpansen hoppar);')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(vert['C'].type).toBe('round')
      expect(vert['C'].text).toBe('Chimpansen hoppar')
    })
    it('it should handle åäö and minus', function () {
      const res = flow.parser.parse('graph TD;A-->C{Chimpansen hoppar åäö-ÅÄÖ};')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(vert['C'].type).toBe('diamond')
      expect(vert['C'].text).toBe('Chimpansen hoppar åäö-ÅÄÖ')
    })

    it('it should handle with åäö, minus and space and br', function () {
      const res = flow.parser.parse('graph TD;A-->C(Chimpansen hoppar åäö  <br> -  ÅÄÖ);')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(vert['C'].type).toBe('round')
      expect(vert['C'].text).toBe('Chimpansen hoppar åäö  <br> -  ÅÄÖ')
    })
        // xit('it should handle åäö, minus and space and br',function(){
        //    const res = flow.parser.parse('graph TD; A[Object&#40;foo,bar&#41;]-->B(Thing);');
        //
        //    const vert = flow.parser.yy.getVertices();
        //    const edges = flow.parser.yy.getEdges();
        //
        //    expect(vert['C'].type).toBe('round');
        //    expect(vert['C'].text).toBe(' A[Object&#40;foo,bar&#41;]-->B(Thing);');
        // });
    it('it should handle unicode chars', function () {
      const res = flow.parser.parse('graph TD;A-->C(Начало);')

      const vert = flow.parser.yy.getVertices()

      expect(vert['C'].text).toBe('Начало')
    })
    it('it should handle backslask', function () {
      const res = flow.parser.parse('graph TD;A-->C(c:\\windows);')

      const vert = flow.parser.yy.getVertices()

      expect(vert['C'].text).toBe('c:\\windows')
    })
    it('it should handle CAPS', function () {
      const res = flow.parser.parse('graph TD;A-->C(some CAPS);')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(vert['C'].type).toBe('round')
      expect(vert['C'].text).toBe('some CAPS')
    })
    it('it should handle directions', function () {
      const res = flow.parser.parse('graph TD;A-->C(some URL);')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(vert['C'].type).toBe('round')
      expect(vert['C'].text).toBe('some URL')
    })
  })

  it('should handle a single node', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;A;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['A'].styles.length).toBe(0)
  })

  it('should handle a single square node', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a[A];')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['a'].styles.length).toBe(0)
    expect(vert['a'].type).toBe('square')
  })
  it('should handle a single round square node', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a[A];')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['a'].styles.length).toBe(0)
    expect(vert['a'].type).toBe('square')
  })
  it('should handle a single circle node', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a((A));')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['a'].type).toBe('circle')
  })
  it('should handle a single round node', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(A);')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['a'].type).toBe('round')
  })
  it('should handle a single odd node', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a>A];')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['a'].type).toBe('odd')
  })
  it('should handle a single diamond node', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{A};')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['a'].type).toBe('diamond')
  })
  it('should handle a single diamond node with html in it', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a{A <br> end};')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['a'].type).toBe('diamond')
    expect(vert['a'].text).toBe('A <br> end')
  })
  it('should handle a single round node with html in it', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;a(A <br> end);')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['a'].type).toBe('round')
    expect(vert['a'].text).toBe('A <br> end')
  })
  it('should handle a single node with alphanumerics starting on a char', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;id1;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['id1'].styles.length).toBe(0)
  })
  it('should handle a single node with alphanumerics starting on a num', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;1id;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['1id'].styles.length).toBe(0)
  })
  it('should handle a single node with alphanumerics containing a minus sign', function () {
        // Silly but syntactically correct
    const res = flow.parser.parse('graph TD;i-d;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(0)
    expect(vert['i-d'].styles.length).toBe(0)
  })
    // log.debug(flow.parser.parse('graph TD;style Q background:#fff;'));
  it('should handle styles for vertices', function () {
    const res = flow.parser.parse('graph TD;style Q background:#fff;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    const style = vert['Q'].styles[0]

    expect(vert['Q'].styles.length).toBe(1)
    expect(vert['Q'].styles[0]).toBe('background:#fff')
  })

    // log.debug(flow.parser.parse('graph TD;style Q background:#fff;'));
  it('should handle styles for edges', function () {
    const res = flow.parser.parse('graph TD;a-->b;\nstyle #0 stroke: #f66;')

    const edges = flow.parser.yy.getEdges()

    expect(edges.length).toBe(1)
  })

  it('should handle multiple styles for a vortex', function () {
    const res = flow.parser.parse('graph TD;style R background:#fff,border:1px solid red;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['R'].styles.length).toBe(2)
    expect(vert['R'].styles[0]).toBe('background:#fff')
    expect(vert['R'].styles[1]).toBe('border:1px solid red')
  })

  it('should handle multiple styles in a graph', function () {
    const res = flow.parser.parse('graph TD;style S background:#aaa;\nstyle T background:#bbb,border:1px solid red;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['S'].styles.length).toBe(1)
    expect(vert['T'].styles.length).toBe(2)
    expect(vert['S'].styles[0]).toBe('background:#aaa')
    expect(vert['T'].styles[0]).toBe('background:#bbb')
    expect(vert['T'].styles[1]).toBe('border:1px solid red')
  })

  it('should handle styles and graph definitons in a graph', function () {
    const res = flow.parser.parse('graph TD;S-->T;\nstyle S background:#aaa;\nstyle T background:#bbb,border:1px solid red;')

    const vert = flow.parser.yy.getVertices()
    const edges = flow.parser.yy.getEdges()

    expect(vert['S'].styles.length).toBe(1)
    expect(vert['T'].styles.length).toBe(2)
    expect(vert['S'].styles[0]).toBe('background:#aaa')
    expect(vert['T'].styles[0]).toBe('background:#bbb')
    expect(vert['T'].styles[1]).toBe('border:1px solid red')
  })
  it('should handle styles and graph definitons in a graph', function () {
    const res = flow.parser.parse('graph TD;style T background:#bbb,border:1px solid red;')
        // const res = flow.parser.parse('graph TD;style T background: #bbb;');

    const vert = flow.parser.yy.getVertices()

    expect(vert['T'].styles.length).toBe(2)
    expect(vert['T'].styles[0]).toBe('background:#bbb')
    expect(vert['T'].styles[1]).toBe('border:1px solid red')
  })

  describe('special characters should be be handled.', function () {
    const charTest = function (char) {
      const res = flow.parser.parse('graph TD;A(' + char + ')-->B;')

      const vert = flow.parser.yy.getVertices()
      const edges = flow.parser.yy.getEdges()

      expect(vert['A'].id).toBe('A')
      expect(vert['B'].id).toBe('B')
      expect(vert['A'].text).toBe(char)
    }

    it('it should be able to parse a \'.\'', function () {
      charTest('.')
      charTest('Start 103a.a1')
    })

    it('it should be able to parse text containing \'_\'', function () {
      charTest('_')
    })

    it('it should be able to parse a \':\'', function () {
      charTest(':')
    })

    it('it should be able to parse a \',\'', function () {
      charTest(',')
    })

    it('it should be able to parse text containing \'-\'', function () {
      charTest('a-b')
    })

    it('it should be able to parse a \'+\'', function () {
      charTest('+')
    })

    it('it should be able to parse a \'*\'', function () {
      charTest('*')
    })

    it('it should be able to parse a \'<\'', function () {
      charTest('<')
    })

    it('it should be able to parse a \'>\'', function () {
      charTest('>')
    })

    it('it should be able to parse a \'=\'', function () {
      charTest('=')
    })
  })

  it('should be possible to declare a class', function () {
    const res = flow.parser.parse('graph TD;classDef exClass background:#bbb,border:1px solid red;')
        // const res = flow.parser.parse('graph TD;style T background: #bbb;');

    const classes = flow.parser.yy.getClasses()

    expect(classes['exClass'].styles.length).toBe(2)
    expect(classes['exClass'].styles[0]).toBe('background:#bbb')
    expect(classes['exClass'].styles[1]).toBe('border:1px solid red')
  })

  it('should be possible to declare a class with a dot in the style', function () {
    const res = flow.parser.parse('graph TD;classDef exClass background:#bbb,border:1.5px solid red;')
        // const res = flow.parser.parse('graph TD;style T background: #bbb;');

    const classes = flow.parser.yy.getClasses()

    expect(classes['exClass'].styles.length).toBe(2)
    expect(classes['exClass'].styles[0]).toBe('background:#bbb')
    expect(classes['exClass'].styles[1]).toBe('border:1.5px solid red')
  })
  it('should be possible to declare a class with a space in the style', function () {
    const res = flow.parser.parse('graph TD;classDef exClass background:  #bbb,border:1.5px solid red;')
        // const res = flow.parser.parse('graph TD;style T background  :  #bbb;');

    const classes = flow.parser.yy.getClasses()

    expect(classes['exClass'].styles.length).toBe(2)
    expect(classes['exClass'].styles[0]).toBe('background:  #bbb')
    expect(classes['exClass'].styles[1]).toBe('border:1.5px solid red')
  })
  it('should be possible to apply a class to a vertex', function () {
    let statement = ''

    statement = statement + 'graph TD;' + '\n'
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n'
    statement = statement + 'a-->b;' + '\n'
    statement = statement + 'class a exClass;'

    const res = flow.parser.parse(statement)

    const classes = flow.parser.yy.getClasses()

    expect(classes['exClass'].styles.length).toBe(2)
    expect(classes['exClass'].styles[0]).toBe('background:#bbb')
    expect(classes['exClass'].styles[1]).toBe('border:1px solid red')
  })
  it('should be possible to apply a class to a comma separated list of vertices', function () {
    let statement = ''

    statement = statement + 'graph TD;' + '\n'
    statement = statement + 'classDef exClass background:#bbb,border:1px solid red;' + '\n'
    statement = statement + 'a-->b;' + '\n'
    statement = statement + 'class a,b exClass;'

    const res = flow.parser.parse(statement)

    const classes = flow.parser.yy.getClasses()
    const vertices = flow.parser.yy.getVertices()

    expect(classes['exClass'].styles.length).toBe(2)
    expect(classes['exClass'].styles[0]).toBe('background:#bbb')
    expect(classes['exClass'].styles[1]).toBe('border:1px solid red')
    expect(vertices['a'].classes[0]).toBe('exClass')
    expect(vertices['b'].classes[0]).toBe('exClass')
  })
})
