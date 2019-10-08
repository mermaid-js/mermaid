/// <reference types="Cypress" />

import { imgSnapshotTest } from '../../helpers/util';

context('Aliasing', () => {
  it('should render a simple sequence diagrams', () => {
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
      {}
    );
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
  });
});
