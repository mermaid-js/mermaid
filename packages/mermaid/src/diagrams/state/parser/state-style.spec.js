import { setConfig } from '../../../config.js';
import { StateDB } from '../stateDb.js';
import stateDiagram from './stateDiagram.jison';

setConfig({
  securityLevel: 'strict',
});

describe('ClassDefs and classes when parsing a State diagram', () => {
  let stateDb;
  beforeEach(function () {
    stateDb = new StateDB(2);
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  describe('class for a state (classDef)', () => {
    describe('defining (classDef)', () => {
      it('has "classDef" as a keyword, an id, and can set a css style attribute', function () {
        stateDiagram.parser.parse('stateDiagram-v2\n classDef exampleClass background:#bbb;');

        const styleClasses = stateDb.getClasses();
        expect(styleClasses.get('exampleClass').styles.length).toEqual(1);
        expect(styleClasses.get('exampleClass').styles[0]).toEqual('background:#bbb');
      });

      it('can define multiple attributes separated by commas', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef exampleClass background:#bbb, font-weight:bold, font-style:italic;'
        );

        const styleClasses = stateDb.getClasses();
        expect(styleClasses.get('exampleClass').styles.length).toEqual(3);
        expect(styleClasses.get('exampleClass').styles[0]).toEqual('background:#bbb');
        expect(styleClasses.get('exampleClass').styles[1]).toEqual('font-weight:bold');
        expect(styleClasses.get('exampleClass').styles[2]).toEqual('font-style:italic');
      });

      // need to look at what the lexer is doing
      it('an attribute can have a dot in the style', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef exampleStyleClass background:#bbb,border:1.5px solid red;'
        );

        const classes = stateDiagram.parser.yy.getClasses();
        expect(classes.get('exampleStyleClass').styles.length).toBe(2);
        expect(classes.get('exampleStyleClass').styles[0]).toBe('background:#bbb');
        expect(classes.get('exampleStyleClass').styles[1]).toBe('border:1.5px solid red');
      });

      it('an attribute can have a space in the style', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef exampleStyleClass background:  #bbb,border:1.5px solid red;'
        );

        const classes = stateDiagram.parser.yy.getClasses();
        expect(classes.get('exampleStyleClass').styles.length).toBe(2);
        expect(classes.get('exampleStyleClass').styles[0]).toBe('background:  #bbb');
        expect(classes.get('exampleStyleClass').styles[1]).toBe('border:1.5px solid red');
      });

      it('can have __proto__ or constructor as a class name', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef __proto__ background:#bbb,border:1.5px solid red;\n classDef constructor background:#bbb,border:1.5px solid red;'
        );
        const classes = stateDiagram.parser.yy.getClasses();
        expect(classes.get('__proto__').styles.length).toBe(2);
        expect(classes.get('constructor').styles.length).toBe(2);
      });
    });

    describe('applying to states in the diagram', () => {
      it('can apply a class to a state', function () {
        let diagram = '';
        diagram += 'stateDiagram-v2\n' + '\n';
        diagram += 'classDef exampleStyleClass background:#bbb,border:1px solid red;\n';
        diagram += 'a --> b ';
        diagram += 'class a exampleStyleClass';

        stateDiagram.parser.parse(diagram);

        const classes = stateDb.getClasses();
        expect(classes.get('exampleStyleClass').styles.length).toEqual(2);
        expect(classes.get('exampleStyleClass').styles[0]).toEqual('background:#bbb');
        expect(classes.get('exampleStyleClass').styles[1]).toEqual('border:1px solid red');

        const state_a = stateDb.getState('a');
        expect(state_a.classes.length).toEqual(1);
        expect(state_a.classes[0]).toEqual('exampleStyleClass');
      });

      it('can be applied to a state with an id containing _', function () {
        let diagram = '';

        diagram += 'stateDiagram-v2\n' + '\n';
        diagram += 'classDef exampleStyleClass background:#bbb,border:1px solid red;\n';
        diagram += 'a_a --> b_b' + '\n';
        diagram += 'class a_a exampleStyleClass';

        stateDiagram.parser.parse(diagram);

        const classes = stateDiagram.parser.yy.getClasses();
        expect(classes.get('exampleStyleClass').styles.length).toBe(2);
        expect(classes.get('exampleStyleClass').styles[0]).toBe('background:#bbb');
        expect(classes.get('exampleStyleClass').styles[1]).toBe('border:1px solid red');

        const state_a_a = stateDiagram.parser.yy.getState('a_a');
        expect(state_a_a.classes.length).toEqual(1);
        expect(state_a_a.classes[0]).toEqual('exampleStyleClass');
      });

      describe('::: syntax', () => {
        it('can be applied to a state using ::: syntax', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n' + '\n';
          diagram += 'classDef exampleStyleClass background:#bbb,border:1px solid red;' + '\n';
          diagram += 'a --> b:::exampleStyleClass' + '\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();
          const classes = stateDiagram.parser.yy.getClasses();

          expect(classes.get('exampleStyleClass').styles.length).toEqual(2);
          expect(classes.get('exampleStyleClass').styles[0]).toEqual('background:#bbb');
          expect(classes.get('exampleStyleClass').styles[1]).toEqual('border:1px solid red');

          expect(states.get('b').classes[0]).toEqual('exampleStyleClass');
        });

        it('can be applied to a [*] state', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n\n';
          diagram += 'classDef exampleStyleClass background:#bbb,border:1px solid red;\n';
          diagram += '[*]:::exampleStyleClass --> b\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();
          const classes = stateDiagram.parser.yy.getClasses();

          expect(classes.get('exampleStyleClass').styles.length).toEqual(2);
          expect(classes.get('exampleStyleClass').styles[0]).toEqual('background:#bbb');
          expect(classes.get('exampleStyleClass').styles[1]).toEqual('border:1px solid red');

          expect(states.get('root_start').classes[0]).toEqual('exampleStyleClass');
        });

        it('can be applied to a comma separated list of states', function () {
          let diagram = '';
          diagram += 'stateDiagram-v2\n\n';
          diagram += 'classDef exampleStyleClass background:#bbb,border:1px solid red;\n';
          diagram += 'a-->b\n';
          diagram += 'class a,b exampleStyleClass';

          stateDiagram.parser.parse(diagram);
          let classes = stateDiagram.parser.yy.getClasses();
          let states = stateDiagram.parser.yy.getStates();

          expect(classes.get('exampleStyleClass').styles.length).toEqual(2);
          expect(classes.get('exampleStyleClass').styles[0]).toEqual('background:#bbb');
          expect(classes.get('exampleStyleClass').styles[1]).toEqual('border:1px solid red');
          expect(states.get('a').classes[0]).toEqual('exampleStyleClass');
          expect(states.get('b').classes[0]).toEqual('exampleStyleClass');
        });

        it('a comma separated list of states may or may not have spaces after commas', function () {
          let diagram = '';
          diagram += 'stateDiagram-v2\n\n';
          diagram += 'classDef exampleStyleClass background:#bbb,border:1px solid red;\n';
          diagram += 'a-->b\n';
          diagram += 'class a,b,c, d, e exampleStyleClass';

          stateDiagram.parser.parse(diagram);
          const classes = stateDiagram.parser.yy.getClasses();
          const states = stateDiagram.parser.yy.getStates();

          expect(classes.get('exampleStyleClass').styles.length).toEqual(2);
          expect(classes.get('exampleStyleClass').styles[0]).toEqual('background:#bbb');
          expect(classes.get('exampleStyleClass').styles[1]).toEqual('border:1px solid red');

          const statesList = ['a', 'b', 'c', 'd', 'e'];
          statesList.forEach((stateId) => {
            expect(states.get(stateId).classes[0]).toEqual('exampleStyleClass');
          });
        });
      });

      describe('::: syntax inside composite states', () => {
        it('can be applied to a state inside a composite state', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n\n';
          diagram += 'classDef exampleStyleClass background:#bbb,border:1px solid red;\n';
          diagram += 'state A {\n';
          diagram += '  a:::exampleStyleClass --> b\n';
          diagram += '}\n';

          stateDiagram.parser.parse(diagram);

          const stateA = stateDiagram.parser.yy.getStates().get('A');
          const relation = stateA.doc[0];
          expect(relation.state1.classes[0]).toEqual('exampleStyleClass');
        });

        it('can be applied to a [*] state inside a composite state', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n\n';
          diagram += 'classDef exampleStyleClass background:#bbb,border:1px solid red;\n';
          diagram += 'state A {\n';
          diagram += '  [*]:::exampleStyleClass --> a\n';
          diagram += '}\n';

          stateDiagram.parser.parse(diagram);

          const stateA = stateDiagram.parser.yy.getStates().get('A');
          const relation = stateA.doc[0];
          expect(relation.state1.classes[0]).toEqual('exampleStyleClass');
        });
      });

      describe('comments parsing', () => {
        it('working inside states', function () {
          let diagram = '';
          diagram += 'stateDiagram-v2\n\n';
          diagram += '[*] --> Moving\n';
          diagram += 'Moving --> Still\n';
          diagram += 'Moving --> Crash\n';
          diagram += 'state Moving {\n';
          diagram += '%% comment inside state\n';
          diagram += 'slow  --> fast\n';
          diagram += '}\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();

          expect(states.get('Moving').doc.length).toEqual(1);
        });

        it('should handle comments correctly', function () {
          let diagram = '';
          diagram += 'stateDiagram-v2\n';
          diagram += '%%initial_comment\n';
          diagram += '[*] --> Moving %%inline_comment\n';
          diagram += '%%final_comment\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();

          expect(states.size).toEqual(2);
          expect(states.get('%%initial_comment')).toBeUndefined();
          expect(states.get('%%inline_comment')).toBeUndefined();
          expect(states.get('%%final_comment')).toBeUndefined();
        });

        it('should handle comments correctly inside states', function () {
          let diagram = '';
          diagram += 'stateDiagram-v2\n';
          diagram += 'state Moving {\n';
          diagram += '%%comment_inside_state\n';
          diagram += 'slow  --> fast %%inline_comment\n';
          diagram += '}\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();

          const movingDoc = states.get('Moving').doc;
          const state1 = movingDoc.find((d) => d.id === '%%comment_inside_state');
          expect(state1).toBeUndefined();
          const state2 = movingDoc.find((d) => d.id === '%%inline_comment');
          expect(state2).toBeUndefined();
        });

        it('should handle comments correctly after a blank line', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n';
          diagram += '[*] --> Moving\n';
          diagram += '\n';
          diagram += '%% comment after a blank line\n';
          diagram += 'Moving --> Still\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();

          expect(states.size).toEqual(3);
        });

        it('should parse single % as normal syntax, not a comment', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n';
          diagram += '% not a comment\n';
          diagram += 'Moving --> Still %inline\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();

          expect(states.size).toEqual(7);
          expect(states.get('%inline')).toBeDefined();
        });

        it('should skip multiple consecutive comment lines', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n';
          diagram += '%% first comment\n';
          diagram += '%% second comment\n';
          diagram += '%% third comment\n';
          diagram += '[*] --> Moving\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();

          expect(states.size).toEqual(2);
        });

        it('transitions should be preserved when separated by a comment', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n';
          diagram += 'Moving --> Crash\n';
          diagram += '%% comment between\n';
          diagram += 'Moving --> Still\n';

          stateDiagram.parser.parse(diagram);

          const relationships = stateDiagram.parser.yy.getRelations();
          const states = stateDiagram.parser.yy.getStates();

          expect(states.size).toEqual(3);
          expect(relationships).toHaveLength(2);
          expect(relationships[0].id1).toEqual('Moving');
          expect(relationships[0].id2).toEqual('Crash');
          expect(relationships[1].id1).toEqual('Moving');
          expect(relationships[1].id2).toEqual('Still');
        });

        it('should correctly handle inline %% comments in state syntax', () => {
          let diagram = '';
          diagram += 'stateDiagram-v2\n';
          diagram += '[*] --> Moving%% this is a comment\n';
          diagram += 'Moving --> Still%Active\n';

          stateDiagram.parser.parse(diagram);

          const states = stateDiagram.parser.yy.getStates();

          expect(states.get('Moving')).toBeDefined();
          expect(states.get('Still%Active')).toBeDefined();
        });
      });
    });
  });

  describe('style statement for a state (style)', () => {
    describe('defining (style)', () => {
      it('has "style" as a keyword, an id, and can set a css style attribute', function () {
        stateDiagram.parser.parse(`stateDiagram-v2
        id1
        style id1 background:#bbb`);
        const data4Layout = stateDiagram.parser.yy.getData();

        expect(data4Layout.nodes[0].cssStyles).toEqual(['background:#bbb']);
      });
      it('has "style" as a keyword, an id, and can set a css style attribute', function () {
        stateDiagram.parser.parse(`stateDiagram-v2
        id1
        id2
        style id1,id2 background:#bbb`);
        const data4Layout = stateDiagram.parser.yy.getData();

        expect(data4Layout.nodes[0].cssStyles).toEqual(['background:#bbb']);
        expect(data4Layout.nodes[1].cssStyles).toEqual(['background:#bbb']);
      });

      it('can define multiple attributes separated by commas', function () {
        stateDiagram.parser.parse(`stateDiagram-v2
        id1
        id2
        style id1,id2 background:#bbb, font-weight:bold, font-style:italic;`);

        const data4Layout = stateDiagram.parser.yy.getData();

        expect(data4Layout.nodes[0].cssStyles).toEqual([
          'background:#bbb',
          'font-weight:bold',
          'font-style:italic',
        ]);
        expect(data4Layout.nodes[1].cssStyles).toEqual([
          'background:#bbb',
          'font-weight:bold',
          'font-style:italic',
        ]);
      });
    });
  });

  describe('linkStyle statement for transitions', () => {
    it('applies an indexed style to the selected transition and its label', () => {
      stateDiagram.parser.parse(`stateDiagram-v2
        A --> B: first
        B --> C: second
        linkStyle 1 stroke:#f00,stroke-width:4px,color:blue`);

      const data4Layout = stateDiagram.parser.yy.getData();

      expect(data4Layout.edges[0].style).toBe('fill:none');
      expect(data4Layout.edges[1].style).toEqual([
        'fill:none',
        'stroke:#f00',
        'stroke-width:4px',
        'color:blue',
      ]);
      expect(data4Layout.edges[1].labelStyle).toEqual([
        'stroke:#f00',
        'stroke-width:4px',
        'color:blue',
      ]);
    });

    it('applies a default style to transitions without styling internal note edges', () => {
      stateDiagram.parser.parse(`stateDiagram-v2
        A --> B: first
        note right of B: context
        B --> C: second
        linkStyle default stroke:#999,stroke-width:2px,color:#333`);

      const data4Layout = stateDiagram.parser.yy.getData();
      const transitions = data4Layout.edges.filter((edge) => edge.classes === 'transition');
      const noteEdge = data4Layout.edges.find((edge) => edge.classes.includes('note-edge'));

      expect(transitions).toHaveLength(2);
      for (const transition of transitions) {
        expect(transition.style).toEqual([
          'fill:none',
          'stroke:#999',
          'stroke-width:2px',
          'color:#333',
        ]);
        expect(transition.labelStyle).toEqual(['stroke:#999', 'stroke-width:2px', 'color:#333']);
      }
      expect(noteEdge.style).toBe('fill:none');
      expect(noteEdge.labelStyle).toBe('');
    });

    it('uses the last default and indexed declarations while keeping indexed styles most specific', () => {
      stateDiagram.parser.parse(`stateDiagram-v2
        A --> B
        B --> C
        C --> D
        linkStyle 0,2 stroke:#f80,stroke-width:2px
        linkStyle default stroke:#999,color:gray
        linkStyle 2 stroke:#00f,color:blue
        linkStyle default stroke:#333,color:black`);

      const { edges } = stateDiagram.parser.yy.getData();

      expect(edges[0].style).toEqual([
        'fill:none',
        'color:black',
        'stroke:#f80',
        'stroke-width:2px',
      ]);
      expect(edges[1].style).toEqual(['fill:none', 'stroke:#333', 'color:black']);
      expect(edges[2].style).toEqual(['fill:none', 'stroke:#00f', 'color:blue']);
      expect(edges[2].labelStyle).toEqual(['stroke:#00f', 'color:blue']);
    });

    it('numbers nested transitions in deterministic source order and accepts declarations before edges', () => {
      stateDiagram.parser.parse(`stateDiagram-v2
        linkStyle 0,2 stroke:#c00
        A --> B: outer first
        state Group {
          C --> D: nested
        }
        B --> Group: outer last`);

      const transitions = stateDiagram.parser.yy
        .getData()
        .edges.filter((edge) => edge.classes === 'transition');

      expect(transitions.map(({ start, end }) => [start, end])).toEqual([
        ['A', 'B'],
        ['C', 'D'],
        ['B', 'Group'],
      ]);
      expect(transitions[0].style).toEqual(['fill:none', 'stroke:#c00']);
      expect(transitions[1].style).toBe('fill:none');
      expect(transitions[2].style).toEqual(['fill:none', 'stroke:#c00']);
    });

    it('does not count note connector edges in indexed link styles', () => {
      stateDiagram.parser.parse(`stateDiagram-v2
        A
        note right of A: context
        A --> B
        B --> C
        linkStyle 1 stroke:#0a0`);

      const { edges } = stateDiagram.parser.yy.getData();
      const transitions = edges.filter((edge) => edge.classes === 'transition');
      const noteEdge = edges.find((edge) => edge.classes.includes('note-edge'));

      expect(transitions[0].style).toBe('fill:none');
      expect(transitions[1].style).toEqual(['fill:none', 'stroke:#0a0']);
      expect(noteEdge.style).toBe('fill:none');
    });

    it('supports escaped commas in CSS values and an optional trailing semicolon', () => {
      stateDiagram.parser.parse(`stateDiagram-v2
        A --> B
        linkStyle 0 stroke-dasharray:5\\,5,font-family:Arial\\,sans-serif;`);

      const { edges } = stateDiagram.parser.yy.getData();

      expect(edges[0].style).toEqual([
        'fill:none',
        'stroke-dasharray:5,5',
        'font-family:Arial,sans-serif',
      ]);
    });

    it('requires the targets and styles to stay on the linkStyle line', () => {
      expect(() =>
        stateDiagram.parser.parse(`stateDiagram-v2
          A --> B
          linkStyle 0
          B --> C`)
      ).toThrow();
    });

    it('reports indexed styles that are outside the transition range', () => {
      expect(() =>
        stateDiagram.parser.parse(`stateDiagram-v2
          A --> B
          linkStyle 1 stroke:#f00`)
      ).toThrow(
        'The index 1 for linkStyle is out of bounds. Valid indices for linkStyle are between 0 and 0. (Help: Ensure that the index is within the range of existing transitions.)'
      );
    });

    it('reports indexed styles when the diagram has no transitions', () => {
      expect(() =>
        stateDiagram.parser.parse(`stateDiagram-v2
          A
          linkStyle 0 stroke:#f00`)
      ).toThrow(
        'The index 0 for linkStyle is out of bounds because the state diagram has no transitions.'
      );
    });
  });
});
