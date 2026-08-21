import { test } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

// Rendering coverage for central-connection message syntax: the ()->>() family,
// its REVERSE and DUAL forms, both directions, and the autonumber variants.
const looks = ['classic'];

looks.forEach((look) => {
  test.describe(`Sequence Diagram central connections - ${look} look`, () => {
    test('should render central connection circles on actor vertical lines', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
        participant Alice
        participant Bob
        participant Charlie
        Alice ()->>() Bob: Central connection
        Bob ()-->> Charlie: Reverse central connection
        Charlie ()<<-->>() Alice: Dual central connection`,
        { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections with different arrow types', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
        participant Alice
        participant Bob
        Alice ()->>() Bob: Solid open arrow
        Alice ()-->>() Bob: Dotted open arrow
        Alice ()-x() Bob: Solid cross
        Alice ()--x() Bob: Dotted cross
        Alice ()->() Bob: Solid arrow`,
        { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections with bidirectional arrows', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
        participant Alice
        participant Bob
        Alice ()<<->>() Bob: Bidirectional solid
        Alice ()<<-->>() Bob: Bidirectional dotted`,
        { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections with activations', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
        participant Alice
        participant Bob
        participant Charlie
        Alice ()->>() Bob: Activate Bob
        activate Bob
        Bob ()-->> Charlie: Message to Charlie
        Bob ()->>() Alice: Response to Alice
        deactivate Bob`,
        { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections mixed with normal messages', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
        participant Alice
        participant Bob
        participant Charlie
        Alice ->> Bob: Normal message
        Bob ()->>() Charlie: Central connection
        Charlie -->> Alice: Normal dotted message
        Alice ()<<-->>() Bob: Dual central connection
        Bob -x Charlie: Normal cross message`,
        { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections with notes', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
        participant Alice
        participant Bob
        participant Charlie
        Alice ()->>() Bob: Central connection
        Note over Alice,Bob: Central connection note
        Bob ()-->> Charlie: Reverse central connection
        Note right of Charlie: Response note
        Charlie ()<<-->>() Alice: Dual central connection`,
        { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections with loops and alternatives', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
        participant Alice
        participant Bob
        participant Charlie
        loop Every minute
            Alice ()->>() Bob: Central heartbeat
            Bob ()-->> Charlie: Forward heartbeat
        end
        alt Success
            Charlie ()<<-->>() Alice: Success response
        else Failure
            Charlie ()-x() Alice: Failure response
        end`,
        { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections with different participant types', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `sequenceDiagram
          participant Alice
          actor Bob
          participant Charlie@{"type":"boundary"}
          participant David@{"type":"control"}
          participant Eve@{"type":"entity"}
          Alice ()->>() Bob: To actor
          Bob ()-->> Charlie: To boundary
          Charlie ()->>() David: To control
          David ()<<-->>() Eve: To entity
          Eve ()-x() Alice: Back to participant`,
        { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections with autonumbering', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice->>()Bob: Central connection at destination
    Bob()->>Alice: Reverse central at source
    Alice()->>()Bob: Dual central connections
    Bob->>()Charlie: Another central connection
    Charlie()-->>Alice: Reverse central dotted
    Alice()<<-->>()Bob: Dual central bidirectional`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render CENTRAL_CONNECTION with normal arrows - left to right', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice->>()Bob: Solid arrow with circle at destination
    Alice-->>()Bob: Dotted arrow with circle at destination
    Alice->()Bob: Open arrow with circle at destination
    Alice--x()Bob: Cross arrow with circle at destination
    Alice--)()Bob: Close arrow with circle at destination`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render CENTRAL_CONNECTION with normal arrows - right to left', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Bob->>()Alice: Solid arrow with circle at destination (RTL)
    Charlie-->>()Bob: Dotted arrow with circle at destination (RTL)
    Bob->()Alice: Open arrow with circle at destination (RTL)
    Charlie--x()Alice: Cross arrow with circle at destination (RTL)
    Bob--)()Alice: Close arrow with circle at destination (RTL)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render CENTRAL_CONNECTION with reverse arrows - left to right', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Bob/|-()Alice: Solid top reverse with circle (LTR)
    Bob\\|-()Alice: Solid bottom reverse with circle (LTR)
    Bob//-()Alice: Stick top reverse with circle (LTR)
    Bob\\\\-()Alice: Stick bottom reverse with circle (LTR)
    Bob/|--()Alice: Dotted solid top reverse with circle (LTR)
    Bob\\|--()Alice: Dotted solid bottom reverse with circle (LTR)
    Bob//--()Alice: Dotted stick top reverse with circle (LTR)
    Bob\\\\--()Alice: Dotted stick bottom reverse with circle (LTR)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render CENTRAL_CONNECTION with reverse arrows - right to left', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice/|-()Bob: Solid top reverse with circle (RTL)
    Alice\\|-()Bob: Solid bottom reverse with circle (RTL)
    Alice//-()Bob: Stick top reverse with circle (RTL)
    Alice\\\\-()Bob: Stick bottom reverse with circle (RTL)
    Alice/|--()Bob: Dotted solid top reverse with circle (RTL)
    Alice\\|--()Bob: Dotted solid bottom reverse with circle (RTL)
    Alice//--()Bob: Dotted stick top reverse with circle (RTL)
    Alice\\\\--()Bob: Dotted stick bottom reverse with circle (RTL)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render Central_Connection_REVERSE ()->> normal LTR', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()->>Bob: Circle at source with solid arrow
    Alice()-->>Bob: Circle at source with dotted arrow
    Alice()->Bob: Circle at source with open arrow
    Alice()--xBob: Circle at source with cross arrow
    Alice()--)Bob: Circle at source with close arrow`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render Central_Connection_REVERSE ()->> normal RTL', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Bob()->>Alice: Circle at source with solid arrow (RTL)
    Charlie()-->>Bob: Circle at source with dotted arrow (RTL)
    Bob()->Alice: Circle at source with open arrow (RTL)
    Charlie()--xAlice: Circle at source with cross arrow (RTL)
    Bob()--)Alice: Circle at source with close arrow (RTL)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render Central_Connection_REVERSE ()->> reverse LTR', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Bob()/|-Alice: Circle at source with solid top reverse (LTR)
    Bob()\\|-Alice: Circle at source with solid bottom reverse (LTR)
    Bob()//-Alice: Circle at source with stick top reverse (LTR)
    Bob()\\\\-Alice: Circle at source with stick bottom reverse (LTR)
    Bob()/|--Alice: Circle at source with dotted solid top reverse (LTR)
    Bob()\\|--Alice: Circle at source with dotted solid bottom reverse (LTR)
    Bob()//--Alice: Circle at source with dotted stick top reverse (LTR)
    Bob()\\\\--Alice: Circle at source with dotted stick bottom reverse (LTR)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render Central_Connection_REVERSE ()->> reverse RTL', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()/|-Bob: Circle at source with solid top reverse (RTL)
    Alice()\\|-Bob: Circle at source with solid bottom reverse (RTL)
    Alice()//-Bob: Circle at source with stick top reverse (RTL)
    Alice()\\\\-Bob: Circle at source with stick bottom reverse (RTL)
    Alice()/|--Bob: Circle at source with dotted solid top reverse (RTL)
    Alice()\\|--Bob: Circle at source with dotted solid bottom reverse (RTL)
    Alice()//--Bob: Circle at source with dotted stick top reverse (RTL)
    Alice()\\\\--Bob: Circle at source with dotted stick bottom reverse (RTL)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render Central_Connection_DUAL ()->>() normal LTR', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()->>()Bob: Circles at both ends with solid arrow
    Alice()-->>()Bob: Circles at both ends with dotted arrow
    Alice()->()Bob: Circles at both ends with open arrow
    Alice()--x()Bob: Circles at both ends with cross arrow
    Alice()--)()Bob: Circles at both ends with close arrow`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render Central_Connection_DUAL ()->>() normal RTL', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Bob()->>()Alice: Circles at both ends with solid arrow (RTL)
    Charlie()-->>()Bob: Circles at both ends with dotted arrow (RTL)
    Bob()->()Alice: Circles at both ends with open arrow (RTL)
    Charlie()--x()Alice: Circles at both ends with cross arrow (RTL)
    Bob()--)()Alice: Circles at both ends with close arrow (RTL)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render Central_Connection_DUAL ()->>() reverse LTR', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Bob()/|-()Alice: Circles at both ends with solid top reverse (LTR)
    Bob()\\|-()Alice: Circles at both ends with solid bottom reverse (LTR)
    Bob()//-()Alice: Circles at both ends with stick top reverse (LTR)
    Bob()\\\\-()Alice: Circles at both ends with stick bottom reverse (LTR)
    Bob()/|--()Alice: Circles at both ends with dotted solid top reverse (LTR)
    Bob()\\|--()Alice: Circles at both ends with dotted solid bottom reverse (LTR)
    Bob()//--()Alice: Circles at both ends with dotted stick top reverse (LTR)
    Bob()\\\\--()Alice: Circles at both ends with dotted stick bottom reverse (LTR)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render Central_Connection_DUAL ()->>() reverse RTL', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()/|-()Bob: Circles at both ends with solid top reverse (RTL)
    Alice()\\|-()Bob: Circles at both ends with solid bottom reverse (RTL)
    Alice()//-()Bob: Circles at both ends with stick top reverse (RTL)
    Alice()\\\\-()Bob: Circles at both ends with stick bottom reverse (RTL)
    Alice()/|--()Bob: Circles at both ends with dotted solid top reverse (RTL)
    Alice()\\|--()Bob: Circles at both ends with dotted solid bottom reverse (RTL)
    Alice()//--()Bob: Circles at both ends with dotted stick top reverse (RTL)
    Alice()\\\\--()Bob: Circles at both ends with dotted stick bottom reverse (RTL)`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render mixed central connections with autonumber', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    participant David

    Note over Alice,David: Normal arrows with central connections
    Alice->>()Bob: CENTRAL_CONNECTION LTR
    Bob->>()Alice: CENTRAL_CONNECTION RTL
    Alice()->>Bob: CENTRAL_CONNECTION_REVERSE LTR
    Bob()->>Alice: CENTRAL_CONNECTION_REVERSE RTL
    Alice()->>()Bob: CENTRAL_CONNECTION_DUAL LTR
    Bob()->>()Alice: CENTRAL_CONNECTION_DUAL RTL

    Note over Alice,David: Reverse arrows with central connections
    Bob/|-()Alice: Reverse with CENTRAL_CONNECTION LTR
    Alice/|-()Bob: Reverse with CENTRAL_CONNECTION RTL
    Bob()/|-Alice: Reverse with CENTRAL_CONNECTION_REVERSE LTR
    Alice()/|-Bob: Reverse with CENTRAL_CONNECTION_REVERSE RTL
    Bob()/|-()Alice: Reverse with CENTRAL_CONNECTION_DUAL LTR
    Alice()/|-()Bob: Reverse with CENTRAL_CONNECTION_DUAL RTL

    Note over Alice,David: Mixed with different participants
    Alice->>()Charlie: Skip participant
    Charlie()->>Alice: Back skip
    Bob()->>()David: Another skip
    David()->>()Bob: Return skip`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render central connections with bidirectional arrows and autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()<<->>()Bob: Dual central with bidirectional solid LTR
    Bob()<<->>()Alice: Dual central with bidirectional solid RTL
    Alice()<<-->>()Bob: Dual central with bidirectional dotted LTR
    Bob()<<-->>()Alice: Dual central with bidirectional dotted RTL
    Alice<<->>()Bob: Central at end with bidirectional LTR
    Bob()<<->>Alice: Central at start with bidirectional RTL`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with CENTRAL_CONNECTION - without autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    Alice->>()Alice: Solid arrow with circle at destination
    Bob-->>()Bob: Dotted arrow with circle at destination
    Charlie->()Charlie: Open arrow with circle at destination
    Alice--x()Alice: Cross arrow with circle at destination
    Bob--)()Bob: Close arrow with circle at destination`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with CENTRAL_CONNECTION - with autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice->>()Alice: Solid arrow with circle at destination
    Bob-->>()Bob: Dotted arrow with circle at destination
    Charlie->()Charlie: Open arrow with circle at destination
    Alice--x()Alice: Cross arrow with circle at destination
    Bob--)()Bob: Close arrow with circle at destination`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with CENTRAL_CONNECTION_REVERSE  - without autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    Alice()->>Alice: Circle at source with solid arrow
    Bob()-->>Bob: Circle at source with dotted arrow
    Charlie()->Charlie: Circle at source with open arrow
    Alice()--xAlice: Circle at source with cross arrow
    Bob()--)Bob: Circle at source with close arrow`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with CENTRAL_CONNECTION_REVERSE - with autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()->>Alice: Circle at source with solid arrow
    Bob()-->>Bob: Circle at source with dotted arrow
    Charlie()->Charlie: Circle at source with open arrow
    Alice()--xAlice: Circle at source with cross arrow
    Bob()--)Bob: Circle at source with close arrow`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with CENTRAL_CONNECTION_DUAL - without autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    Alice()->>()Alice: Circles at both ends with solid arrow
    Bob()-->>()Bob: Circles at both ends with dotted arrow
    Charlie()->()Charlie: Circles at both ends with open arrow
    Alice()--x()Alice: Circles at both ends with cross arrow
    Bob()--)()Bob: Circles at both ends with close arrow`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with CENTRAL_CONNECTION_DUAL - with autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()->>()Alice: Circles at both ends with solid arrow
    Bob()-->>()Bob: Circles at both ends with dotted arrow
    Charlie()->()Charlie: Circles at both ends with open arrow
    Alice()--x()Alice: Circles at both ends with cross arrow
    Bob()--)()Bob: Circles at both ends with close arrow`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with reverse arrows and CENTRAL_CONNECTION', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    Alice/|-()Alice: Solid top reverse with circle at destination
    Bob\\|-()Bob: Solid bottom reverse with circle at destination
    Charlie//-()Charlie: Stick top reverse with circle at destination
    Alice\\\\-()Alice: Stick bottom reverse with circle at destination
    Bob/|--()Bob: Dotted solid top reverse with circle at destination
    Charlie\\|--()Charlie: Dotted solid bottom reverse with circle at destination
    Alice//--()Alice: Dotted stick top reverse with circle at destination
    Bob\\\\--()Bob: Dotted stick bottom reverse with circle at destination`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with reverse arrows and CENTRAL_CONNECTION - with autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice/|-()Alice: Solid top reverse with circle at destination
    Bob\\|-()Bob: Solid bottom reverse with circle at destination
    Charlie//-()Charlie: Stick top reverse with circle at destination
    Alice\\\\-()Alice: Stick bottom reverse with circle at destination
    Bob/|--()Bob: Dotted solid top reverse with circle at destination
    Charlie\\|--()Charlie: Dotted solid bottom reverse with circle at destination
    Alice//--()Alice: Dotted stick top reverse with circle at destination
    Bob\\\\--()Bob: Dotted stick bottom reverse with circle at destination`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-ref reverse Central_Connection_REVERSE no-autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    Alice()/|-Alice: Circle at source with solid top reverse
    Bob()\\|-Bob: Circle at source with solid bottom reverse
    Charlie()//-Charlie: Circle at source with stick top reverse
    Alice()\\\\-Alice: Circle at source with stick bottom reverse
    Bob()/|--Bob: Circle at source with dotted solid top reverse
    Charlie()\\|--Charlie: Circle at source with dotted solid bottom reverse
    Alice()//--Alice: Circle at source with dotted stick top reverse
    Bob()\\\\--Bob: Circle at source with dotted stick bottom reverse`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-ref reverse Central_Connection_REVERSE autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()/|-Alice: Circle at source with solid top reverse
    Bob()\\|-Bob: Circle at source with solid bottom reverse
    Charlie()//-Charlie: Circle at source with stick top reverse
    Alice()\\\\-Alice: Circle at source with stick bottom reverse
    Bob()/|--Bob: Circle at source with dotted solid top reverse
    Charlie()\\|--Charlie: Circle at source with dotted solid bottom reverse
    Alice()//--Alice: Circle at source with dotted stick top reverse
    Bob()\\\\--Bob: Circle at source with dotted stick bottom reverse`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-ref reverse Central_Connection_DUAL no-autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    Alice()/|-()Alice: Circles at both ends with solid top reverse
    Bob()\\|-()Bob: Circles at both ends with solid bottom reverse
    Charlie()//-()Charlie: Circles at both ends with stick top reverse
    Alice()\\\\-()Alice: Circles at both ends with stick bottom reverse
    Bob()/|--()Bob: Circles at both ends with dotted solid top reverse
    Charlie()\\|--()Charlie: Circles at both ends with dotted solid bottom reverse
    Alice()//--()Alice: Circles at both ends with dotted stick top reverse
    Bob()\\\\--()Bob: Circles at both ends with dotted stick bottom reverse`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-references, reverse arrows & dual central connection (autonumber).', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()/|-()Alice: Circles at both ends with solid top reverse
    Bob()\\|-()Bob: Circles at both ends with solid bottom reverse
    Charlie()//-()Charlie: Circles at both ends with stick top reverse
    Alice()\\\\-()Alice: Circles at both ends with stick bottom reverse
    Bob()/|--()Bob: Circles at both ends with dotted solid top reverse
    Charlie()\\|--()Charlie: Circles at both ends with dotted solid bottom reverse
    Alice()//--()Alice: Circles at both ends with dotted stick top reverse
    Bob()\\\\--()Bob: Circles at both ends with dotted stick bottom reverse`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('Render self-references with bidirectional central connections (no autonumber).', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
    Alice()<<->>()Alice: Dual central with bidirectional solid
    Bob()<<-->>()Bob: Dual central with bidirectional dotted
    Charlie<<->>()Alice: Central at end with bidirectional
    Bob()<<->>Bob: Central at start with bidirectional`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with bidirectional and central connections - with autonumber', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice()<<->>()Alice: Dual central with bidirectional solid
    Bob()<<-->>()Bob: Dual central with bidirectional dotted
    Charlie<<->>()Charlie: Central at end with bidirectional
    Bob()<<->>Bob: Central at start with bidirectional`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });
  });
});
