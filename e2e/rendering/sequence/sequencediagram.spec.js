import { test, expect } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

test.describe('Sequence diagram', () => {
  test('should render a sequence diagram with boxes', async ({ page }, testInfo) => {
    await renderGraph(
      page,
      testInfo,
      `
    sequenceDiagram
      box LightGrey Alice and Bob
      participant Alice
      participant Bob
      end
      participant John as John<br/>Second Line
      Alice ->> Bob: Hello Bob, how are you?
      Bob-->>John: How about you John?
      Bob--x Alice: I am good thanks!
      Bob-x John: I am good thanks!
      Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
      Bob-->Alice: Checking with John...
      alt either this
        Alice->>John: Yes
        else or this
        Alice->>John: No
        else or this will happen
        Alice->John: Maybe
      end
      par this happens in parallel
      Alice -->> Bob: Parallel message 1
      and
      Alice -->> John: Parallel message 2
      end
    `,
      { sequence: { useMaxWidth: false } }
    );
    const svg = page.locator('svg');
    const width = parseFloat((await svg.getAttribute('width')) ?? '0');
    expect(width).toBeGreaterThanOrEqual(830 * 0.95);
    expect(width).toBeLessThanOrEqual(830 * 1.05);
    await expect(svg).not.toHaveAttribute('style');
  });
  test('should render a simple sequence diagram', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
        participant Alice
        participant Bob
        participant John as John<br/>Second Line
        Alice ->> Bob: Hello Bob, how are you?
        Bob-->>John: How about you John?
        Bob--x Alice: I am good thanks!
        Bob-x John: I am good thanks!
        Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
        Bob-->Alice: Checking with John...
        alt either this
          Alice->>John: Yes
          else or this
          Alice->>John: No
          else or this will happen
          Alice->John: Maybe
        end
        par this happens in parallel
        Alice -->> Bob: Parallel message 1
        and
        Alice -->> John: Parallel message 2
        end
      `,
      { sequence: { actorFontFamily: 'courier' } }
    );
  });
  test('should render bidirectional arrows', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
      Alice<<->>John: Hello John, how are you?
      Alice<<-->>John: Hi Alice, I can hear you!
      John<<->>Alice: This also works the other way
      John<<-->>Alice: Yes
      Alice->John: Test
      John->>Alice: Still works
      `
    );
  });
  test('should handle different line breaks', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
      participant 1 as multiline<br>using #lt;br#gt;
      participant 2 as multiline<br/>using #lt;br/#gt;
      participant 3 as multiline<br />using #lt;br /#gt;
      participant 4 as multiline<br \t/>using #lt;br \t/#gt;
      1->>2: multiline<br>using #lt;br#gt;
      note right of 2: multiline<br>using #lt;br#gt;
      2->>3: multiline<br/>using #lt;br/#gt;
      note right of 3: multiline<br/>using #lt;br/#gt;
      3->>4: multiline<br />using #lt;br /#gt;
      note right of 4: multiline<br />using #lt;br /#gt;
      4->>1: multiline<br />using #lt;br /#gt;
      note right of 1: multiline<br \t/>using #lt;br \t/#gt;
    `,
      {}
    );
  });
  test('should handle empty lines', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
      Alice->>John: Hello John<br/>
      John-->>Alice: Great<br/><br/>day!
    `,
      {}
    );
  });
  test('should handle line breaks and wrap annotations', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
      participant Alice
      participant Bob
      participant John as John<br/>Second Line
      Alice ->> Bob: Hello Bob, how are you?
      Bob-->>John: How about you John?
      Note right of John: John thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
      Bob-->Alice: Checking with John...
      Note over John:wrap: John looks like he's still thinking, so Bob prods him a bit.
      Bob-x John: Hey John -<br/>we're still waiting to know<br/>how you're doing
      Note over John:nowrap: John's trying hard not to break his train of thought.
      Bob-x John:wrap: John! Are you still debating about how you're doing? How long does it take??
      Note over John: After a few more moments, John<br/>finally snaps out of it.
    `,
      {}
    );
  });
  test('should render sequence rect with theme-aware default background', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
        rect
          Alice->>John: Hello John, how are you?
          Alice->>John: John, can you hear me?
          John-->>Alice: Hi Alice, I can hear you!
          John-->>Alice: I feel great!
        end
      `
    );
  });
  test('should render sequence rect with theme-aware default background (base theme)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      %%{init: {'theme': 'base'}}%%
      sequenceDiagram
        rect
          Alice->>John: Hello John, how are you?
          Alice->>John: John, can you hear me?
          John-->>Alice: Hi Alice, I can hear you!
          John-->>Alice: I feel great!
        end
      `
    );
  });
  test('should render sequence rect with theme-aware default background (dark theme)', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      %%{init: {'theme': 'dark'}}%%
      sequenceDiagram
        rect
          Alice->>John: Hello John, how are you?
          Alice->>John: John, can you hear me?
          John-->>Alice: Hi Alice, I can hear you!
          John-->>Alice: I feel great!
        end
      `
    );
  });
  test('should render loops with a slight margin', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
        sequenceDiagram
        Alice->>Bob: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        loop Loopy
            Bob->>Alice: Pasten
        end      `,
      {
        sequence: {
          wrap: true,
        },
      }
    );
  });
  test('should render a sequence diagram with par_over', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
        sequenceDiagram
        participant Alice
        participant Bob
        participant John
        par_over Section title
          Alice ->> Bob: Message 1<br>Second line
          Bob ->> John: Message 2
        end
        par_over Two line<br>section title
          Note over Alice: Alice note
          Note over Bob: Bob note<br>Second line
          Note over John: John note
        end
        par_over Mixed section
          Alice ->> Bob: Message 1
          Note left of Bob: Alice/Bob Note
        end
      `
    );
  });
  test('should render a sequence diagram with basic actor creation and destruction', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
      Alice ->> Bob: Hello Bob, how are you ?
      Bob ->> Alice: Fine, thank you. And you?
      create participant Polo
      Alice ->> Polo: Hi Polo!
      create actor Ola1 as Ola
      Polo ->> Ola1: Hiii
      Ola1 ->> Alice: Hi too
      destroy Ola1
      Alice --x Ola1: Bye!
      Alice ->> Bob: And now?
      create participant Ola2 as Ola
      Alice ->> Ola2: Hello again
      destroy Alice
      Alice --x Ola2: Bye for me!
      destroy Bob
      Ola2 --> Bob: The end
      `
    );
  });
  test('should render a sequence diagram with actor creation and destruction coupled with backgrounds, loops and notes', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
			accTitle: test the accTitle
			accDescr: Test a description

			participant Alice
      participant Bob
			autonumber 10 10
			rect rgb(200, 220, 100)
			rect rgb(200, 255, 200)

			Alice ->> Bob: Hello Bob, how are you?
      create participant John as John<br />Second Line
			Bob-->>John: How about you John?
			end

			Bob--x Alice: I am good thanks!
			Bob-x John: I am good thanks!
			Note right of John: John thinks a long<br />long time, so long<br />that the text does<br />not fit on a row.

			Bob-->Alice: Checking with John...
			Note over John:wrap: John looks like he's still thinking, so Bob prods him a bit.
			Bob-x John: Hey John - we're still waiting to know<br />how you're doing
			Note over John:nowrap: John's trying hard not to break his train of thought.
      destroy John
			Bob-x John: John! Cmon!
			Note over John: After a few more moments, John<br />finally snaps out of it.
			end

			autonumber off
			alt either this
      create actor Lola
			Alice->>+Lola: Yes
			Lola-->>-Alice: OK
			else or this
			autonumber
			Alice->>Lola: No
			else or this will happen
			Alice->Lola: Maybe
			end
			autonumber 200
			par this happens in parallel
      destroy Bob
			Alice -->> Bob: Parallel message 1
			and
			Alice -->> Lola: Parallel message 2
			end
      `
    );
  });
  test('should render a sequence diagram with sequence numbers that are decimals and increase by a decimal value', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
      sequenceDiagram
      autonumber 10.1 .01
      Alice->Bob: Hello Bob, how are you?
      Bob-->Alice: I am good thanks!
      Alice->Bob: That is good to hear!
      Bob->Alice: See you later!
    `
    );
  });
  test.describe('font settings', () => {
    test('should render different note fonts when configured', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I should have bigger fonts
        Bob->>Alice: Short as well
      `,
        { sequence: { noteFontSize: 18, noteFontFamily: 'Arial' } }
      );
    });
    test('should render different message fonts when configured', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        Bob->>Alice: Short as well
      `,
        { sequence: { messageFontSize: 18, messageFontFamily: 'Arial' } }
      );
    });
    test('should render different actor fonts when configured', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        Bob->>Alice: Short as well
      `,
        { sequence: { actorFontSize: 18, actorFontFamily: 'times' } }
      );
    });
    test('should render notes aligned to the left when configured', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I am left aligned
        Bob->>Alice: Short as well
      `,
        { sequence: { noteAlign: 'left' } }
      );
    });
    test('should render multi-line notes aligned to the left when configured', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I am left aligned<br>but also<br>multiline
        Bob->>Alice: Short as well
      `,
        { sequence: { noteAlign: 'left' } }
      );
    });
    test('should render notes aligned to the right when configured', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I am right aligned
        Bob->>Alice: Short as well
      `,
        { sequence: { noteAlign: 'right' } }
      );
    });
    test('should render multi-line notes aligned to the right when configured', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I am right aligned<br>but also<br>multiline
        Bob->>Alice: Short as well
      `,
        { sequence: { noteAlign: 'right' } }
      );
    });
    test('should render multi-line messages aligned to the left when configured', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short<br>but also<br>multiline
        Bob->>Alice: Short as well<br>and also<br>multiline
      `,
        { sequence: { messageAlign: 'left' } }
      );
    });
    test('should render multi-line messages aligned to the right when configured', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short<br>but also<br>multiline
        Bob->>Alice: Short as well<br>and also<br>multiline
      `,
        { sequence: { messageAlign: 'right' } }
      );
    });
  });
  test.describe('auth width scaling', () => {
    test('should render long actor descriptions', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        participant A as Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        A->>Bob: Hola
        Bob-->A: Pasten !
      `,
        { logLevel: 0 }
      );
    });
    test('should wrap (inline) long actor descriptions', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        participant A as wrap:Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        A->>Bob: Hola
        Bob-->A: Pasten !
      `,
        { logLevel: 0 }
      );
    });
    test('should wrap (directive) long actor descriptions', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: {'config': {'wrap': true }}}%%
        sequenceDiagram
        participant A as Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        A->>Bob: Hola
        Bob-->A: Pasten !
      `,
        {}
      );
    });
    test('should be possible to use actor symbols instead of boxes', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          actor Alice
          actor Bob
          Alice->>Bob: Hi Bob
          Bob->>Alice: Hi Alice
      `,
        {}
      );
    });
    test('should have actor-top and actor-bottom classes on top and bottom actor box and symbol and actor-box and actor-man classes for text tags', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          actor Bob
          Alice->>Bob: Hi Bob
          Bob->>Alice: Hi Alice
      `,
        {}
      );
      await expect(page.locator('.actor.actor-top')).not.toHaveCount(0);
      await expect(page.locator('.actor-man.actor-top')).not.toHaveCount(0);
      await expect(page.locator('.actor.actor-top')).not.toHaveClass(/actor-bottom/);
      await expect(page.locator('.actor-man.actor-top')).not.toHaveClass(/actor-bottom/);
      await expect(page.locator('.actor.actor-bottom')).not.toHaveCount(0);
      await expect(page.locator('.actor-man.actor-bottom')).not.toHaveCount(0);
      await expect(page.locator('.actor.actor-bottom')).not.toHaveClass(/actor-top/);
      await expect(page.locator('.actor-man.actor-bottom')).not.toHaveClass(/actor-top/);
      await expect(page.locator('text.actor-box').first()).toContainText('Alice');
      await expect(page.locator('text.actor-box').last()).toContainText('Alice');
      await expect(page.locator('text.actor-man').first()).toContainText('Bob');
      await expect(page.locator('text.actor-man').last()).toContainText('Bob');
    });
    test('should render long notes left of actor', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note left of Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    test('should render long notes wrapped (inline) left of actor', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note left of Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    test('should render long notes right of actor', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note right of Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    test('should render long notes wrapped (inline) right of actor', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note right of Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    test('should render long notes over actor', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note over Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    test('should render long notes wrapped (inline) over actor', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note over Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    test('should render notes over actors and participant', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        actor Alice
        participant Charlie
        note over Alice: some note
        note over Charlie: other note
      `,
        {}
      );
    });
    test('should render long messages from an actor to the left to one to the right', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    test('should render long messages wrapped (inline) from an actor to the left to one to the right', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob:wrap:Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    test('should render long messages from an actor to the right to one to the left', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        Bob->>Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      `,
        {}
      );
    });
    test('should render long messages wrapped (inline) from an actor to the right to one to the left', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        Bob->>Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      `,
        {}
      );
    });
  });
  test.describe('background rects', () => {
    test('should render a single and nested rects', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          participant A
          participant B
          participant C
          participant D
          participant E
          participant G

          A ->>+ B: Task 1
          rect rgb(178, 102, 255)
            B ->>+ C: Task 2
            C -->>- B: Return
          end

          A ->> D: Task 3
          rect rgb(0, 128, 255)
            D ->>+ E: Task 4
            rect rgb(0, 204, 0)
            E ->>+ G: Task 5
            G -->>- E: Return
            end
            E ->> E: Task 6
          end
          D -->> A: Complete
      `,
        {}
      );
    });
    test('should render a single and nested opt with long test overflowing', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          participant A
          participant B
          participant C
          participant D
          participant E
          participant G

          A ->>+ B: Task 1
          opt this is an opt with a long title that will overflow
            B ->>+ C: Task 2
            C -->>- B: Return
          end

          A ->> D: Task 3
          opt this is another opt with a long title that will overflow
            D ->>+ E: Task 4
            opt this is a nested opt with a long title that will overflow
            E ->>+ G: Task 5
            G -->>- E: Return
            end
            E ->> E: Task 6
          end
          D -->> A: Complete
      `,
        {}
      );
    });
    test('should render a single and nested opt with long test wrapping', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { 'config': { 'wrap': true } } }%%
        sequenceDiagram
          participant A
          participant B
          participant C
          participant D
          participant E
          participant G

          A ->>+ B: Task 1
          opt this is an opt with a long title that will overflow
            B ->>+ C: Task 2
            C -->>- B: Return
          end

          A ->> D: Task 3
          opt this is another opt with a long title that will overflow
            D ->>+ E: Task 4
            opt this is a nested opt with a long title that will overflow
            E ->>+ G: Task 5
            G -->>- E: Return
            end
            E ->> E: Task 6
          end
          D -->> A: Complete
      `,
        {}
      );
    });
    test('should render rect around and inside loops', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          A ->> B: 1
          rect rgb(204, 0, 102)
            loop check C
              C ->> C: Every 10 seconds
            end
          end
          A ->> B: 2
          loop check D
            C ->> D: 3
            rect rgb(153, 153, 255)
            D -->> D: 5
            D --> C: 4
            end
          end
      `,
        {}
      );
    });
    test('should render rect around and inside alts', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          A ->> B: 1
          rect rgb(204, 0, 102)
            alt yes
              C ->> C: 1
            else no
              rect rgb(0, 204, 204)
                C ->> C: 0
              end
            end
          end
          B ->> A: Return
      `,
        {}
      );
    });
    test('should render rect around and inside opts', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          A ->> B: 1
          rect rgb(204, 0, 102)
            opt maybe
              C -->> D: Do something
              rect rgb(0, 204, 204)
                C ->> C: 0
              end
            end
          end

          opt possibly
            rect rgb(0, 204, 204)
              C ->> C: 0
            end
          end
          B ->> A: Return
      `,
        {}
      );
    });
    test('should render rect around and inside criticals', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          A ->> B: 1
          rect rgb(204, 0, 102)
            critical yes
              C ->> C: 1
            option no
              rect rgb(0, 204, 204)
                C ->> C: 0
              end
            end
          end
          B ->> A: Return
      `,
        {}
      );
    });
    test('should render rect around and inside breaks', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          A ->> B: 1
          rect rgb(204, 0, 102)
            break yes
              rect rgb(0, 204, 204)
                C ->> C: 0
              end
            end
          end
          B ->> A: Return
      `,
        {}
      );
    });
    test('should render autonumber when configured with such', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        Alice->>John: Hello John, how are you?
        loop Healthcheck
            John->>John: Fight against hypochondria
        end
        Note right of John: Rational thoughts!
        John-->>Alice: Great!
        John->>Bob: How about you?
        Bob-->>John: Jolly good!
      `,
        { sequence: { actorMargin: 50, showSequenceNumbers: true } }
      );
    });
    test('should render autonumber when autonumber keyword is used', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        autonumber
        Alice->>John: Hello John, how are you?
        loop Healthcheck
            John->>John: Fight against hypochondria
        end
        Note right of John: Rational thoughts!
        John-->>Alice: Great!
        John->>Bob: How about you?
        Bob-->>John: Jolly good!
      `,
        {}
      );
    });
    test('should render autonumber with different line breaks', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
        autonumber
        Alice->>John: Hello John,<br>how are you?
        Alice->>John: John,<br/>can you hear me?
        John-->>Alice: Hi Alice,<br />I can hear you!
        John-->>Alice: I feel great!
      `,
        {}
      );
    });
    test('should render dark theme from init directive and configure font size 24 font', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: {'theme': 'dark', 'config': {'fontSize': 24}}}%%
        sequenceDiagram
        Alice->>John: Hello John, how are you?
        Alice->>John: John, can you hear me?
        John-->>Alice: Hi Alice, I can hear you!
        John-->>Alice: I feel great!
      `,
        {}
      );
    });
    test('should render with wrapping enabled', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { 'config': { 'wrap': true }}}%%
        sequenceDiagram
        participant A as Alice, the talkative one
        A->>John: Hello John, how are you today? I'm feeling quite verbose today.
        A->>John: John, can you hear me? If you are not available, we can talk later.
        John-->>A: Hi Alice, I can hear you! I was finishing up an important meeting.
        John-->>A: I feel great! I was not ignoring you. I am sorry you had to wait for a response.
      `,
        {}
      );
    });
    test('should render with an init directive', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: { "theme": "dark", 'config': { "fontFamily": "Menlo", "fontSize": 18, "fontWeight": 400, "wrap": true }}}%%
          sequenceDiagram
          Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
          Note left of Alice: Bob thinks
          Bob->>Alice: Fine!`,
        {}
      );
    });
  });
  test.describe('directives', () => {
    test('should override config with directive settings', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "mirrorActors": true }}}%%
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: config set to mirrorActors: false<br/>directive set to mirrorActors: true
        Bob->>Alice: Short as well
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: false, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
    test('should override config with directive settings 2', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "mirrorActors": false, "wrap": true }}}%%
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: config: mirrorActors=true<br/>directive: mirrorActors=false
        Bob->>Alice: Short as well
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: true, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
  });
  test.describe('links', () => {
    test('should support actor links', async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      sequenceDiagram
        link Alice: Dashboard @ https://dashboard.contoso.com/alice
        link Alice: Wiki @ https://wiki.contoso.com/alice
        link John: Dashboard @ https://dashboard.contoso.com/john
        link John: Wiki @ https://wiki.contoso.com/john
        Alice->>John: Hello John<br/>
        John-->>Alice: Great<br/><br/>day!
      `,
        { securityLevel: 'loose' }
      );
      await page.locator('#root-0').click();
      await expect(page.locator('#actor0_popup')).toHaveAttribute('style', 'display: block;');
      await page.locator('#root-0').click();
      await expect(page.locator('#actor0_popup')).toHaveAttribute('style', 'display: none;');
    });
    test('should support actor links and properties EXPERIMENTAL: USE WITH CAUTION', async ({
      page,
    }, testInfo) => {
      //Be aware that the syntax for "properties" is likely to be changed.
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "mirrorActors": true, "forceMenus": true }}}%%
        sequenceDiagram
        participant a as Alice
        participant j as John
        note right of a: Hello world!
        properties a: {"class": "internal-service-actor", "type": "@clock"}
        properties j: {"class": "external-service-actor", "type": "@computer"}
        links a: {"Repo": "https://www.contoso.com/repo", "Swagger": "https://www.contoso.com/swagger"}
        links j: {"Repo": "https://www.contoso.com/repo"}
        links a: {"Dashboard": "https://www.contoso.com/dashboard", "On-Call": "https://www.contoso.com/oncall"}
        link a: Contacts @ https://contacts.contoso.com/?contact=alice@contoso.com
        a->>j: Hello John, how are you?
        j-->>a: Great!
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: true, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });

    test('should handle bidirectional arrows with autonumber', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
       sequenceDiagram
       autonumber
       participant A
       participant B
       A<<->>B: This is a bidirectional message
       A->B: This is a normal message`
      );
    });

    test('should support actor links and properties when not mirrored EXPERIMENTAL: USE WITH CAUTION', async ({
      page,
    }, testInfo) => {
      //Be aware that the syntax for "properties" is likely to be changed.
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "mirrorActors": false, "forceMenus": true, "wrap": true }}}%%
        sequenceDiagram
        participant a as Alice
        participant j as John
        note right of a: Hello world!
        properties a: {"class": "internal-service-actor", "type": "@clock"}
        properties j: {"class": "external-service-actor", "type": "@computer"}
        links a: {"Repo": "https://www.contoso.com/repo", "Swagger": "https://www.contoso.com/swagger"}
        links j: {"Repo": "https://www.contoso.com/repo"}
        links a: {"Dashboard": "https://www.contoso.com/dashboard", "On-Call": "https://www.contoso.com/oncall"}
        a->>j: Hello John, how are you?
        j-->>a: Great!
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: false, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
    test("shouldn't display unused participants", async ({ page }, testInfo) => {
      //Be aware that the syntax for "properties" is likely to be changed.
      await imgSnapshotTest(
        page,
        testInfo,
        `
        %%{init: { "config": { "sequence": {"hideUnusedParticipants": true }}}}%%
        sequenceDiagram
        participant a
      `,
        {
          logLevel: 0,
          sequence: { mirrorActors: false, noteFontSize: 18, noteFontFamily: 'Arial' },
        }
      );
    });
  });
  test.describe('svg size', () => {
    test('should render a sequence diagram when useMaxWidth is true (default)', async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      sequenceDiagram
        participant Alice
        participant Bob
        participant John as John<br/>Second Line
        Alice ->> Bob: Hello Bob, how are you?
        Bob-->>John: How about you John?
        Bob--x Alice: I am good thanks!
        Bob-x John: I am good thanks!
        Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
        Bob-->Alice: Checking with John...
        alt either this
          Alice->>John: Yes
          else or this
          Alice->>John: No
          else or this will happen
          Alice->John: Maybe
        end
        par this happens in parallel
        Alice -->> Bob: Parallel message 1
        and
        Alice -->> John: Parallel message 2
        end
      `,
        { sequence: { useMaxWidth: true } }
      );
      const svg = page.locator('svg');
      await expect(svg).toHaveAttribute('width', '100%');
      const style = await svg.getAttribute('style');
      expect(style).toMatch(/^max-width: [\d.]+px;$/);
      const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
      expect(maxWidthValue).toBeGreaterThanOrEqual(820 * 0.95);
      expect(maxWidthValue).toBeLessThanOrEqual(820 * 1.05);
    });
    test('should render a sequence diagram when useMaxWidth is false', async ({
      page,
    }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `
      sequenceDiagram
        participant Alice
        participant Bob
        participant John as John<br/>Second Line
        Alice ->> Bob: Hello Bob, how are you?
        Bob-->>John: How about you John?
        Bob--x Alice: I am good thanks!
        Bob-x John: I am good thanks!
        Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
        Bob-->Alice: Checking with John...
        alt either this
          Alice->>John: Yes
          else or this
          Alice->>John: No
          else or this will happen
          Alice->John: Maybe
        end
        par this happens in parallel
        Alice -->> Bob: Parallel message 1
        and
        Alice -->> John: Parallel message 2
        end
      `,
        { sequence: { useMaxWidth: false } }
      );
      const svg = page.locator('svg');
      const width = parseFloat((await svg.getAttribute('width')) ?? '0');
      expect(width).toBeGreaterThanOrEqual(820 * 0.95);
      expect(width).toBeLessThanOrEqual(820 * 1.05);
      await expect(svg).not.toHaveAttribute('style');
    });
  });
  test.describe('render after error', () => {
    test('should render diagram after fixing destroy participant error', async ({
      page,
    }, testInfo) => {
      page.on('pageerror', () => {
        // ignore expected render errors while recovering
      });

      await renderGraph(page, testInfo, [
        `sequenceDiagram
    Alice->>Bob: Hello Bob, how are you ?
    Bob->>Alice: Fine, thank you. And you?
    create participant Carl
    Alice->>Carl: Hi Carl!
    create actor D as Donald
    Carl->>D: Hi!
    destroy Carl
    Alice-xCarl: We are too many
    destroy Bo
    Bob->>Alice: I agree`,
        `sequenceDiagram
    Alice->>Bob: Hello Bob, how are you ?
    Bob->>Alice: Fine, thank you. And you?
    create participant Carl
    Alice->>Carl: Hi Carl!
    create actor D as Donald
    Carl->>D: Hi!
    destroy Carl
    Alice-xCarl: We are too many
    destroy Bob
    Bob->>Alice: I agree`,
      ]);
    });
  });
  test.describe('render new arrow type', () => {
    test('should render Solid half arrow top', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
    sequenceDiagram
      Alice -|\\  John: Hello John, how are you? 
      Alice-|\\  John: Hi Alice, I can hear you!
      Alice -|\\  John: Test
      `
      );
    });
    test('should render Solid half arrow bottom', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
    sequenceDiagram
      Alice-|/John: Hello John, how are you?
      Alice-|/John: Hi Alice, I can hear you!
      Alice-|/John: Test
      `
      );
    });

    test('should render Stick half arrow top ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
     sequenceDiagram
      Alice-\\\\John: Hello John, how are you?
      Alice-\\\\John: Hi Alice, I can hear you!
      Alice-\\\\John: Test
      `
      );
    });
    test('should render Stick half arrow bottom ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
       sequenceDiagram
      Alice-//John: Hello John, how are you?
      Alice-//John: Hi Alice, I can hear you!
      Alice-//John: Test
      `
      );
    });
    test('should render Solid half arrow top reverse ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
       sequenceDiagram
      Alice/|-John: Hello Alice, how are you?
      Alice/|-John: Hi Alice, I can hear you!
      Alice/|-John: Test

      `
      );
    });

    test('should render Solid half arrow bottom reverse ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
        Alice \\|- John: Hello Alice, how are you?
        Alice \\|- John: Hi Alice, I can hear you!
        Alice \\|- John: Test`
      );
    });

    test('should render Stick half arrow top reverse ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      Alice //-John: Hello Alice, how are you?
      Alice //-John: Hi Alice, I can hear you!
      Alice //-John: Test`
      );
    });

    test('should render Stick half arrow bottom reverse ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
       sequenceDiagram
      Alice \\\\-John: Hello Alice, how are you?
      Alice \\\\-John: Hi Alice, I can hear you!
      Alice \\\\-John: Test`
      );
    });

    test('should render Solid half arrow top dotted', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
     sequenceDiagram
      Alice --|\\John: Hello John, how are you?
      Alice --|\\John: Hi Alice, I can hear you!
      Alice --|\\John: Test`
      );
    });

    test('should render Solid half arrow bottom dotted', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
     sequenceDiagram
      Alice --|/John: Hello John, how are you?
      Alice --|/John: Hi Alice, I can hear you!
      Alice --|/John: Test`
      );
    });

    test('should render Stick half arrow top dotted', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
     sequenceDiagram
      Alice--\\\\John: Hello John, how are you?
      Alice--\\\\John: Hi Alice, I can hear you!
      Alice--\\\\John: Test`
      );
    });

    test('should render Stick half arrow bottom dotted', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
     sequenceDiagram
      Alice--//John: Hello John, how are you?
      Alice--//John: Hi Alice, I can hear you!
      Alice--//John: Test`
      );
    });

    test('should render Solid half arrow top reverse dotted', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
  sequenceDiagram
      Alice/|--John: Hello Alice, how are you?
      Alice/|--John: Hi Alice, I can hear you!
      Alice/|--John: Test`
      );
    });

    test('should render Solid half arrow bottom reverse dotted', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
  sequenceDiagram
      Alice\\|--John: Hello Alice, how are you?
      Alice\\|--John: Hi Alice, I can hear you!
      Alice\\|--John: Test`
      );
    });

    test('should render Stick half arrow top reverse dotted ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
  sequenceDiagram
      Alice//--John: Hello Alice, how are you?
      Alice//--John: Hi Alice, I can hear you!
      Alice//--John: Test`
      );
    });

    test('should render Stick half arrow bottom reverse dotted ', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
  sequenceDiagram
      Alice\\\\--John: Hello Alice, how are you?
      Alice\\\\--John: Hi Alice, I can hear you!
      Alice\\\\--John: Test`
      );
    });
  });

  test('should render alt/else section titles with label box backgrounds', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
    sequenceDiagram
      participant Alice
      participant Bob
      opt Outer
        alt Command A
          Alice->>Bob: Request A
        else Command B
          Alice->>Bob: Request B
        else Command C
          Alice->>Bob: Request C
        end
      end
      `,
      {
        themeCSS: '.loopText { fill: #ffffff !important; } .labelBox { fill: red !important; }',
      }
    );
  });
});
