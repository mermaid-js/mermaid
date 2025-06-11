import { imgSnapshotTest } from '../../helpers/util.ts';

describe('Flowchart IPSepCoLa', () => {
  it('1-ipsepCola: should render a simple flowchart', () => {
    imgSnapshotTest(
      `---
        config:
          layout: ipsepCola
    ---
    flowchart
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]
      `
    );
  });
  it('2-ipsepCola: handle bidirectional edges', () => {
    imgSnapshotTest(
      `---
        config:
          layout: ipsepCola
    ---
    flowchart TD
        subgraph D
          A --> B
          A --> B
          B --> A
          B --> A
        end
      `
    );
  });
  it('3-ipsepCola: handle multiple self loops', () => {
    imgSnapshotTest(
      `---
        config:
          layout: ipsepCola
    ---
    flowchart
        a --> a
        a --> a
        a --> a
        a --> a
      `
    );
  });
  it('4-ipsepCola: handle state diagram example', () => {
    imgSnapshotTest(
      `---
        config:
          layout: ipsepCola
    ---
    stateDiagram-v2
        [*] --> Still
        Still --> [*]
        Still --> Moving
        Moving --> Still
        Moving --> Crash
        Crash --> [*]
      `
    );
  });
  it('5-ipsepCola: handle multiple subgraphs with edges between them', () => {
    imgSnapshotTest(
      `---
        config:
          layout: ipsepCola
    ---
    flowchart LR
        c1-->a2
        subgraph one
        a1-->a2
        end
        subgraph two
        b1-->b2
        end
        subgraph three
        c1-->c2
        end
        one --> two
        three --> two
        two --> c2
      `
    );
  });
  it('6-ipsepCola: handle class diagram example', () => {
    imgSnapshotTest(
      `---
        config:
          layout: ipsepCola
    ---
    classDiagram
        class AuthService {
          +login(username: string, password: string): boolean
          +logout(): void
          +register(): void
        }

        class User {
          -username: string
          -password: string
          -role: Role
          +changePassword(): void
        }

        class Role {
          -name: string
          -permissions: string[]
          +hasPermission(): boolean
        }

        AuthService --> User
        User --> Role
      `
    );
  });
  it('7-ipsepCola: should render a decision flowchart', () => {
    imgSnapshotTest(
      `---
        config:
          layout: ipsepCola
    ---
      flowchart TD
        Start([Start]) --> Prep[Preparation Step]
        Prep --> Split{Ready to Process?}
        Split -->|Yes| T1[Task A]
        Split -->|Yes| T2[Task B]
        T1 --> Merge
        T2 --> Merge
        Merge((Join Results)) --> Finalize[Finalize Process]
        Finalize --> End([End])
      `
    );
  });
  it('8-ipsepCola: handle nested subgraphs', () => {
    imgSnapshotTest(
      `---
        config:
          layout: ipsepCola
    ---
    flowchart LR
        subgraph  main
          subgraph subcontainer
            subcontainer-child
          end
           subcontainer-child--> subcontainer-sibling
        end
      `
    );
  });
});
