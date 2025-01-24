import stateDb from '../stateDb.js';
import stateDiagram from './stateDiagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('ClassDefs and classes when parsing a State diagram', () => {
  beforeEach(function () {
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  describe('class for a state (classDef)', () => {
    describe('defining (classDef)', () => {
      it('has "classDef" as a keyword, an id, and can set a css style attribute', function () {
        stateDiagram.parser.parse('stateDiagram-v2\n classDef exampleClass background:#bbb;');
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const styleClasses = stateDb.getClasses();
        expect(styleClasses.get('exampleClass').styles.length).toEqual(1);
        expect(styleClasses.get('exampleClass').styles[0]).toEqual('background:#bbb');
      });

      it('can define multiple attributes separated by commas', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef exampleClass background:#bbb, font-weight:bold, font-style:italic;'
        );
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

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
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const classes = stateDiagram.parser.yy.getClasses();
        expect(classes.get('exampleStyleClass').styles.length).toBe(2);
        expect(classes.get('exampleStyleClass').styles[0]).toBe('background:#bbb');
        expect(classes.get('exampleStyleClass').styles[1]).toBe('border:1.5px solid red');
      });

      it('an attribute can have a space in the style', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef exampleStyleClass background:  #bbb,border:1.5px solid red;'
        );
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const classes = stateDiagram.parser.yy.getClasses();
        expect(classes.get('exampleStyleClass').styles.length).toBe(2);
        expect(classes.get('exampleStyleClass').styles[0]).toBe('background:  #bbb');
        expect(classes.get('exampleStyleClass').styles[1]).toBe('border:1.5px solid red');
      });

      it('can have __proto__ or constructor as a class name', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef __proto__ background:#bbb,border:1.5px solid red;\n classDef constructor background:#bbb,border:1.5px solid red;'
        );
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());
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
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

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
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

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
          stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

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
          stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

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
          stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());
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
          stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());
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
          stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

          const states = stateDiagram.parser.yy.getStates();

          expect(states.get('Moving').doc.length).toEqual(1);
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
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());
        const data4Layout = stateDiagram.parser.yy.getData();

        expect(data4Layout.nodes[0].cssStyles).toEqual(['background:#bbb']);
      });
      it('has "style" as a keyword, an id, and can set a css style attribute', function () {
        stateDiagram.parser.parse(`stateDiagram-v2
        id1
        id2
        style id1,id2 background:#bbb`);
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());
        const data4Layout = stateDiagram.parser.yy.getData();

        expect(data4Layout.nodes[0].cssStyles).toEqual(['background:#bbb']);
        expect(data4Layout.nodes[1].cssStyles).toEqual(['background:#bbb']);
      });

      it('can define multiple attributes separated by commas', function () {
        stateDiagram.parser.parse(`stateDiagram-v2
        id1
        id2
        style id1,id2 background:#bbb, font-weight:bold, font-style:italic;`);

        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());
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
});
