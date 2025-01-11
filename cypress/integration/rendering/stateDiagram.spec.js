import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('State diagram', () => {
  it('should render a simple state diagrams', () => {
    imgSnapshotTest(
      `
    stateDiagram
    [*] --> State1
    State1 --> [*]
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a long descriptions instead of id when available', () => {
    imgSnapshotTest(
      `
      stateDiagram

      [*] --> S1
      state "Some long name" as S1
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a long descriptions with additional descriptions', () => {
    imgSnapshotTest(
      `
      stateDiagram

      [*] --> S1
      state "Some long name" as S1: The description
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a single state with short descriptions', () => {
    imgSnapshotTest(
      `
    stateDiagram
      state "A long long name" as long1
      state "A" as longlonglongid
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  it('should render a transition descriptions with new lines', () => {
    imgSnapshotTest(
      `
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
      `
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
      `
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
      `
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
      `
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
      `
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
      `
    stateDiagram
    State1: This a a single line description
    State2: This a a multi line description
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
      `
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
      `
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
      `
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
      `
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
  it('should render multiple composit states', () => {
    imgSnapshotTest(
      `
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
  it('should render forks in composit states', () => {
    imgSnapshotTest(
      `
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
      `
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
      `
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
      `
      stateDiagram
      state PilotCockpit {
        state  Parent {
          C
        }
    }
    `,
      {
        logLevel: 0,
        fontFamily: 'courier',
      }
    );
  });
  it('Simplest composite state', () => {
    imgSnapshotTest(
      `
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
      `
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
  it('should render a state diagram when useMaxWidth is true (default)', () => {
    renderGraph(
      `
    stateDiagram
    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: true } }
    );
    cy.get('svg').should((svg) => {
      expect(svg).to.have.attr('width', '100%');
      // expect(svg).to.have.attr('height');
      // const height = parseFloat(svg.attr('height'));
      // expect(height).to.be.within(176, 178);
      const style = svg.attr('style');
      expect(style).to.match(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      // use within because the absolute value can be slightly different depending on the environment ±5%
      // Todo investigate difference
      // expect(maxWidthValue).to.be.within(112 * .95, 112 * 1.05);
      expect(maxWidthValue).to.be.within(65, 85);
    });
  });
  it('should render a state diagram when useMaxWidth is false', () => {
    renderGraph(
      `
    stateDiagram
    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: false } }
    );
    cy.get('svg').should((svg) => {
      // const height = parseFloat(svg.attr('height'));
      const width = parseFloat(svg.attr('width'));
      // expect(height).to.be.within(176, 178);
      // use within because the absolute value can be slightly different depending on the environment ±5%
      // Todo investigate difference
      // expect(width).to.be.within(112 * .95, 112 * 1.05);
      expect(width).to.be.within(65, 85);

      expect(svg).to.not.have.attr('style');
    });
  });
});
