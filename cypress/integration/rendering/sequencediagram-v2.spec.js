import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const looks = ['classic'];
const participantTypes = [
  'participant',
  'actor',
  'boundary',
  'control',
  'entity',
  'database',
  'collections',
  'queue',
];

const interactionTypes = [
  '->>', // Solid arrow with arrowhead
  '-->>', // Dotted arrow with arrowhead
  '->', // Solid arrow without arrowhead
  '-->', // Dotted arrow without arrowhead
  '-x', // Solid arrow with cross
  '--x', // Dotted arrow with cross
  '->>+', // Solid arrow with arrowhead (activate)
  '-->>+', // Dotted arrow with arrowhead (activate)
];

const notePositions = ['left of', 'right of', 'over'];

looks.forEach((look) => {
  describe(`Sequence Diagram Tests - ${look} look`, () => {
    it('should render all participant types', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.forEach((type, index) => {
        diagramCode += `  ${type} ${type}${index} as ${type} ${index}\n`;
      });
      // Add some basic interactions
      for (let i = 0; i < participantTypes.length - 1; i++) {
        diagramCode += `  ${participantTypes[i]}${i} ->> ${participantTypes[i + 1]}${i + 1}: Message ${i}\n`;
      }
      imgSnapshotTest(diagramCode, { look, sequence: { diagramMarginX: 50, diagramMarginY: 10 } });
    });

    it('should render all interaction types', () => {
      let diagramCode = `sequenceDiagram\n`;
      // Create two participants
      // Add all interaction types
      diagramCode += `  participant A\n`;
      diagramCode += `  participant B\n`;
      interactionTypes.forEach((interaction, index) => {
        diagramCode += `  A ${interaction} B: ${interaction} message ${index}\n`;
      });
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render participant creation and destruction', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.forEach((type, index) => {
        diagramCode += `  ${type} A\n`;
        diagramCode += `  ${type} B\n`;
        diagramCode += `  create ${type} ${type}${index}\n`;
        diagramCode += `  A ->> ${type}${index}: Hello ${type}\n`;
        if (index % 2 === 0) {
          diagramCode += `  destroy ${type}${index}\n`;
        }
      });
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render notes in all positions', () => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += `  participant A\n`;
      diagramCode += `  participant B\n`;
      notePositions.forEach((position, index) => {
        diagramCode += `  Note ${position} A: Note ${position} ${index}\n`;
      });
      diagramCode += `  A ->> B: Message with notes\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render parallel interactions', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.slice(0, 4).forEach((type, index) => {
        diagramCode += `  ${type} ${type}${index}\n`;
      });
      diagramCode += `  par Parallel actions\n`;
      for (let i = 0; i < participantTypes.length - 1; i += 2) {
        diagramCode += `    ${participantTypes[i]}${i} ->> ${participantTypes[i + 1]}${i + 1}: Message ${i}\n`;
        if (i < participantTypes.length - 2) {
          diagramCode += `    and\n`;
        }
      }
      diagramCode += `  end\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render alternative flows', () => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += `  participant A\n`;
      diagramCode += `  participant B\n`;
      diagramCode += `  alt Successful case\n`;
      diagramCode += `    A ->> B: Request\n`;
      diagramCode += `    B -->> A: Success\n`;
      diagramCode += `  else Failure case\n`;
      diagramCode += `    A ->> B: Request\n`;
      diagramCode += `    B --x A: Failure\n`;
      diagramCode += `  end\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render loops', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.slice(0, 3).forEach((type, index) => {
        diagramCode += `  ${type} ${type}${index}\n`;
      });
      diagramCode += `  loop For each participant\n`;
      for (let i = 0; i < 3; i++) {
        diagramCode += `    ${participantTypes[0]}0 ->> ${participantTypes[1]}1: Message ${i}\n`;
      }
      diagramCode += `  end\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render boxes around groups', () => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += `  box Group 1\n`;
      participantTypes.slice(0, 3).forEach((type, index) => {
        diagramCode += `    ${type} ${type}${index}\n`;
      });
      diagramCode += `  end\n`;
      diagramCode += `  box rgb(200,220,255) Group 2\n`;
      participantTypes.slice(3, 6).forEach((type, index) => {
        diagramCode += `    ${type} ${type}${index}\n`;
      });
      diagramCode += `  end\n`;
      // Add some interactions
      diagramCode += `  ${participantTypes[0]}0 ->> ${participantTypes[3]}0: Cross-group message\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render with different font settings', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.slice(0, 3).forEach((type, index) => {
        diagramCode += `  ${type} ${type}${index}\n`;
      });
      diagramCode += `  ${participantTypes[0]}0 ->> ${participantTypes[1]}1: Regular message\n`;
      diagramCode += `  Note right of ${participantTypes[1]}1: Regular note\n`;
      imgSnapshotTest(diagramCode, {
        look,
        sequence: {
          actorFontFamily: 'courier',
          actorFontSize: 14,
          messageFontFamily: 'Arial',
          messageFontSize: 12,
          noteFontFamily: 'times',
          noteFontSize: 16,
          noteAlign: 'left',
        },
      });
    });
  });
});

// Additional tests for specific combinations
describe('Sequence Diagram Special Cases', () => {
  it('should render complex sequence with all features', () => {
    const diagramCode = `
      sequenceDiagram
        box rgb(200,220,255) Authentication
          actor User
          boundary LoginUI
          control AuthService
          database UserDB
        end
        
        box rgb(200,255,220) Order Processing
          entity Order
          queue OrderQueue
          collections AuditLogs
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
    `;
    imgSnapshotTest(diagramCode, {});
  });

  it('should render with wrapped messages and notes', () => {
    const diagramCode = `
      sequenceDiagram
        participant A
        participant B
        
        A ->> B: This is a very long message that should wrap properly in the diagram rendering
        Note over A,B: This is a very long note that should also wrap properly when rendered in the diagram
        
        par Wrapped parallel
          A ->> B: Parallel message 1<br>with explicit line break
          and
          B ->> A: Parallel message 2<br>with explicit line break
        end
        
        loop Wrapped loop
          Note right of B: This is a long note<br>in a loop
          A ->> B: Message in loop
        end
    `;
    imgSnapshotTest(diagramCode, { sequence: { wrap: true } });
  });
  describe('Sequence Diagram Rendering with Different Participant Types', () => {
    it('should render a sequence diagram with various participant types', () => {
      imgSnapshotTest(
        `
      sequenceDiagram
        actor User
        participant AuthService as Authentication Service
        boundary UI
        control OrderController
        entity Product
        database MongoDB
        collections Products
        queue OrderQueue
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

    it('should render participant creation and destruction with different types', () => {
      imgSnapshotTest(
        `
    sequenceDiagram
      actor Customer
      participant Frontend
      boundary PaymentGateway
      Customer ->> Frontend: Place order
      Frontend ->> OrderProcessor: Process order
      create database OrderDB
      OrderProcessor ->> OrderDB: Save order
      `
      );
    });

    it('should handle complex interactions between different participant types', () => {
      imgSnapshotTest(
        `
      sequenceDiagram
    box rgba(200,220,255,0.5) System Components
    actor User
    boundary WebUI
    control API
    entity BusinessLogic
    database MainDB
    end
    box rgba(200,255,220,0.5) External Services
    queue MessageQueue
    database AuditLogs
    end

    User ->> WebUI: Submit request
    WebUI ->> API: Process request
    API ->> BusinessLogic: Execute business rules
    BusinessLogic ->> MainDB: Query data
    MainDB -->> BusinessLogic: Return results
    BusinessLogic ->> MessageQueue: Publish event
    MessageQueue -->> AuditLogs: Store audit trail
    AuditLogs -->> API: Audit complete
    API -->> WebUI: Return response
    WebUI -->> User: Show results
      `,
        { sequence: { useMaxWidth: false } }
      );
    });

    it('should render parallel processes with different participant types', () => {
      imgSnapshotTest(
        `
      sequenceDiagram
        actor Customer
        participant Frontend
        boundary PaymentService
        control InventoryManager
        entity Order
        database OrdersDB
        queue NotificationQueue
        
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

    it('should render different participant types with notes and loops', () => {
      imgSnapshotTest(
        `
    sequenceDiagram
    actor Admin
    participant Dashboard
    boundary AuthService
    control UserManager
    entity UserProfile
    database UserDB
    database Logs
    
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

    it('should render different participant types with alternative flows', () => {
      imgSnapshotTest(
        `
      sequenceDiagram
        actor Client
        participant MobileApp
        boundary CloudService
        control DataProcessor
        entity Transaction
        database TransactionsDB
        queue EventBus
        
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

    it('should render different participant types with wrapping text', () => {
      imgSnapshotTest(
        `
      sequenceDiagram
        actor LongNameUser as User With A Very<br/>Long Name
        participant FE as Frontend Service<br/>With Long Name
        boundary B as Boundary With<br/>Multiline Name
        control C as Control With<br/>Multiline Name
        entity E as Entity With<br/>Multiline Name
        database DB as Database With<br/>Multiline Name
        collections COL as Collections With<br/>Multiline Name
        queue Q as Queue With<br/>Multiline Name
        
        LongNameUser ->> FE: This is a very long message that should wrap properly in the diagram
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
    describe('Sequence Diagram - New Participant Types with Long Notes and Messages', () => {
      it('should render long notes left of boundary', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      boundary Alice
      actor Bob
      Alice->>Bob: Hola
      Note left of Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
          {}
        );
      });

      it('should render wrapped long notes left of control', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      control Alice
      actor Bob
      Alice->>Bob: Hola
      Note left of Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
          {}
        );
      });

      it('should render long notes right of entity', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      entity Alice
      actor Bob
      Alice->>Bob: Hola
      Note right of Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
          {}
        );
      });

      it('should render wrapped long notes right of database', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      database Alice
      actor Bob
      Alice->>Bob: Hola
      Note right of Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
          {}
        );
      });

      it('should render long notes over collections', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      collections Alice
      actor Bob
      Alice->>Bob: Hola
      Note over Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
          {}
        );
      });

      it('should render wrapped long notes over queue', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      queue Alice
      actor Bob
      Alice->>Bob: Hola
      Note over Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
          {}
        );
      });

      it('should render notes over actor and boundary', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      actor Alice
      boundary Charlie
      note over Alice: Some note
      note over Charlie: Other note
    `,
          {}
        );
      });

      it('should render long messages from database to collections', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      database Alice
      collections Bob
      Alice->>Bob: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
          {}
        );
      });

      it('should render wrapped long messages from control to entity', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      control Alice
      entity Bob
      Alice->>Bob:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
      Bob->>Alice: I'm short though
    `,
          {}
        );
      });

      it('should render long messages from queue to boundary', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      queue Alice
      boundary Bob
      Alice->>Bob: I'm short
      Bob->>Alice: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
    `,
          {}
        );
      });

      it('should render wrapped long messages from actor to database', () => {
        imgSnapshotTest(
          `
      sequenceDiagram
      actor Alice
      database Bob
      Alice->>Bob: I'm short
      Bob->>Alice:wrap: Extremely utterly long line of longness which had previously overflown the actor box as it is much longer than what it should be
    `,
          {}
        );
      });
    });
  });

  describe('svg size', () => {
    it('should render a sequence diagram when useMaxWidth is true (default)', () => {
      renderGraph(
        `
      sequenceDiagram
        actor Alice
        boundary Bob
        control John as John<br/>Second Line
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
        const style = svg.attr('style');
        expect(style).to.match(/^max-width: [\d.]+px;$/);
        const maxWidthValue = parseFloat(style.match(/[\d.]+/g).join(''));
        expect(maxWidthValue).to.be.within(820 * 0.95, 820 * 1.05);
      });
    });

    it('should render a sequence diagram when useMaxWidth is false', () => {
      renderGraph(
        `
      sequenceDiagram
        actor Alice
        boundary Bob
        control John as John<br/>Second Line
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
        expect(width).to.be.within(820 * 0.95, 820 * 1.05);
        expect(svg).to.not.have.attr('style');
      });
    });
  });
});
