import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('State diagram', () => {
  test('v2 should render a simple info', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    info
      `,
      { logLevel: 1, fontFamily: 'courier' }
    );
  });
  test('v2 should render a simple state diagrams', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2

    [*] --> State1
    State1 --> [*]
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render click directive tooltips on linked states', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    stateDiagram-v2
    A: Google
    click A "https://google.com" "Visit Google"
      `,
      { securityLevel: 'loose', screenshot: false }
    );

    await expect(page.locator('svg a')).toHaveCount(1);
    const link = page
      .locator('svg a')
      .filter({ has: page.locator('g.node[title="Visit Google"]') });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('xlink:href', 'https://google.com');
  });
  test('v2 should render a long descriptions instead of id when available', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2

      [*] --> S1
      state "Some long name" as S1
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render a long descriptions with additional descriptions', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2

      [*] --> S1
      state "Some long name" as S1: The description
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render a single state with short descriptions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
      state "A long long name" as long1
      state "A" as longlonglongid
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render a transition descriptions with new lines', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2

      [*] --> S1
      S1 --> S2: long line using<br/>should work
      S1 --> S3: long line using <br>should work
      S1 --> S4: long line using \\nshould work
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render a state with a note', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
    State1: The state with a note
    note right of State1
      Important information! You can write
      notes.
    end note
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render a state with on the left side when so specified', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
    State1: The state with a note with minus - and plus + in it
    note left of State1
      Important information! You can write
      notes with . and  in them.
    end note
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render a state with a note together with another state', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
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
  test('v2 should render a note with multiple lines in it', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
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
  test('v2 should handle multiline notes with different line breaks', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
      State1
      note right of State1
      Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
      end note
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });

  test('v2 should render a states with descriptions including multi-line descriptions', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
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
  test('v2 should render a simple state diagrams 2', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
    [*] --> State1
    State1 --> State2
    State1 --> State3
    State1 --> [*]
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render a simple state diagrams with labels', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
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
  test('v2 should render state descriptions', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
        state "Long state description" as XState1
        state "Another Long state description" as XState2
        XState2 : New line
        XState1 --> XState2
      `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });
  test('v2 should render composite states', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
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
  test('v2 should render multiple composite states', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
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
  test('v2 should render forks in composite states', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
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
  test('v2 should render forks and joins', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
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
  test('v2 should render concurrency states', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    stateDiagram-v2
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
  test('v2 should render a state with states in it', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
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
  test('v2 it should be possible to use a choice', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
  stateDiagram-v2
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
  test('v2 A compound state should be able to link to itself', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
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
  test('v2 should render a compact self-loop edge', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
stateDiagram-v2
  [*] --> Node
  Node --> Node: Self Edge
    `,
      {
        logLevel: 0,
      }
    );
  });
  test('v2 width of compound state should grow with title if title is wider', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
stateDiagram-v2
  state "Long state name 2" as NotShooting {
    a-->b
  }
    `,
      {
        logLevel: 0,
      }
    );
  });
  test('v2 state label with names in it', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
        Yswsii: Your state with spaces in it
        [*] --> Yswsii
    `,
      {
        logLevel: 0,
      }
    );
  });
  test('v2 Simplest composite state', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
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
  test('v2 should handle multiple arrows from one node to another', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
        a --> b: Start
        a --> b: Stop
    `,
      {
        logLevel: 0,
        fontFamily: 'courier',
      }
    );
  });
  test('v2 should handle multiple notes added to one state', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
stateDiagram-v2
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
  test('v2 should handle different rendering directions in composite states', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
stateDiagram-v2
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
  test('v2 handle transition from one state in a composite state to a composite state', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
stateDiagram-v2
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
  test('v2 should render a state diagram when useMaxWidth is true (default)', async ({
    page,
  }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    stateDiagram-v2

    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: true } }
    );
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('width', '100%');
    const style = await svg.getAttribute('style');
    expect(style).toMatch(/^max-width: [\d.]+px;$/);
    const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
    expect(maxWidthValue).toBeGreaterThanOrEqual(65);
    expect(maxWidthValue).toBeLessThanOrEqual(85);
  });
  test('v2 should render a state diagram when useMaxWidth is false', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    stateDiagram-v2

    [*] --> State1
    State1 --> [*]
      `,
      { state: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(65);
    expect(width).toBeLessThanOrEqual(85);
    await expect(svg).not.toHaveAttribute('style');
  });

  for (const { look, nodeSelector } of [
    { look: 'classic', nodeSelector: 'g.node' },
    { look: 'handDrawn', nodeSelector: 'g.rough-node' },
  ]) {
    test(`v2 should render clickable state nodes with a tooltip title for ${look} look`, async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      stateDiagram-v2
        A: Google
        click A "https://google.com" "Visit Google"
        `,
        { look, securityLevel: 'loose', screenshot: false }
      );

      await page.locator('svg a').evaluateAll((links, nodeSelector) => {
        const clickableLink = links.find(
          (link) => link.getAttribute('xlink:href') === 'https://google.com'
        );
        if (!clickableLink) {
          throw new Error('clickable state link not found');
        }
        if (clickableLink.getAttribute('title') !== 'Visit Google') {
          throw new Error('unexpected link title');
        }
        const stateNode = clickableLink.querySelector(`${nodeSelector}[title="Visit Google"]`);
        if (!stateNode) {
          throw new Error('clickable state node not found');
        }
        if (!stateNode.textContent?.includes('Google')) {
          throw new Error('state node text mismatch');
        }
      }, nodeSelector);
    });
  }

  test('v2 should render a state diagram and set the correct length of the labels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      stateDiagram-v2
      [*] --> 1
      1 --> 2: test({ foo#colon; 'far' })
      2 --> [*]
    `,
      { logLevel: 0, fontFamily: 'courier' }
    );
  });

  test.describe('classDefs and applying classes', () => {
    test('v2 states can have a class applied', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
          stateDiagram-v2
          [*] --> A
          A --> B: test({ foo#colon; 'far' })
          B --> [*]
            classDef badBadEvent fill:#f00,color:white,font-weight:bold
            class B badBadEvent
           `,
        { logLevel: 0, fontFamily: 'courier' }
      );
    });
    test('v2 can have multiple classes applied to multiple states', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
          stateDiagram-v2
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
    test(' can have styles applied ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
stateDiagram-v2
AState
style AState fill:#636,border:1px solid red,color:white;
        `,
        { logLevel: 0, fontFamily: 'courier' }
      );
    });
    test(' should let styles take precedence over classes', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
stateDiagram-v2
AState: Should NOT be white
BState
classDef exampleStyleClass fill:#fff,color: blue;
class AState,BState exampleStyleClass
style AState fill:#636,border:1px solid red,color:white;
        `,
        { logLevel: 0, fontFamily: 'courier' }
      );
    });
    test(' should allow styles to take effect in subgraphs', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
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
  test('1433: should render a simple state diagram with a title', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: simple state diagram
---
stateDiagram-v2
[*] --> State1
State1 --> [*]
`,
      {}
    );
  });
  test('should align dividers correctly', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `stateDiagram-v2
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
  test('should render edge labels correctly', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: On The Way To Something Something DarkSide
config:
  look: default
  theme: default
---

stateDiagram-v2

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
  test('should render edge labels correctly with multiple transitions', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: Multiple Transitions
config:
  look: default
  theme: default
---

stateDiagram-v2

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

  test('should render edge labels correctly with multiple states', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `---
title: Multiple States
config:
  look: default
  theme: default
---

stateDiagram-v2

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
