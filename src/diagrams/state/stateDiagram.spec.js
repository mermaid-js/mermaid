/* eslint-env jasmine */
import { parser } from './parser/stateDiagram';
import stateDb from './stateDb';

describe('state diagram, ', function() {
  describe('when parsing an info graph it', function() {
    beforeEach(function() {
      parser.yy = stateDb;
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
    it('scale', function() {
      const str = `stateDiagram\n
        scale 350 width
        [*] --> State1
        State1 --> [*]
        State1 : this is a string
        State1 : this is another string

        State1 --> State2
        State2 --> [*]
      `;

      parser.parse(str);
    });

    xit('should handle relation definitions', function() {
      const str = `stateDiagram\n
        state Configuring {
          [*] --> NewValueSelection
          NewValueSelection --> NewValuePreview : EvNewValue
          NewValuePreview --> NewValueSelection : EvNewValueRejected
          NewValuePreview --> NewValueSelection : EvNewValueSaved

          state NewValuePreview {
          State1 -> State2
          }
        }
      `;

      parser.parse(str);
    });
    xit('should handle relation definitions', function() {
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
          State1 -> State2
          }
        }
      `;

      parser.parse(str);
    });
    // it('should handle relation definitions', function() {
    //   const str = `stateDiagram\n
    //     scale 600 width

    //     [*] --> State1
    //     State1 --> State2 : Succeeded
    //     State1 --> [*] : Aborted
    //     State2 --> State3 : Succeeded
    //     State2 --> [*] : Aborted
    //     state State3 {
    //       state "Accumulate Enough Data\nLong State Name" as long1
    //       long1 : Just a test
    //       [*] --> long1
    //       long1 --> long1 : New Data
    //       long1 --> ProcessData : Enough Data
    //     }
    //     State3 --> State3 : Failed
    //     State3 --> [*] : Succeeded / Save Result
    //     State3 --> [*] : Aborted
    //   `;

    //   parser.parse(str);
    // });
    // it('should handle relation definitions', function() {
    //   const str = `stateDiagram\n
    //     state fork_state <<fork>>
    //     [*] --> fork_state
    //     fork_state --> State2
    //     fork_state --> State3

    //     state join_state <<join>>
    //     State2 --> join_state
    //     State3 --> join_state
    //     join_state --> State4
    //     State4 --> [*]
    //   `;

    //   parser.parse(str);
    // });
    // it('should handle relation definitions', function() {
    //   const str = `stateDiagram\n
    //     [*] --> Active

    //     state Active {
    //       [*] -> NumLockOff
    //       NumLockOff --> NumLockOn : EvNumLockPressed
    //       NumLockOn --> NumLockOff : EvNumLockPressed
    //       --
    //       [*] -> CapsLockOff
    //       CapsLockOff --> CapsLockOn : EvCapsLockPressed
    //       CapsLockOn --> CapsLockOff : EvCapsLockPressed
    //       --
    //       [*] -> ScrollLockOff
    //       ScrollLockOff --> ScrollLockOn : EvCapsLockPressed
    //       ScrollLockOn --> ScrollLockOff : EvCapsLockPressed
    //   `;

    //   parser.parse(str);
    // });
    // it('should handle relation definitions', function() {
    //   const str = `stateDiagram\n
    //     [*] -up-> First
    //     First -right-> Second
    //     Second --> Third
    //     Third -left-> Last
    //   `;

    //   parser.parse(str);
    // });
    // it('should handle relation definitions', function() {
    //   const str = `stateDiagram\n
    //     [*] --> Active
    //     Active --> Inactive

    //     note left of Active : this is a short\nnote

    //     note right of Inactive
    //       A note can also
    //       be defined on
    //       several lines
    //     end note
    //   `;

    //   parser.parse(str);
    // });
    // it('should handle relation definitions', function() {
    //   const str = `stateDiagram\n
    //     state foo
    //     note "This is a floating note" as N1
    //   `;

    //   parser.parse(str);
    // });
    // it('should handle relation definitions', function() {
    //   const str = `stateDiagram\n
    //     [*] --> NotShooting

    //     state "Not Shooting State" as NotShooting {
    //       state "Idle mode" as Idle
    //       state "Configuring mode" as Configuring
    //       [*] --> Idle
    //       Idle --> Configuring : EvConfig
    //       Configuring --> Idle : EvConfig
    //     }

    //     note right of NotShooting : This is a note on a composite state
    //   `;

    //   parser.parse(str);
    // });
  });
});
