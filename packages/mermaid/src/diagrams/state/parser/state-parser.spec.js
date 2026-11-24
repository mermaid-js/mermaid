import { StateDB } from '../stateDb.js';
import stateDiagram from './stateDiagram.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('state parser can parse...', () => {
  let stateDb;
  beforeEach(function () {
    stateDb = new StateDB(2);
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  describe('invalid name between state and curly bracket', () => {
    describe('valid syntax', () => {
      it('should only accept 1 word', () => {
        const diagramText = `stateDiagram-v2
        state valid { X }`;

        stateDiagram.parser.parse(diagramText);

        const states = stateDiagram.parser.yy.getStates();
        expect(states.get('valid')).not.toBeUndefined();
      });
    });

    describe('invalid syntax', () => {
      it('should throw error with 2 words', () => {
        const diagramText = `stateDiagram-v2
        state invalid syntax { Y }`;

        expect(() => {
          stateDiagram.parser.parse(diagramText);
        }).toThrow('Error: State name must be a single word.');
      });

      it('should also throw with more than 2 words', () => {
        const diagramText = `stateDiagram-v2
        state invalid syntax with more than 2 words { Z }`;

        expect(() => {
          stateDiagram.parser.parse(diagramText);
        }).toThrow('Error: State name must be a single word.');
      });
    });
  });

  describe('states with id displayed as a (name)', () => {
    describe('syntax 1: stateID as "name in quotes"', () => {
      it('stateID as "some name"', () => {
        const diagramText = `stateDiagram-v2
        state "Small State 1" as namedState1`;
        stateDiagram.parser.parse(diagramText);

        const states = stateDiagram.parser.yy.getStates();
        expect(states.get('namedState1')).not.toBeUndefined();
        expect(states.get('namedState1').descriptions.join(' ')).toEqual('Small State 1');
      });
    });

    describe('syntax 2: stateID: "name in quotes" [colon after the id]', () => {
      it('space before and after the colon', () => {
        const diagramText = `stateDiagram-v2
        namedState1 : Small State 1`;
        stateDiagram.parser.parse(diagramText);

        const states = stateDiagram.parser.yy.getStates();
        expect(states.get('namedState1')).not.toBeUndefined();
        expect(states.get('namedState1').descriptions.join(' ')).toEqual('Small State 1');
      });

      it('no spaces before and after the colon', () => {
        const diagramText = `stateDiagram-v2
        namedState1:Small State 1`;
        stateDiagram.parser.parse(diagramText);

        const states = stateDiagram.parser.yy.getStates();
        expect(states.get('namedState1')).not.toBeUndefined();
        expect(states.get('namedState1').descriptions.join(' ')).toEqual('Small State 1');
      });
    });
  });

  describe('can handle "as" in a state name', () => {
    it('assemble, assemblies, state assemble, state assemblies', function () {
      const diagramText = `stateDiagram-v2
      assemble
      assemblies
      state assemble
      state assemblies
      `;
      stateDiagram.parser.parse(diagramText);
      const states = stateDiagram.parser.yy.getStates();
      expect(states.get('assemble')).not.toBeUndefined();
      expect(states.get('assemblies')).not.toBeUndefined();
    });

    it('state "as" as as', function () {
      const diagramText = `stateDiagram-v2
      state "as" as as
      `;
      stateDiagram.parser.parse(diagramText);
      const states = stateDiagram.parser.yy.getStates();
      expect(states.get('as')).not.toBeUndefined();
      expect(states.get('as').descriptions.join(' ')).toEqual('as');
    });
  });

  describe('groups (clusters/containers)', () => {
    it('state "Group Name" as stateIdentifier', () => {
      const diagramText = `stateDiagram-v2
        state "Small State 1" as namedState1
        %% Notice that this is named "Big State 1" with an "as"
        state "Big State 1" as bigState1 {
            bigState1InternalState
        }
        namedState1 --> bigState1: should point to \\nBig State 1 container

        state "Small State 2" as namedState2
        %% Notice that bigState2 does not have a name; no "as"
        state bigState2 {
            bigState2InternalState
        }
        namedState2 --> bigState2: should point to \\nbigState2 container`;

      stateDiagram.parser.parse(diagramText);

      const states = stateDiagram.parser.yy.getStates();
      expect(states.get('namedState1')).not.toBeUndefined();
      expect(states.get('bigState1')).not.toBeUndefined();
      expect(states.get('bigState1').doc[0].id).toEqual('bigState1InternalState');
      expect(states.get('namedState2')).not.toBeUndefined();
      expect(states.get('bigState2')).not.toBeUndefined();
      expect(states.get('bigState2').doc[0].id).toEqual('bigState2InternalState');
      const relationships = stateDiagram.parser.yy.getRelations();
      expect(relationships[0].id1).toEqual('namedState1');
      expect(relationships[0].id2).toEqual('bigState1');
      expect(relationships[1].id1).toEqual('namedState2');
      expect(relationships[1].id2).toEqual('bigState2');
    });

    it('group has a state with stateID AS "state name" and state2ID: "another state name"', () => {
      const diagramText = `stateDiagram-v2
        state "Big State 1" as bigState1 {
            state "inner state 1" as inner1
            inner2: inner state 2
            inner1 --> inner2
        }`;
      stateDiagram.parser.parse(diagramText);

      const states = stateDiagram.parser.yy.getStates();
      expect(states.get('bigState1')).not.toBeUndefined();
      expect(states.get('bigState1').doc[0].id).toEqual('inner1');
      expect(states.get('bigState1').doc[0].description).toEqual('inner state 1');
      expect(states.get('bigState1').doc[1].id).toEqual('inner2');
      expect(states.get('bigState1').doc[1].description).toEqual('inner state 2');
    });
  });

  describe('colons in transition descriptions (issue #7418)', () => {
    it('should allow a colon inside transition text', () => {
      const diagramText = `stateDiagram-v2
        locked --> pending : recoverable error (ex: timeout)`;
      stateDiagram.parser.parse(diagramText);

      const relationships = stateDiagram.parser.yy.getRelations();
      expect(relationships).toHaveLength(1);
      expect(relationships[0].id1).toEqual('locked');
      expect(relationships[0].id2).toEqual('pending');
      expect(relationships[0].relationTitle).toEqual('recoverable error (ex: timeout)');
    });

    it('should allow multiple colons inside transition text', () => {
      const diagramText = `stateDiagram-v2
        A --> B : info: key: value`;
      stateDiagram.parser.parse(diagramText);

      const relationships = stateDiagram.parser.yy.getRelations();
      expect(relationships).toHaveLength(1);
      expect(relationships[0].relationTitle).toEqual('info: key: value');
    });

    it('should allow a colon inside state description text', () => {
      const diagramText = `stateDiagram-v2
        myState : status: active`;
      stateDiagram.parser.parse(diagramText);

      const states = stateDiagram.parser.yy.getStates();
      expect(states.get('myState')).not.toBeUndefined();
      expect(states.get('myState').descriptions.join(' ')).toEqual('status: active');
    });
  });

  describe('unsafe properties as state names', () => {
    it.each(['__proto__', 'constructor'])('should allow %s as a state name', function (prop) {
      stateDiagram.parser.parse(`
stateDiagram-v2
[*] --> ${prop}
${prop} --> [*]`);
      const states = stateDiagram.parser.yy.getStates();
      expect(states.get(prop)).not.toBeUndefined();
    });
  });

  describe('note parsing (issue #7089)', () => {
    it('should not terminate a note when "send note" appears within the note text', () => {
      const diagramText = `stateDiagram-v2
      State1
      note right of State1
        this sentence contains send note inside the note text
      end note
      State1 --> State2`;
      stateDiagram.parser.parse(diagramText);

      const relations = stateDiagram.parser.yy.getRelations();
      expect(relations).toHaveLength(1);
      expect(relations[0].id1).toEqual('State1');
      expect(relations[0].id2).toEqual('State2');

      const states = stateDiagram.parser.yy.getStates();
      const noteState = states.get('State1');
      expect(noteState?.note?.text).toContain('send note inside the note text');
    });

    it('should not treat "end note" as a closing keyword when it is part of the note text', () => {
      const diagramText = `stateDiagram-v2
      State1
      note right of State1
        this sentence contains end note as part of the note text
      end note
      State1 --> State2`;
      stateDiagram.parser.parse(diagramText);

      const relations = stateDiagram.parser.yy.getRelations();
      expect(relations).toHaveLength(1);
      expect(relations[0].id1).toEqual('State1');
      expect(relations[0].id2).toEqual('State2');

      const states = stateDiagram.parser.yy.getStates();
      const noteState = states.get('State1');
      expect(noteState?.note?.text).toContain('end note as part of the note text');
    });
  });

  describe('quoted state names with spaces', () => {
    it('accepts a quoted string as a transition target', () => {
      const diagramText = `stateDiagram-v2
      Foo --> "Bar Baz"`;
      stateDiagram.parser.parse(diagramText);

      const states = stateDiagram.parser.yy.getStates();
      const quoted = states.get('Bar_Baz');
      expect(quoted).not.toBeUndefined();
      expect(quoted?.descriptions).toContain('Bar Baz');

      const relations = stateDiagram.parser.yy.getRelations();
      expect(relations).toHaveLength(1);
      expect(relations[0].id1).toEqual('Foo');
      expect(relations[0].id2).toEqual('Bar_Baz');
    });

    it('maps repeated occurrences of the same quoted name to a single state', () => {
      const diagramText = `stateDiagram-v2
      [*] --> Foo
      Foo --> "Bar Baz"
      "Bar Baz" --> [*]`;
      stateDiagram.parser.parse(diagramText);

      const states = stateDiagram.parser.yy.getStates();
      const matching = [...states.keys()].filter((key) => key.includes('Bar'));
      expect(matching).toEqual(['Bar_Baz']);
      expect(states.get('Bar_Baz')?.descriptions).toEqual(['Bar Baz']);

      const relations = stateDiagram.parser.yy.getRelations();
      expect(relations).toHaveLength(3);
    });

    it('keeps repeated explicit descriptions untouched (regression: dedupe is implicit-only)', () => {
      const diagramText = `stateDiagram-v2
      S : first line
      S : first line
      S --> T`;
      stateDiagram.parser.parse(diagramText);

      const node = stateDiagram.parser.yy.getData().nodes.find((n) => n.id === 'S');
      expect(node?.label).toEqual('first line');
      expect(node?.description).toEqual(['first line']);
    });

    it('rejects an empty quoted state name', () => {
      const diagramText = `stateDiagram-v2
      Foo --> ""`;
      expect(() => stateDiagram.parser.parse(diagramText)).toThrow(/must not be empty/);
    });

    it('treats a quoted name with an explicit description as explicit (both occurrences kept)', () => {
      const diagramText = `stateDiagram-v2
      "Bar Baz" : first line
      "Bar Baz" : first line`;
      stateDiagram.parser.parse(diagramText);

      const node = stateDiagram.parser.yy.getData().nodes.find((n) => n.id === 'Bar_Baz');
      expect(node?.label).toEqual('first line');
      expect(node?.description).toEqual(['first line']);
    });

    it('renders a single label when the same quoted name appears in several transitions', () => {
      const diagramText = `stateDiagram-v2
      Foo --> "Bar Baz"
      "Bar Baz" --> [*]`;
      stateDiagram.parser.parse(diagramText);

      const node = stateDiagram.parser.yy.getData().nodes.find((n) => n.id === 'Bar_Baz');
      expect(node?.label).toEqual('Bar Baz');
      expect(node?.description ?? []).toEqual([]);
    });
  });
});
