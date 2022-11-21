import { parser } from './parser/stateDiagram';
import stateDb from './stateDb';
import stateDiagram from './parser/stateDiagram.jison';

describe('state diagram V2, ', function () {
  // TODO - these examples should be put into ./parser/stateDiagram.spec.js
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = stateDb;
      stateDiagram.parser.yy = stateDb;
      stateDiagram.parser.yy.clear();
    });

    it('super simple', function () {
      const str = `
      stateDiagram-v2
      [*] --> State1
      State1 --> [*]
      `;

      parser.parse(str);
    });
    it('simple', function () {
      const str = `stateDiagram-v2\n
      State1 : this is another string
      [*] --> State1
      State1 --> [*]
      `;

      parser.parse(str);
      const description = stateDb.getAccDescription();
      expect(description).toBe('');
    });
    it('simple with accDescription', function () {
      const str = `stateDiagram-v2\n
      accDescr: a simple description of the diagram
      State1 : this is another string
      [*] --> State1
      State1 --> [*]
      `;

      parser.parse(str);
      const description = stateDb.getAccDescription();
      expect(description).toBe('a simple description of the diagram');
    });
    it('simple with title', function () {
      const str = `stateDiagram-v2\n
      accTitle: a simple title of the diagram
      State1 : this is another string
      [*] --> State1
      State1 --> [*]
      `;

      parser.parse(str);
      const title = stateDb.getAccTitle();
      expect(title).toBe('a simple title of the diagram');
    });
    it('simple with directive', function () {
      const str = `%%{init: {'logLevel': 0 }}%%
      stateDiagram-v2\n
      State1 : this is another string
      [*] --> State1
      State1 --> [*]
      `;

      parser.parse(str);
    });
    it('should handle relation definitions', function () {
      const str = `stateDiagram-v2\n
      [*] --> State1
      State1 --> [*]
      State1 : this is a string
      State1 : this is another string

      State1 --> State2
      State2 --> [*]
      `;

      parser.parse(str);
    });
    it('hide empty description', function () {
      const str = `stateDiagram-v2\n
      hide empty description
      [*] --> State1
      State1 --> [*]
      State1 : this is a string
      State1 : this is another string

      State1 --> State2
      State2 --> [*]
      `;

      parser.parse(str);
    });

    it('handle "as" in state names', function () {
      const str = `stateDiagram-v2
      assemble
      state assemble
      `;

      parser.parse(str);
    });
    it('handle "as" in state names 1', function () {
      const str = `stateDiagram-v2
      assemble
      state assemble
      `;

      parser.parse(str);
    });
    it('handle "as" in state names 2', function () {
      const str = `stateDiagram-v2
      assemblies
      state assemblies
      `;

      parser.parse(str);
    });
    it('handle "as" in state names 3', function () {
      const str = `stateDiagram-v2
      state "as" as as
      `;

      parser.parse(str);
    });

    describe('relationship labels', () => {
      it('simple states with : labels', () => {
        const diagram = `
          stateDiagram-v2
          [*] --> State1
          State1 --> State2 : Transition 1
          State1 --> State3 : Transition 2
          State1 --> State4 : Transition 3
          State1 --> [*]
        `;

        stateDiagram.parser.parse(diagram);
        stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

        const rels = stateDb.getRelations();
        const rel_1_2 = rels.find((rel) => rel.id1 === 'State1' && rel.id2 === 'State2');
        expect(rel_1_2.relationTitle).toEqual('Transition 1');
        const rel_1_3 = rels.find((rel) => rel.id1 === 'State1' && rel.id2 === 'State3');
        expect(rel_1_3.relationTitle).toEqual('Transition 2');
        const rel_1_4 = rels.find((rel) => rel.id1 === 'State1' && rel.id2 === 'State4');
        expect(rel_1_4.relationTitle).toEqual('Transition 3');
      });
    });

    it('scale', function () {
      const str = `stateDiagram-v2\n
      scale 350 width
      [*] --> State1
      State1 --> [*]
      State1 : this is a string with - in it
      State1 : this is another string

      State1 --> State2
      State2 --> [*]
      `;

      parser.parse(str);
    });

    it('description after second state', function () {
      const str = `stateDiagram-v2\n
      scale 350 width
      [*] --> State1 : This is the description with - in it
      State1 --> [*]
      `;

      parser.parse(str);
    });
    it('shall handle descriptions including minus signs', function () {
      const str = `stateDiagram-v2\n
      scale 350 width
      [*] --> State1 : This is the description +-!
      State1 --> [*]
      `;

      parser.parse(str);
    });
    it('should handle state statements', function () {
      const str = `stateDiagram-v2\n
      state Configuring {
        [*] --> NewValueSelection
        NewValueSelection --> NewValuePreview : EvNewValue
        NewValuePreview --> NewValueSelection : EvNewValueRejected
        NewValuePreview --> NewValueSelection : EvNewValueSaved1
      }
      `;

      parser.parse(str);
    });
    it('should handle recursive state definitions', function () {
      const str = `stateDiagram-v2\n
      state Configuring {
        [*] --> NewValueSelection
        NewValueSelection --> NewValuePreview : EvNewValue
        NewValuePreview --> NewValueSelection : EvNewValueRejected
        NewValuePreview --> NewValueSelection : EvNewValueSaved

        state NewValuePreview {
          State1 --> State2
        }
      }
      `;

      parser.parse(str);
    });
    it('should handle multiple recursive state definitions', function () {
      const str = `stateDiagram-v2\n
      scale 350 width
      [*] --> NotShooting

      state NotShooting {
        [*] --> Idle
        Idle --> Configuring : EvConfig
        Configuring --> Idle : EvConfig
      }

      state Configuring {
        [*] --> NewValueSelection
        NewValueSelection --> NewValuePreview : EvNewValue
        NewValuePreview --> NewValueSelection : EvNewValueRejected
        NewValuePreview --> NewValueSelection : EvNewValueSaved

        state NewValuePreview {
          State1 --> State2
        }
      }
      `;

      parser.parse(str);
    });
    it('should handle state definitions with separation of id', function () {
      const str = `stateDiagram-v2\n
      state "Long state description" as state1
      `;

      parser.parse(str);
    });
    it('should handle state definitions with separation of id', function () {
      const str = `stateDiagram-v2
      state "Not Shooting State" as NotShooting {
        state "Idle mode" as Idle
        state "Configuring mode" as Configuring
        [*] --> Idle
        Idle --> Configuring : EvConfig
        Configuring --> Idle : EvConfig
      }
      `;

      parser.parse(str);
    });

    it('should State definition with quotes', function () {
      const str = `stateDiagram-v2\n
      scale 600 width

      [*] --> State1
      State1 --> State2 : Succeeded
      State1 --> [*] : Aborted
      State2 --> State3 : Succeeded
      State2 --> [*] : Aborted
      state State3 {
        state "Accumulate Enough Data\nLong State Name" as long1
        long1 : Just a test
        [*] --> long1
        long1 --> long1 : New Data
        long1 --> ProcessData : Enough Data
      }
      State3 --> State3 : Failed
      State3 --> [*] : Succeeded / Save Result
      State3 --> [*] : Aborted
      `;

      parser.parse(str);
    });
    it('should handle fork statements', function () {
      const str = `stateDiagram-v2\n
      state fork_state <<fork>>
      [*] --> fork_state
      fork_state --> State2
      fork_state --> State3

      state join_state <<join>>
      State2 --> join_state
      State3 --> join_state
      join_state --> State4
      State4 --> [*]
      `;

      parser.parse(str);
    });
    it('should handle concurrent state', function () {
      const str = `stateDiagram-v2\n
      [*] --> Active

      state Active {
        [*] --> NumLockOff
        NumLockOff --> NumLockOn : EvNumLockPressed
        NumLockOn --> NumLockOff : EvNumLockPressed
        --
        [*] --> CapsLockOff
        CapsLockOff --> CapsLockOn : EvCapsLockPressed
        CapsLockOn --> CapsLockOff : EvCapsLockPressed
        --
        [*] --> ScrollLockOff
        ScrollLockOff --> ScrollLockOn : EvCapsLockPressed
        ScrollLockOn --> ScrollLockOff : EvCapsLockPressed
      }
      `;

      parser.parse(str);
    });
    it('should handle concurrent state', function () {
      const str = `stateDiagram-v2\n
      [*] --> Active

      state Active {
        [*] --> NumLockOff
        --
        [*] --> CapsLockOff
        --
        [*] --> ScrollLockOff
      }
      `;

      parser.parse(str);
    });
    // it('should handle arrow directions definitions', function() {
    //   const str = `stateDiagram-v2\n
    //     [*] -up-> First
    //     First -right-> Second
    //     Second --> Third
    //     Third -left-> Last
    //   `;

    //   parser.parse(str);
    // });
    it('should handle note statements', function () {
      const str = `stateDiagram-v2\n
      [*] --> Active
      Active --> Inactive

      note left of Active : this is a short<br/>note

      note right of Inactive
      A note can also
      be defined on
      several lines
      end note
      `;

      parser.parse(str);
    });
    it('should handle multiline notes with different line breaks', function () {
      const str = `stateDiagram-v2
      State1
      note right of State1
      Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
      end note
      `;

      parser.parse(str);
    });
    it('should handle floating notes', function () {
      const str = `stateDiagram-v2
      foo: bar
      note "This is a floating note" as N1
      `;

      parser.parse(str);
    });
    it('should handle floating notes', function () {
      const str = `stateDiagram-v2\n
      state foo
      note "This is a floating note" as N1
      `;

      parser.parse(str);
    });
    it('should handle notes for composite (nested) states', function () {
      const str = `stateDiagram-v2\n
      [*] --> NotShooting

      state "Not Shooting State" as NotShooting {
        state "Idle mode" as Idle
        state "Configuring mode" as Configuring
        [*] --> Idle
        Idle --> Configuring : EvConfig
        Configuring --> Idle : EvConfig
      }

      note right of NotShooting : This is a note on a composite state
      `;

      parser.parse(str);
    });

    it('A composite state should be able to link to itself', () => {
      const diagram = `
          stateDiagram-v2
            state Active {
              Idle
            }
            Inactive --> Idle: ACT
            Active --> Active: LOG
        `;

      stateDiagram.parser.parse(diagram);
      stateDiagram.parser.yy.extract(stateDiagram.parser.yy.getRootDocV2());

      const states = stateDb.getStates();
      expect(states['Active'].doc[0].id).toEqual('Idle');

      const rels = stateDb.getRelations();
      const rel_Inactive_Idle = rels.find((rel) => rel.id1 === 'Inactive' && rel.id2 === 'Idle');
      expect(rel_Inactive_Idle.relationTitle).toEqual('ACT');
      const rel_Active_Active = rels.find((rel) => rel.id1 === 'Active' && rel.id2 === 'Active');
      expect(rel_Active_Active.relationTitle).toEqual('LOG');
    });
  });
});
