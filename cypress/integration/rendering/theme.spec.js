import { imgSnapshotTest } from '../../helpers/util.ts';

describe('themeCSS balancing, it', () => {
  it('should not allow unbalanced CSS definitions', () => {
    imgSnapshotTest(
      `
  %%{init: { 'themeCSS': '} * { background: red }' } }%%
  flowchart TD
    a --> b
          `
    );
  });
  it('should not allow unbalanced CSS definitions 2', () => {
    imgSnapshotTest(
      `
  %%{init: { 'themeCSS': '\u007D * { background: red }' } }%%
  flowchart TD
    a2 --> b2
          `
    );
  });
});

// TODO: Delete/Rename this describe, keeping the inner contents.
describe('Pie Chart', () => {
  ['default', 'forest', 'dark', 'neutral'].forEach((theme) => {
    describe(theme, () => {
      it('should render a pie diagram', () => {
        imgSnapshotTest(
          `
        pie title Sports in Sweden
          accTitle: This is a title
          accDescr: This is a description
          "Bandy" : 40
          "Ice-Hockey" : 80
          "Football" : 90
          `,
          { theme }
        );
      });
      it('should render a flowchart diagram', () => {
        imgSnapshotTest(
          `
        %%{init: { 'logLevel': 0} }%%
        graph TD
          accTitle: This is a title
          accDescr: This is a description
          A[Christmas] -->|Get money| B(Go shopping)
          B --> C{Let me think}
          B --> G[/Another/]
          C ==>|One| D[Laptop]
          C -->|Two| E[iPhone]
          C -->|Three| F[fa:fa-car Car]
          subgraph section
            C
            D
            E
            F
            G
          end
          `,
          { theme }
        );
      });
      it('should render a new flowchart diagram', () => {
        imgSnapshotTest(
          `
        %%{init: { 'logLevel': 0, 'theme': '${theme}'} }%%
        flowchart TD
          accTitle: This is a title
          accDescr: This is a description

          A[Christmas] -->|Get money| B(Go shopping)
          B --> C{Let me think}
          B --> G[Another]
          C ==>|One| D[Laptop]
          C x--x|Two| E[iPhone]
          C o--o|Three| F[fa:fa-car Car]
          subgraph section
            C
            D
            E
            F
            G
          end
          `,
          { theme }
        );
      });
      it('should render a sequence diagram', () => {
        imgSnapshotTest(
          `
        %%{init: { 'logLevel': 0, 'theme': '${theme}'} }%%
        sequenceDiagram
          accTitle: This is a title
          accDescr: This is a description

          autonumber
          par Action 1
            Alice->>John: Hello John, how are you?
          and Action 2
            Alice->>Bob: Hello Bob, how are you?
          end
          Alice->>+John: Hello John, how are you?
          Alice->>+John: John, can you hear me?
          John-->>-Alice: Hi Alice, I can hear you!
          Note right of John: John is perceptive
          John-->>-Alice: I feel great!
              loop Every minute
                John-->Alice: Great!
            end
          `,
          { theme }
        );
      });

      it('should render a class diagram', () => {
        imgSnapshotTest(
          `
        %%{init: { 'logLevel': 0, 'theme': '${theme}'} }%%
        classDiagram
          accTitle: This is a title
          accDescr: This is a description

          Animal "*" <|-- "1" Duck
          Animal "1" <|-- "10" Fish
          Animal <|-- Zebra
          Animal : +int age
          Animal : +String gender
          Animal: +isMammal()
          Animal: +mate()
          class Duck{
            +String beakColor
            +swim()
            +quack()
          }
          class Fish{
            -int sizeInFeet
            -canEat()
          }
          class Zebra{
            +bool is_wild
            +run()
          }
        classA <|-- classB
        classC *-- classD
        classE o-- classF
        classG <-- classH
        classI -- classJ
        classK <.. classL
        classM <|.. classN
        classO .. classP
        classA --|> classB : Inheritance
        classC --* classD : Composition
        classE --o classF : Aggregation
        classG --> classH : Association
        classI -- classJ : Link(Solid)
        classK ..> classL : Dependency
        classM ..|> classN : Realization
        classO .. classP : Link(Dashed)
          `,
          { theme }
        );
      });
      it('should render a state diagram', () => {
        imgSnapshotTest(
          `
        %%{init: { 'logLevel': 0, 'theme': '${theme}'} }%%
stateDiagram
        accTitle: This is a title
        accDescr: This is a description

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
        state SomethingElse {
          A --> B
          B --> A
        }

        Active --> SomethingElse
        note right of SomethingElse : This is the note to the right.
          `,
          { theme }
        );
      });
      it('should render a state diagram (v2)', () => {
        imgSnapshotTest(
          `
        %%{init: { 'logLevel': 0, 'theme': '${theme}'} }%%
stateDiagram-v2
        accTitle: This is a title
        accDescr: This is a description

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
        state SomethingElse {
          A --> B
          B --> A
        }

        Active --> SomethingElse2
        note right of SomethingElse2 : This is the note to the right.
          `,
          { theme }
        );
      });
      it('should render a er diagram', () => {
        imgSnapshotTest(
          `
erDiagram
          accTitle: This is a title
          accDescr: This is a description

        CUSTOMER }|..|{ DELIVERY-ADDRESS : has
        CUSTOMER ||--o{ ORDER : places
        CUSTOMER ||--o{ INVOICE : "liable for"
        DELIVERY-ADDRESS ||--o{ ORDER : receives
        INVOICE ||--|{ ORDER : covers
        ORDER ||--|{ ORDER-ITEM : includes
        PRODUCT-CATEGORY ||--|{ PRODUCT : contains
        PRODUCT ||--o{ ORDER-ITEM : "ordered in"

          `,
          { theme }
        );
      });
      it('should render a user journey diagram', () => {
        imgSnapshotTest(
          `
        %%{init: { 'logLevel': 0, 'theme': '${theme}'} }%%
        journey
            accTitle: This is a title
            accDescr: This is a description

            title My working day
            section Go to work
              Make tea: 5: Me
              Go upstairs: 3: Me
              Do work: 1: Me, Cat
            section Go home
              Go downstairs: 5: Me
              Sit down: 5: Me
                        `,
          { theme }
        );
      });
      it('should render a gantt diagram', () => {
        cy.clock(new Date('2014-01-06').getTime());
        imgSnapshotTest(
          `
      gantt
       accTitle: This is a title
       accDescr: This is a description

       dateFormat                :YYYY-MM-DD
       title                     :Adding GANTT diagram functionality to mermaid
       excludes                  :excludes the named dates/days from being included in a charted task..
       section A section
       Completed task            :done,    des1, 2014-01-06,2014-01-08
       Active task               :active,  des2, 2014-01-09, 3d
       Future task               :         des3, after des2, 5d
       Future task2              :         des4, after des3, 5d

       section Critical tasks
       Completed task in the critical line :crit, done, 2014-01-06,24h
       Implement parser and jison          :crit, done, after des1, 2d
       Create tests for parser             :crit, active, 3d
       Future task in critical line        :crit, 5d
       Create tests for renderer           :2d
       Add to mermaid                      :1d

       section Documentation
       Describe gantt syntax               :active, a1, after des1, 3d
       Add gantt diagram to demo page      :after a1  , 20h
       Add another diagram to demo page    :doc1, after a1  , 48h

       section Last section
       Describe gantt syntax               :after doc1, 3d
       Add gantt diagram to demo page      :20h
       Add another diagram to demo page    :48h
       `,
          { theme }
        );
      });
    });
  });
});
