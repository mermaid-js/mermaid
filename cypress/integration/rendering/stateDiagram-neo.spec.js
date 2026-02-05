import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('State diagram neo look', () => {
  it('should render a simple info', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    info
      `,
      { logLevel: 1, fontFamily: 'courier' }
    );
  });
  it('should render a simple state diagrams', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram

    [*] --> State1
    State1 --> [*]
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a long descriptions instead of id when available', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram

      [*] --> S1
      state "Some long name" as S1
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a long descriptions with additional descriptions', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram

      [*] --> S1
      state "Some long name" as S1: The description
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a single state with short descriptions', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
      state "A long long name" as long1
      state "A" as longlonglongid
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a transition descriptions with new lines', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram

      [*] --> S1
      S1 --> S2: long line using<br/>should work
      S1 --> S3: long line using <br>should work
      S1 --> S4: long line using \\nshould work
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a state with a note', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
    State1: The state with a note
    note right of State1
      Important information! You can write
      notes.
    end note
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a state with on the left side when so specified', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
    State1: The state with a note with minus - and plus + in it
    note left of State1
      Important information! You can write
      notes with . and  in them.
    end note
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a state with a note together with another state', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
    State1: The state with a note +,-
    note right of State1
      Important information! You can write +,-
      notes.
    end note
    State1 --> State2 : With +,-
    note left of State2 : This is the note +,-<br/>
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a note with multiple lines in it', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
    State1: The state with a note
    note right of State1
      Important information! You\ncan write
      notes with multiple lines...
      Here is another line...
      And another line...
    end note
    `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should handle multiline notes with different line breaks', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
      State1
      note right of State1
      Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
      end note
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });

  it('should render a states with descriptions including multi-line descriptions', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
    State1: This a single line description
    State2: This a multi line description
    State2: here comes the multi part
    [*] --> State1
    State1 --> State2
    State2 --> [*]
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a simple state diagrams 2', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
    [*] --> State1
    State1 --> State2
    State1 --> State3
    State1 --> [*]
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a simple state diagrams with labels', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
    [*] --> State1
    State1 --> State2 : Transition 1
    State1 --> State3 : Transition 2
    State1 --> State4 : Transition 3
    State1 --> State5 : Transition 4
    State2 --> State3 : Transition 5
    State1 --> [*]
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render state descriptions', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
        state "Long state description" as XState1
        state "Another Long state description" as XState2
        XState2 : New line
        XState1 --> XState2
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render composite states', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
      [*] --> NotShooting: Pacifist
      NotShooting --> A
      NotShooting --> B
      NotShooting --> C

      state NotShooting {
        [*] --> Idle: Yet another long long öong öong öong label
        Idle --> Configuring : EvConfig
        Configuring --> Idle : EvConfig  EvConfig EvConfig  EvConfig EvConfig
      }
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render multiple composite states', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
      [*]-->TV

      state TV {
        [*] --> Off: Off to start with
        On --> Off : Turn off
        Off --> On : Turn on
      }

      TV--> Console

      state Console {
        [*] --> Off2: Off to start with
        On2--> Off2 : Turn off
        Off2 --> On2 : Turn on
        On2-->Playing

        state Playing {
          Alive --> Dead
          Dead-->Alive
         }
      }
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render forks in composite states', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
      [*]-->TV

      state TV {
        state fork_state &lt;&lt;fork&gt;&gt;
        [*] --> fork_state
        fork_state --> State2
        fork_state --> State3

        state join_state &lt;&lt;join&gt;&gt;
        State2 --> join_state
        State3 --> join_state
        join_state --> State4
        State4 --> [*]
      }
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render forks and joins', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
    state fork_state &lt;&lt;fork&gt;&gt;
      [*] --> fork_state
      fork_state --> State2
      fork_state --> State3

      state join_state &lt;&lt;join&gt;&gt;
      State2 --> join_state
      State3 --> join_state
      join_state --> State4
      State4 --> [*]
    `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render concurrency states', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram
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
    `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a state with states in it', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
      state PilotCockpit {
        state  Parent {
          C
        }
    }
    `,
      {
        logLevel: 0,
      }
    );
  });
  it(' itshould be possible to use a choice', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
  stateDiagram
    [*] --> Off
    Off --> On
    state MyChoice [[choice]]
    On --> MyChoice
    MyChoice --> Washing
    MyChoice --> Drying
    Washing --> Finished
    Finished --> [*]
    `,
      {
        logLevel: 0,
      }
    );
  });
  it(' A compound stateshould be able to link to itself', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
stateDiagram
  state Active {
    Idle
  }
  Inactive --> Idle: ACT
  Active --> Active: LOG
    `,
      {
        logLevel: 0,
      }
    );
  });
  it(' width of compound stateshould grow with title if title is wider', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
stateDiagram
  state "Long state name 2" as NotShooting {
    a-->b
  }
    `,
      {
        logLevel: 0,
      }
    );
  });
  it(' state label with names in it', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
        Yswsii: Your state with spaces in it
        [*] --> Yswsii
    `,
      {
        logLevel: 0,
      }
    );
  });
  it(' Simplest composite state', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
        state  Parent {
          C
        }
    `,
      {
        logLevel: 0,
        fontFamily: 'courier',
      }
    );
  });
  it('should handle multiple arrows from one node to another', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
        a --> b: Start
        a --> b: Stop
    `,
      {
        logLevel: 0,
        fontFamily: 'courier',
      }
    );
  });
  it('should handle multiple notes added to one state', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
stateDiagram
    MyState
    note left of MyState : I am a lefty
    note right of MyState : I am a righty
    `,
      {
        logLevel: 0,
        fontFamily: 'courier',
      }
    );
  });
  it('should handle different rendering directions in composite states', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
stateDiagram
  direction LR
  state A {
    direction BT
    a --> b
  }
  state C {
    direction RL
    c --> d
  }
  A --> C
    `,
      {
        logLevel: 0,
        fontFamily: 'courier',
      }
    );
  });
  it(' handle transition from one state in a composite state to a composite state', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
stateDiagram
  state S1 {
    sub1 -->sub2
  }

  state S2 {
    sub4
  }
  S1 --> S2
  sub1 --> sub4
    `,
      {
        logLevel: 0,
        fontFamily: 'courier',
      }
    );
  });
  it('should render a state diagram when useMaxWidth is true (default)', () => {
    renderGraph(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram

    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: true }, look: 'neo', theme: 'neo' }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      // expect(svg).to.have.attr('height');
      // const height = parseFloat(svg.attr('height'));
      // expect(height).to.be.within(177, 178);
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      // use within because the absolute value can be slightly different depending on the environment ±5%
      expect(maxWidthValue).to.be.within(65, 85);
    });
  });
  it('should render a state diagram when useMaxWidth is false', () => {
    renderGraph(
      `---
config:
  look: neo
  theme: neo
---
    stateDiagram

    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: false }, look: 'neo', theme: 'neo' }
    );
    cy.get('svg').should((svg) => {
      // const height = parseFloat(svg.attr('height'));
      const width = parseFloat(svg.attr('width'));
      // expect(height).to.be.within(177, 178);
      // use within because the absolute value can be slightly different depending on the environment ±5%
      expect(width).to.be.within(65, 85);
      expect(svg).to.not.have.attr('style');
    });
  });

  it('should render a state diagram and set the correct length of the labels', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
      stateDiagram
      [*] --> 1
      1 --> 2: test({ foo#colon; 'far' })
      2 --> [*]
    `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });

  describe('classDefs and applying classes', () => {
    it(' states can have a class applied', () => {
      imgSnapshotTest(
        `---
config:
  look: neo
  theme: neo
---
          stateDiagram
          [*] --> A
          A --> B: test({ foo#colon; 'far' })
          B --> [*]
            classDef badBadEvent fill:#f00,color:white,font-weight:bold
            class B badBadEvent
           `,
        { logLevel: 0, fontFamily: 'courier' }
      );
    });
    it(' can have multiple classes applied to multiple states', () => {
      imgSnapshotTest(
        `---
config:
  look: neo
  theme: neo
---
          stateDiagram
          classDef notMoving fill:white
          classDef movement font-style:italic;
          classDef badBadEvent fill:#f00,color:white,font-weight:bold

          [*] --> Still
          Still --> [*]
          Still --> Moving
          Moving --> Still
          Moving --> Crash
          Crash --> [*]

          class Still notMoving
          class Moving, Crash movement
          class Crash badBadEvent
        `,
        { logLevel: 0, fontFamily: 'courier' }
      );
    });
    it(' can have styles applied ', () => {
      imgSnapshotTest(
        `---
config:
  look: neo
  theme: neo
---
stateDiagram
AState
style AState fill:#636,border:1px solid red,color:white;
        `,
        { logLevel: 0, fontFamily: 'courier' }
      );
    });
    it('should let styles take precedence over classes', () => {
      imgSnapshotTest(
        `---
config:
  look: neo
  theme: neo
---
stateDiagram
AState:should NOT be white
BState
classDef exampleStyleClass fill:#fff,color: blue;
class AState,BState exampleStyleClass
style AState fill:#636,border:1px solid red,color:white;
        `,
        { logLevel: 0, fontFamily: 'courier' }
      );
    });
    it('should allow styles to take effect in subgraphs', () => {
      imgSnapshotTest(
        `---
config:
  look: neo
  theme: neo
---
  stateDiagram
    state roundWithTitle {
      C: Black with white text
    }
    D: Black with white text

    style C,D stroke:#00f, fill:black, color:white
        `,
        { logLevel: 0, fontFamily: 'courier' }
      );
    });
  });
  it('1433:should render a simple state diagram with a title', () => {
    imgSnapshotTest(
      `---
title: simple state diagram
config:
  look: neo
  theme: neo
---
stateDiagram
[*] --> State1
State1 --> [*]
`,
      {}
    );
  });
  it('should align dividers correctly', () => {
    imgSnapshotTest(
      `---
config:
  look: neo
  theme: neo
---
stateDiagram
  state s2 {
      s3
      --
      s4
      --
      55
  }
`,
      {}
    );
  });
  it('should render edge labels correctly', () => {
    imgSnapshotTest(
      `---
title: On The Way To Something Something DarkSide
config:
  look: neo
  theme: neo
---

stateDiagram

   state State1_____________
   {
      c0
   }

   state State2_____________
   {
      c1
   }

   state State3_____________
   {
      c7
   }

   state State4_____________
   {
      c2
   }

   state State5_____________
   {
      c3
   }

   state State6_____________
   {
      c4
   }

   state State7_____________
   {
      c5
   }

   state State8_____________
   {
      c6
   }


[*] --> State1_____________
State1_____________ --> State2_____________   : Transition1_____
State2_____________ --> State4_____________   : Transition2_____
State2_____________ --> State3_____________   : Transition3_____
State3_____________ --> State2_____________
State4_____________ --> State2_____________   : Transition5_____
State4_____________ --> State5_____________   : Transition6_____
State5_____________ --> State6_____________   : Transition7_____
State6_____________ --> State4_____________   : Transition8_____
State2_____________ --> State7_____________   : Transition4_____
State4_____________ --> State7_____________   : Transition4_____
State5_____________ --> State7_____________   : Transition4_____
State6_____________ --> State7_____________   : Transition4_____
State7_____________ --> State1_____________   : Transition9_____
State5_____________ --> State8_____________   : Transition10____
State8_____________ --> State5_____________   : Transition11____
`,
      {}
    );
  });
  it('should render edge labels correctly with multiple transitions', () => {
    imgSnapshotTest(
      `---
title: Multiple Transitions
config:
  look: neo
  theme: neo
---

stateDiagram

   state State1_____________
   {
      c0
   }

   state State2_____________
   {
      c1
   }

   state State3_____________
   {
      c7
   }

   state State4_____________
   {
      c2
   }

   state State5_____________
   {
      c3
   }

   state State6_____________
   {
      c4
   }

   state State7_____________
   {
      c5
   }

   state State8_____________
   {
      c6
   }

   state State9_____________
   {
      c9
   }

[*] --> State1_____________
State1_____________ --> State2_____________   : Transition1_____
State2_____________ --> State4_____________   : Transition2_____
State2_____________ --> State3_____________   : Transition3_____
State3_____________ --> State2_____________
State4_____________ --> State2_____________   : Transition5_____
State4_____________ --> State5_____________   : Transition6_____
State5_____________ --> State6_____________   : Transition7_____
State6_____________ --> State4_____________   : Transition8_____
State2_____________ --> State7_____________   : Transition4_____
State4_____________ --> State7_____________   : Transition4_____
State5_____________ --> State7_____________   : Transition4_____
State6_____________ --> State7_____________   : Transition4_____
State7_____________ --> State1_____________   : Transition9_____
State5_____________ --> State8_____________   : Transition10____
State8_____________ --> State5_____________   : Transition11____
State9_____________ --> State8_____________   : Transition12____
`,
      {}
    );
  });

  it('should render edge labels correctly with multiple states', () => {
    imgSnapshotTest(
      `---
title: Multiple States
config:
  look: neo
  theme: neo
---

stateDiagram

   state State1_____________
   {
      c0
   }

   state State2_____________
   {
      c1
   }

   state State3_____________
   {
      c7
   }

   state State4_____________
   {
      c2
   }

   state State5_____________
   {
      c3
   }

   state State6_____________
   {
      c4
   }

   state State7_____________
   {
      c5
   }

   state State8_____________
   {
      c6
   }

   state State9_____________
   {
      c9
   }

   state State10_____________
   {
      c10
   }

[*] --> State1_____________
State1_____________ --> State2_____________   : Transition1_____
State2_____________ --> State3_____________   : Transition2_____
State3_____________ --> State4_____________   : Transition3_____
State4_____________ --> State5_____________   : Transition4_____
State5_____________ --> State6_____________   : Transition5_____
State6_____________ --> State7_____________   : Transition6_____
State7_____________ --> State8_____________   : Transition7_____
State8_____________ --> State9_____________   : Transition8_____
State9_____________ --> State10_____________   : Transition9_____
`,
      {}
    );
  });
});
