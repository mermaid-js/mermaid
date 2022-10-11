import stateDb from '../stateDb';
import stateDiagram from './stateDiagram';
import { setConfig } from '../../../config';

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
        expect(styleClasses['exampleClass'].styles.length).toEqual(1);
        expect(styleClasses['exampleClass'].styles[0]).toEqual('background:#bbb');
      });

      it('can define multiple attributes separated by commas', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef exampleClass background:#bbb, font-weight:bold, font-style:italic;'
        );
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const styleClasses = stateDb.getClasses();
        expect(styleClasses['exampleClass'].styles.length).toEqual(3);
        expect(styleClasses['exampleClass'].styles[0]).toEqual('background:#bbb');
        expect(styleClasses['exampleClass'].styles[1]).toEqual('font-weight:bold');
        expect(styleClasses['exampleClass'].styles[2]).toEqual('font-style:italic');
      });

      // need to look at what the lexer is doing.  see the work on the chevotrain parser
      it('an attribute can have a dot in the style', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef exampleStyleClass background:#bbb,border:1.5px solid red;'
        );
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const classes = stateDiagram.parser.yy.getClasses();
        expect(classes['exampleStyleClass'].styles.length).toBe(2);
        expect(classes['exampleStyleClass'].styles[0]).toBe('background:#bbb');
        expect(classes['exampleStyleClass'].styles[1]).toBe('border:1.5px solid red');
      });

      it('an attribute can have a space in the style', function () {
        stateDiagram.parser.parse(
          'stateDiagram-v2\n classDef exampleStyleClass background:  #bbb,border:1.5px solid red;'
        );
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const classes = stateDiagram.parser.yy.getClasses();
        expect(classes['exampleStyleClass'].styles.length).toBe(2);
        expect(classes['exampleStyleClass'].styles[0]).toBe('background:  #bbb');
        expect(classes['exampleStyleClass'].styles[1]).toBe('border:1.5px solid red');
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
        expect(classes['exampleStyleClass'].styles.length).toEqual(2);
        expect(classes['exampleStyleClass'].styles[0]).toEqual('background:#bbb');
        expect(classes['exampleStyleClass'].styles[1]).toEqual('border:1px solid red');

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
        expect(classes['exampleStyleClass'].styles.length).toBe(2);
        expect(classes['exampleStyleClass'].styles[0]).toBe('background:#bbb');
        expect(classes['exampleStyleClass'].styles[1]).toBe('border:1px solid red');

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

          expect(classes['exampleStyleClass'].styles.length).toEqual(2);
          expect(classes['exampleStyleClass'].styles[0]).toEqual('background:#bbb');
          expect(classes['exampleStyleClass'].styles[1]).toEqual('border:1px solid red');

          expect(states['b'].classes[0]).toEqual('exampleStyleClass');
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

          expect(classes['exampleStyleClass'].styles.length).toEqual(2);
          expect(classes['exampleStyleClass'].styles[0]).toEqual('background:#bbb');
          expect(classes['exampleStyleClass'].styles[1]).toEqual('border:1px solid red');

          expect(states['root_start'].classes[0]).toEqual('exampleStyleClass');
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

          expect(classes['exampleStyleClass'].styles.length).toEqual(2);
          expect(classes['exampleStyleClass'].styles[0]).toEqual('background:#bbb');
          expect(classes['exampleStyleClass'].styles[1]).toEqual('border:1px solid red');
          expect(states['a'].classes[0]).toEqual('exampleStyleClass');
          expect(states['b'].classes[0]).toEqual('exampleStyleClass');
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

          expect(classes['exampleStyleClass'].styles.length).toEqual(2);
          expect(classes['exampleStyleClass'].styles[0]).toEqual('background:#bbb');
          expect(classes['exampleStyleClass'].styles[1]).toEqual('border:1px solid red');

          const statesList = ['a', 'b', 'c', 'd', 'e'];
          statesList.forEach((stateId) => {
            expect(states[stateId].classes[0]).toEqual('exampleStyleClass');
          });
        });
      });
    });
  });
});
