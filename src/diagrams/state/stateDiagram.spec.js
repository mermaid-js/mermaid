/* eslint-env jasmine */
import { parser } from './parser/stateDiagram';
import stateDb from './stateDb';

describe('state diagram, ', function() {
  describe('when parsing an info graph it', function() {
    beforeEach(function() {
      parser.yy = stateDb;
    });

    it('super simple', function() {
      const str = `
      stateDiagram
        [*] --> State1
        State1 --> [*]
      `;

      parser.parse(str);
    });
    it('simple', function() {
      const str = `stateDiagram\n
          State1 : this is another string
          [*] --> State1
          State1 --> [*]
      `;

      parser.parse(str);
    });
    it('should handle relation definitions', function() {
      const str = `stateDiagram\n
        [*] --> State1
        State1 --> [*]
        State1 : this is a string
        State1 : this is another string

        State1 --> State2
        State2 --> [*]
      `;

      parser.parse(str);
    });
    it('hide empty description', function() {
      const str = `stateDiagram\n
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

    it('handle "as" in state names', function() {
      const str = `stateDiagram
      assemble
      state assemble
      `;

      parser.parse(str);
    });
    it('handle "as" in state names 1', function() {
      const str = `stateDiagram
      assemble
      state assemble
      `;

      parser.parse(str);
    });
    it('handle "as" in state names 2', function() {
      const str = `stateDiagram
      assembleas
      state assembleas
      `;

      parser.parse(str);
    });
    it('handle "as" in state names 3', function() {
      const str = `stateDiagram
      state "as" as as
      `;

      parser.parse(str);
    });

    it('scale', function() {
      const str = `stateDiagram\n
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

    it('description after second state', function() {
      const str = `stateDiagram\n
        scale 350 width
        [*] --> State1 : This is the description with - in it
        State1 --> [*]
      `;

      parser.parse(str);
    });
    it('shall handle descriptions inkluding minus signs', function() {
      const str = `stateDiagram\n
        scale 350 width
        [*] --> State1 : This is the description +-!
        State1 --> [*]
      `;

      parser.parse(str);
    });
    it('should handle state statements', function() {
      const str = `stateDiagram\n
        state Configuring {
          [*] --> NewValueSelection
          NewValueSelection --> NewValuePreview : EvNewValue
          NewValuePreview --> NewValueSelection : EvNewValueRejected
          NewValuePreview --> NewValueSelection : EvNewValueSaved1
        }
      `;

      parser.parse(str);
    });
    it('should handle recursive state definitions', function() {
      const str = `stateDiagram\n
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
    it('should handle multiple recursive state definitions', function() {
      const str = `stateDiagram\n
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
    it('should handle state deifintions with separation of id', function() {
      const str = `stateDiagram\n
        state "Long state description" as state1
        `;

      parser.parse(str);
    });
    it('should handle state deifintions with separation of id', function() {
      const str = `stateDiagram
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

    it('should State definition with quotes', function() {
      const str = `stateDiagram\n
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
    it('should handle fork statements', function() {
      const str = `stateDiagram\n
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
    it('should handle concurrent state', function() {
      const str = `stateDiagram\n
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
    it('should handle concurrent state', function() {
      const str = `stateDiagram\n
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
    //   const str = `stateDiagram\n
    //     [*] -up-> First
    //     First -right-> Second
    //     Second --> Third
    //     Third -left-> Last
    //   `;

    //   parser.parse(str);
    // });
    it('should handle note statements', function() {
      const str = `stateDiagram\n
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
    it('should handle multiline notes with different line breaks', function() {
      const str = `stateDiagram
        State1
        note right of State1
          Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
        end note
      `;

      parser.parse(str);
    });
    it('should handle floating notes', function() {
      const str = `stateDiagram
        foo: bar
        note "This is a floating note" as N1
      `;

      parser.parse(str);
    });
    it('should handle floating notes', function() {
      const str = `stateDiagram\n
        state foo
        note "This is a floating note" as N1
      `;

      parser.parse(str);
    });
    it('should handle notes for composit states', function() {
      const str = `stateDiagram\n
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
    xit('should handle if statements', function() {
      const str = `stateDiagram\n
      [*] --> "Order Submitted"
      if "Payment Accepted" then
        -->[yes] "Pack products"
        --> "Send parcel"
        -right-> (*)
      else
        ->[no] "Send error message"
        -->[Cancel Order] [*]
      endif
        }

        note right of NotShooting : This is a note on a composite state
      `;

      parser.parse(str);
    });
  });
});
