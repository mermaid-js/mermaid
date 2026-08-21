import { test } from '@playwright/test';
import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

// Rendering coverage for the participant type matrix (actor, boundary, control,
// entity, database, collections, queue) combined with notes, loops, alternative
// flows, parallel blocks and long/wrapped text.
const looks = ['classic'];

looks.forEach((look) => {
  test.describe(`Sequence Diagram participant types - ${look} look`, () => {
    test('should render a sequence diagram with various participant types', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
        sequenceDiagram
          participant User@{ "type": "actor" }
          participant AuthService@{ "type": "control" }
          participant UI@{ "type": "boundary" }
          participant OrderController@{ "type": "control" }
          participant Product@{ "type": "entity" }
          participant MongoDB@{ "type": "database" }
          participant Products@{ "type": "collections" }
          participant OrderQueue@{ "type": "queue" }
          User ->> UI: Login request
          UI ->> AuthService: Validate credentials
          AuthService -->> UI: Authentication token
          UI ->> OrderController: Place order
          OrderController ->> Product: Check availability
          Product -->> OrderController: Available
          OrderController ->> MongoDB: Save order
          MongoDB -->> OrderController: Order saved
          OrderController ->> OrderQueue: Process payment
          OrderQueue -->> User: Order confirmation
      `
      );
    });

    test('should render participant creation and destruction with different types', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
          participant Alice@{ "type" : "boundary" }
          Alice->>Bob: Hello Bob, how are you ?
          Bob->>Alice: Fine, thank you. And you?
          create participant Carl@{ "type" : "control" }
          Alice->>Carl: Hi Carl!
          create actor D as Donald
          Carl->>D: Hi!
          destroy Carl
          Alice-xCarl: We are too many
          destroy Bob
          Bob->>Alice: I agree
      `
      );
    });

    test('should handle complex interactions between different participant types', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
     sequenceDiagram
        box rgb(200,220,255) Authentication
          participant User@{ "type": "actor" }
          participant LoginUI@{ "type": "boundary" }
          participant AuthService@{ "type": "control" }
          participant UserDB@{ "type": "database" }
        end

        box rgb(200,255,220) Order Processing
          participant Order@{ "type": "entity" }
          participant OrderQueue@{ "type": "queue" }
          participant AuditLogs@{ "type": "collections" }
        end

        User ->> LoginUI: Enter credentials
        LoginUI ->> AuthService: Validate
        AuthService ->> UserDB: Query user
        UserDB -->> AuthService: User data

        alt Valid credentials
          AuthService -->> LoginUI: Success
          LoginUI -->> User: Welcome

          par Place order
            User ->> Order: New order
            Order ->> OrderQueue: Process
            and
            Order ->> AuditLogs: Record
          end

          loop Until confirmed
            OrderQueue ->> Order: Update status
            Order -->> User: Notification
          end
        else Invalid credentials
          AuthService --x LoginUI: Failure
          LoginUI --x User: Retry
        end
      `,
        { sequence: { useMaxWidth: false } }
      );
    });

    test('should render parallel processes with different participant types', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
       sequenceDiagram
        participant Customer@{ "type": "actor" }
        participant Frontend@{ "type": "participant" }
        participant PaymentService@{ "type": "boundary" }
        participant InventoryManager@{ "type": "control" }
        participant Order@{ "type": "entity" }
        participant OrdersDB@{ "type": "database" }
        participant NotificationQueue@{ "type": "queue" }

        Customer ->> Frontend: Place order
        Frontend ->> Order: Create order
        par Parallel Processing
          Order ->> PaymentService: Process payment
          and
          Order ->> InventoryManager: Reserve items
        end
        PaymentService -->> Order: Payment confirmed
        InventoryManager -->> Order: Items reserved
        Order ->> OrdersDB: Save finalized order
        OrdersDB -->> Order: Order saved
        Order ->> NotificationQueue: Send confirmation
        NotificationQueue -->> Customer: Order confirmation
      `
      );
    });

    test('should render different participant types with notes and loops', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
    sequenceDiagram
    actor Admin
    participant Dashboard
    participant AuthService@{ "type" : "boundary" }
    participant UserManager@{ "type" : "control" }
    participant UserProfile@{ "type" : "entity" }
    participant UserDB@{ "type" : "database" }
    participant Logs@{ "type" : "database" }
    
    Admin ->> Dashboard: Open user management
    loop Authentication check
      Dashboard ->> AuthService: Verify admin rights
      AuthService ->> Dashboard: Access granted
    end
    Dashboard ->> UserManager: List users
    UserManager ->> UserDB: Query users
    UserDB ->> UserManager: Return user data
    Note right of UserDB: Encrypted data<br/>requires decryption
    UserManager ->> UserProfile: Format profiles
    UserProfile ->> UserManager: Formatted data
    UserManager ->> Dashboard: Display users
    Dashboard ->> Logs: Record access
    Logs ->> Admin: Audit trail
    `
      );
    });

    test('should render different participant types with alternative flows', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
    sequenceDiagram
      actor Client
      participant MobileApp
      participant CloudService@{ "type" : "boundary" }
      participant DataProcessor@{ "type" : "control" }
      participant Transaction@{ "type" : "entity" }
      participant TransactionsDB@{ "type" : "database" }
      participant EventBus@{ "type" : "queue" }
      
      Client ->> MobileApp: Initiate transaction
      MobileApp ->> CloudService: Authenticate
      alt Authentication successful
        CloudService -->> MobileApp: Auth token
        MobileApp ->> DataProcessor: Process data
        DataProcessor ->> Transaction: Create transaction
        Transaction ->> TransactionsDB: Save record
        TransactionsDB -->> Transaction: Confirmation
        Transaction ->> EventBus: Publish event
        EventBus -->> Client: Notification
      else Authentication failed
        CloudService -->> MobileApp: Error
        MobileApp -->> Client: Show error
      end
    `
      );
    });

    test('should render different participant types with wrapping text', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
  sequenceDiagram
      participant B@{ "type" : "boundary" }
      participant C@{ "type" : "control" }
      participant E@{ "type" : "entity" }
      participant DB@{ "type" : "database" }
      participant COL@{ "type" : "collections" }
      participant Q@{ "type" : "queue" }
    
      FE ->> B: Another long message<br/>with explicit<br/>line breaks
      B -->> FE: Response message that is also quite long and needs to wrap
      FE ->> C: Process data
      C ->> E: Validate
      E -->> C: Validation result
      C ->> DB: Save
      DB -->> C: Save result
      C ->> COL: Log
      COL -->> Q: Forward
      Q -->> LongNameUser: Final response with confirmation of all actions taken
    `,
        { sequence: { wrap: true } }
      );
    });

    test('should render long notes left of boundary', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
        participant Alice@{ "type" : "boundary" }
        actor Bob
        Alice->>Bob: Hola
        Note left of Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
        Bob->>Alice: I'm short though
    `,
        {}
      );
    });

    test('should render wrapped long notes left of control', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      participant Alice@{ "type" : "control" }
      actor Bob
      Alice->>Bob: Hola
      Note left of Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
        {}
      );
    });

    test('should render long notes right of entity', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      participant Alice@{ "type" : "entity" }
      actor Bob
      Alice->>Bob: Hola
      Note right of Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
        {}
      );
    });

    test('should render wrapped long notes right of database', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      participant Alice@{ "type" : "database" }
      actor Bob
      Alice->>Bob: Hola
      Note right of Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
        {}
      );
    });

    test('should render long notes over collections', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      participant Alice@{ "type" : "collections" }
      actor Bob
      Alice->>Bob: Hola
      Note over Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
        {}
      );
    });

    test('should render wrapped long notes over queue', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      participant Alice@{ "type" : "queue" }
      actor Bob
      Alice->>Bob: Hola
      Note over Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
        {}
      );
    });

    test('should render notes over actor and boundary', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      actor Alice
      participant Charlie@{ "type" : "boundary" }
      note over Alice: Some note
      note over Charlie: Other note
    `,
        {}
      );
    });

    test('should render long messages from database to collections', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      participant Alice@{ "type" : "database" }
      participant Bob@{ "type" : "collections" }
      Alice->>Bob: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
        {}
      );
    });

    test('should render wrapped long messages from control to entity', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      participant Alice@{ "type" : "control" }
      participant Bob@{ "type" : "entity" }
      Alice->>Bob:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
        {}
      );
    });

    test('should render long messages from queue to boundary', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      participant Alice@{ "type" : "queue" }
      participant Bob@{ "type" : "boundary" }
      Alice->>Bob: I'm short
      Bob->>Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
    `,
        {}
      );
    });

    test('should render wrapped long messages from actor to database', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `
      sequenceDiagram
      actor Alice
      participant Bob@{ "type" : "database" }
      Alice->>Bob: I'm short
      Bob->>Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
    `,
        {}
      );
    });

    test('should render all arrow types with autonumbering', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    Alice->>Bob: Solid arrow (->>)
    Bob-->>Alice: Dotted arrow (-->>)
    Alice->Charlie: Solid open arrow (->)
    Charlie-->Dave: Dotted open arrow (-->)
    Alice-xBob: Solid cross (-x)
    Bob--xAlice: Dotted cross (--x)
    Alice-)Charlie: Solid point async (-)
    Charlie--)Dave: Dotted point async (--)
    Alice<<->>Bob: Bidirectional solid (<<->>)
    Charlie<<-->>Dave: Bidirectional dotted (<<-->>)
    Alice-|\\Bob: Solid top half (-|\\)
    Bob-|/Alice: Solid bottom half (-|/)
    Alice-\\\\Charlie: Stick top half (-\\\\)
    Charlie-//Dave: Stick bottom half (-//)
    Dave/|-Charlie: Solid top reverse (/|-)
    Charlie\\|-Bob: Solid bottom reverse (\\|-)
    Bob//-Alice: Stick top reverse (//-)
    Alice\\\\-Bob: Stick bottom reverse (\\\\-)
    Alice--|\\Bob: Dotted solid top (--|\\)
    Bob--|/Alice: Dotted solid bottom (--|/)
    Alice--\\\\Charlie: Dotted stick top (--\\\\)
    Charlie--//Dave: Dotted stick bottom (--//)
    Dave/|--Charlie: Dotted solid top reverse (/|--)
    Charlie\\|--Bob: Dotted solid bottom reverse (\\|--)
    Bob//--Alice: Dotted stick top reverse (//--)
    Alice\\\\--Bob: Dotted stick bottom reverse (\\\\--)
    Alice->>()Bob: Solid with central connection
    Bob()-->>Alice: Dotted with reverse central
    Alice()->>()Charlie: Dual central connections`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render all arrow types with autonumbering - left to right only', async ({
      page,
    }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    Alice->>Bob: Solid arrow (->>)
    Alice-->>Bob: Dotted arrow (-->>)
    Alice->Bob: Solid open arrow (->)
    Alice-->Bob: Dotted open arrow (-->)
    Alice-xBob: Solid cross (-x)
    Alice--xBob: Dotted cross (--x)
    Alice-)Bob: Solid point async (-)
    Alice--)Bob: Dotted point async (--)
    Alice<<->>Bob: Bidirectional solid (<<->>)
    Alice<<-->>Bob: Bidirectional dotted (<<-->>)
    Alice-|\\Bob: Solid top half (-|\\)
    Alice-|/Bob: Solid bottom half (-|/)
    Alice-\\\\Bob: Stick top half (-\\\\)
    Alice-//Bob: Stick bottom half (-//)
    Bob/|-Alice: Solid top reverse (/|-)
    Bob\\|-Alice: Solid bottom reverse (\\|-)
    Bob//-Alice: Stick top reverse (//-)
    Bob\\\\-Alice: Stick bottom reverse (\\\\-)
    Alice--|\\Bob: Dotted solid top (--|\\)
    Alice--|/Bob: Dotted solid bottom (--|/)
    Alice--\\\\Bob: Dotted stick top (--\\\\)
    Alice--//Bob: Dotted stick bottom (--//)
    Bob/|--Alice: Dotted solid top reverse (/|--)
    Bob\\|--Alice: Dotted solid bottom reverse (\\|--)
    Bob//--Alice: Dotted stick top reverse (//--)
    Bob\\\\--Alice: Dotted stick bottom reverse (\\\\--)
    Alice->>()Bob: Solid with central connection
    Alice()-->>Bob: Dotted with reverse central
    Alice()->>()Bob: Dual central connections`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render bidirectional arrows with autonumbering', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Alice<<->>Bob: Bidirectional solid left to right
    Bob<<->>Alice: Bidirectional solid right to left
    Alice<<-->>Charlie: Bidirectional dotted left to right
    Charlie<<-->>Alice: Bidirectional dotted right to left
    Bob<<->>Charlie: Bidirectional solid
    Charlie<<-->>Bob: Bidirectional dotted`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render reverse arrows with autonumbering', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `%%{init: {'theme':'base'}}%%
sequenceDiagram
    autonumber
    participant Alice
    participant Bob
    participant Charlie
    Bob/|-Alice: Solid top reverse left to right
    Alice/|-Bob: Solid top reverse right to left
    Bob\\|-Alice: Solid bottom reverse left to right
    Alice\\|-Bob: Solid bottom reverse right to left
    Bob//-Alice: Stick top reverse left to right
    Alice//-Bob: Stick top reverse right to left
    Bob\\\\-Alice: Stick bottom reverse left to right
    Alice\\\\-Bob: Stick bottom reverse right to left
    Bob/|--Alice: Dotted solid top reverse
    Alice\\|--Bob: Dotted solid bottom reverse
    Bob//--Alice: Dotted stick top reverse
    Alice\\\\--Bob: Dotted stick bottom reverse`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with normal arrows - without autonumber', async ({
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
    Alice->>Alice: Solid arrow self-reference
    Bob-->>Bob: Dotted arrow self-reference
    Charlie->Charlie: Open arrow self-reference
    Alice-->Alice: Dotted open arrow self-reference
    Bob-xBob: Cross arrow self-reference
    Charlie--xCharlie: Dotted cross self-reference`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with normal arrows - with autonumber', async ({
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
    Alice->>Alice: Solid arrow self-reference
    Bob-->>Bob: Dotted arrow self-reference
    Charlie->Charlie: Open arrow self-reference
    Alice-->Alice: Dotted open arrow self-reference
    Bob-xBob: Cross arrow self-reference
    Charlie--xCharlie: Dotted cross self-reference`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with reverse arrows - without autonumber', async ({
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
      Alice/|-Alice: Solid top reverse self-reference
      Bob\\|-Bob: Solid bottom reverse self-reference
      Charlie//-Charlie: Stick top reverse self-reference
      Alice\\\\-Alice: Stick bottom reverse self-reference
      Bob/|--Bob: Dotted solid top reverse self-reference
      Charlie\\|--Charlie: Dotted solid bottom reverse self-reference
      Alice//--Alice: Dotted stick top reverse self-reference
      Bob\\\\--Bob: Dotted stick bottom reverse self-reference`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with reverse arrows - with autonumber', async ({
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
    Alice/|-Alice: Solid top reverse self-reference
    Bob\\|-Bob: Solid bottom reverse self-reference
    Charlie//-Charlie: Stick top reverse self-reference
    Alice\\\\-Alice: Stick bottom reverse self-reference
    Bob/|--Bob: Dotted solid top reverse self-reference
    Charlie\\|--Charlie: Dotted solid bottom reverse self-reference
    Alice//--Alice: Dotted stick top reverse self-reference
    Bob\\\\--Bob: Dotted stick bottom reverse self-reference`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with bidirectional arrows - without autonumber', async ({
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
    Alice<<->>Alice: Bidirectional solid self-reference
    Bob<<-->>Bob: Bidirectional dotted self-reference
    Charlie<<->>Charlie: Another bidirectional solid
    Alice<<-->>Alice: Another bidirectional dotted`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference with bidirectional arrows - with autonumber', async ({
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
    Alice<<->>Alice: Bidirectional solid self-reference
    Bob<<-->>Bob: Bidirectional dotted self-reference
    Charlie<<->>Charlie: Another bidirectional solid
    Alice<<-->>Alice: Another bidirectional dotted`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render comprehensive self-reference scenario - all arrow types mixed', async ({
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

    Note over Alice,Charlie: Normal arrows
    Alice->>Alice: Normal solid
    Bob-->>Bob: Normal dotted
    Charlie->Charlie: Normal open

    Note over Alice,Charlie: Reverse arrows
    Alice/|-Alice: Reverse solid top
    Bob\\|-Bob: Reverse solid bottom

    Note over Alice,Charlie: Bidirectional arrows
    Charlie<<->>Charlie: Bidirectional solid
    Alice<<-->>Alice: Bidirectional dotted

    Note over Alice,Charlie: Central connections
    Bob->>()Bob: Central at destination
    Charlie()->>Charlie: Central at source
    Alice()->>()Alice: Dual central

    Note over Alice,Charlie: Reverse with central
    Bob()/|-()Bob: Reverse with dual central
    Charlie/|-()Charlie: Reverse with central at destination

    Note over Alice,Charlie: Bidirectional with central
    Alice()<<->>()Alice: Bidirectional with dual central`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });

    test('should render self-reference mixed with regular messages and autonumber', async ({
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

    Alice->>Bob: Regular message
    Bob->>Bob: Self-reference solid
    Bob-->>Charlie: Regular dotted
    Charlie()->>()Charlie: Self-ref dual central
    Charlie->>Alice: Regular back
    Alice<<->>Alice: Self-ref bidirectional
    Alice()->>Bob: Regular with central
    Bob()/|-()Bob: Self-ref reverse dual central
    Bob-->>Alice: Regular dotted back`,
        { sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
      );
    });
  });
});
