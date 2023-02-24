/// <reference types="Cypress" />

import { imgSnapshotTest, renderGraph } from '../../helpers/util';

context('Sequence diagram', () => {
  it('should render a sequence diagram with boxes', () => {
    renderGraph(
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
    cy.get('svg').should((svg) => {
      const width = parseFloat(svg.attr('width'));
      expect(width).to.be.within(830 * 0.95, 830 * 1.05);
      expect(svg).to.not.have.attr('style');
    });
  });
  it('should render a simple sequence diagram', () => {
    imgSnapshotTest(
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
  it('should handle different line breaks', () => {
    imgSnapshotTest(
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
  it('should handle line breaks and wrap annotations', () => {
    imgSnapshotTest(
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
  it('should render loops with a slight margin', () => {
    imgSnapshotTest(
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
  context('font settings', () => {
    it('should render different note fonts when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I should have bigger fonts
        Bob->>Alice: Short as well
      `,
        { sequence: { noteFontSize: 18, noteFontFamily: 'Arial' } }
      );
    });
    it('should render different message fonts when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        Bob->>Alice: Short as well
      `,
        { sequence: { messageFontSize: 18, messageFontFamily: 'Arial' } }
      );
    });
    it('should render different actor fonts when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        Bob->>Alice: Short as well
      `,
        { sequence: { actorFontSize: 18, actorFontFamily: 'times' } }
      );
    });
    it('should render notes aligned to the left when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I am left aligned
        Bob->>Alice: Short as well
      `,
        { sequence: { noteAlign: 'left' } }
      );
    });
    it('should render multi-line notes aligned to the left when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I am left aligned<br>but also<br>multiline
        Bob->>Alice: Short as well
      `,
        { sequence: { noteAlign: 'left' } }
      );
    });
    it('should render notes aligned to the right when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I am right aligned
        Bob->>Alice: Short as well
      `,
        { sequence: { noteAlign: 'right' } }
      );
    });
    it('should render multi-line notes aligned to the right when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: I am right aligned<br>but also<br>multiline
        Bob->>Alice: Short as well
      `,
        { sequence: { noteAlign: 'right' } }
      );
    });
    it('should render multi-line messages aligned to the left when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short<br>but also<br>multiline
        Bob->>Alice: Short as well<br>and also<br>multiline
      `,
        { sequence: { messageAlign: 'left' } }
      );
    });
    it('should render multi-line messages aligned to the right when configured', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short<br>but also<br>multiline
        Bob->>Alice: Short as well<br>and also<br>multiline
      `,
        { sequence: { messageAlign: 'right' } }
      );
    });
  });
  context('auth width scaling', () => {
    it('should render long actor descriptions', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        participant A as Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        A->>Bob: Hola
        Bob-->A: Pasten !
      `,
        { logLevel: 0 }
      );
    });
    it('should wrap (inline) long actor descriptions', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        participant A as wrap:Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        A->>Bob: Hola
        Bob-->A: Pasten !
      `,
        { logLevel: 0 }
      );
    });
    it('should wrap (directive) long actor descriptions', () => {
      imgSnapshotTest(
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
    it('should be possible to use actor symbols instead of boxes', () => {
      imgSnapshotTest(
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
    it('should render long notes left of actor', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note left of Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    it('should render long notes wrapped (inline) left of actor', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note left of Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    it('should render long notes right of actor', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note right of Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    it('should render long notes wrapped (inline) right of actor', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note right of Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    it('should render long notes over actor', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note over Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    it('should render long notes wrapped (inline) over actor', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: Hola
        Note over Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    it('should render long messages from an actor to the left to one to the right', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    it('should render long messages wrapped (inline) from an actor to the left to one to the right', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob:wrap:Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
      `,
        {}
      );
    });
    it('should render long messages from an actor to the right to one to the left', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        Bob->>Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      `,
        {}
      );
    });
    it('should render long messages wrapped (inline) from an actor to the right to one to the left', () => {
      imgSnapshotTest(
        `
        sequenceDiagram
        Alice->>Bob: I'm short
        Bob->>Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      `,
        {}
      );
    });
  });
  context('background rects', () => {
    it('should render a single and nested rects', () => {
      imgSnapshotTest(
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
    it('should render a single and nested opt with long test overflowing', () => {
      imgSnapshotTest(
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
    it('should render a single and nested opt with long test wrapping', () => {
      imgSnapshotTest(
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
    it('should render rect around and inside loops', () => {
      imgSnapshotTest(
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
    it('should render rect around and inside alts', () => {
      imgSnapshotTest(
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
    it('should render rect around and inside opts', () => {
      imgSnapshotTest(
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
    it('should render rect around and inside criticals', () => {
      imgSnapshotTest(
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
    it('should render rect around and inside breaks', () => {
      imgSnapshotTest(
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
    it('should render autonumber when configured with such', () => {
      imgSnapshotTest(
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
    it('should render autonumber when autonumber keyword is used', () => {
      imgSnapshotTest(
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
    it('should render autonumber with different line breaks', () => {
      imgSnapshotTest(
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
    it('should render dark theme from init directive and configure font size 24 font', () => {
      imgSnapshotTest(
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
    it('should render with wrapping enabled', () => {
      imgSnapshotTest(
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
    it('should render with an init directive', () => {
      imgSnapshotTest(
        `%%{init: { "theme": "dark", 'config': { "fontFamily": "Menlo", "fontSize": 18, "fontWeight": 400, "wrap": true }}}%%
          sequenceDiagram
          Alice->>Bob: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
          Note left of Alice: Bob thinks
          Bob->>Alice: Fine!`,
        {}
      );
    });
  });
  context('directives', () => {
    it('should override config with directive settings', () => {
      imgSnapshotTest(
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
    it('should override config with directive settings 2', () => {
      imgSnapshotTest(
        `
        %%{init: { "config": { "mirrorActors": false, "wrap": true }}}%%
        sequenceDiagram
        Alice->>Bob: I'm short
        note left of Alice: config: mirrorActors=true<br/>directive: mirrorActors=false
        Bob->>Alice: Short as well
      `,
        { logLevel: 0, sequence: { mirrorActors: true, noteFontSize: 18, noteFontFamily: 'Arial' } }
      );
    });
  });
  context('links', () => {
    it('should support actor links and properties EXPERIMENTAL: USE WITH CAUTION', () => {
      //Be aware that the syntax for "properties" is likely to be changed.
      imgSnapshotTest(
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
        { logLevel: 0, sequence: { mirrorActors: true, noteFontSize: 18, noteFontFamily: 'Arial' } }
      );
    });
    it('should support actor links and properties when not mirrored EXPERIMENTAL: USE WITH CAUTION', () => {
      //Be aware that the syntax for "properties" is likely to be changed.
      imgSnapshotTest(
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
    it("shouldn't display unused participants", () => {
      //Be aware that the syntax for "properties" is likely to be changed.
      imgSnapshotTest(
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
  context('svg size', () => {
    it('should render a sequence diagram when useMaxWidth is true (default)', () => {
      renderGraph(
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
      cy.get('svg').should((svg) => {
        expect(svg).to.have.attr('width', '100%');
        // expect(svg).to.have.attr('height');
        // const height = parseFloat(svg.attr('height'));
        // expect(height).to.be.within(920, 971);
        const style = svg.attr('style');
        expect(style).to.match(/^max-width: [\d.]+px;$/);
        const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
        // use within because the absolute value can be slightly different depending on the environment ±5%
        expect(maxWidthValue).to.be.within(820 * 0.95, 820 * 1.05);
      });
    });
    it('should render a sequence diagram when useMaxWidth is false', () => {
      renderGraph(
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
      cy.get('svg').should((svg) => {
        // const height = parseFloat(svg.attr('height'));
        const width = parseFloat(svg.attr('width'));
        // expect(height).to.be.within(920, 971);
        // use within because the absolute value can be slightly different depending on the environment ±5%
        expect(width).to.be.within(820 * 0.95, 820 * 1.05);
        expect(svg).to.not.have.attr('style');
      });
    });
  });
});
