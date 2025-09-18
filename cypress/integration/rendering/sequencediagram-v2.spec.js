import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

const looks = ['classic'];
const participantTypes = [
  { type: 'participant', display: 'participant' },
  { type: 'actor', display: 'actor' },
  { type: 'boundary', display: 'boundary' },
  { type: 'control', display: 'control' },
  { type: 'entity', display: 'entity' },
  { type: 'database', display: 'database' },
  { type: 'collections', display: 'collections' },
  { type: 'queue', display: 'queue' },
];

const restrictedTypes = ['boundary', 'control', 'entity', 'database', 'collections', 'queue'];

const interactionTypes = ['->>', '-->>', '->', '-->', '-x', '--x', '->>+', '-->>+'];

const notePositions = ['left of', 'right of', 'over'];

function getParticipantLine(name, type, alias) {
  if (restrictedTypes.includes(type)) {
    return `  participant ${name}@{ "type" : "${type}" }\n`;
  } else if (alias) {
    return `  participant ${name}@{ "type" : "${type}" } \n`;
  } else {
    return `  participant ${name}@{ "type" : "${type}" }\n`;
  }
}

looks.forEach((look) => {
  describe(`Sequence Diagram Tests - ${look} look`, () => {
    it('should render all participant types', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.forEach((pt, index) => {
        const name = `${pt.display}${index}`;
        diagramCode += getParticipantLine(name, pt.type);
      });
      for (let i = 0; i < participantTypes.length - 1; i++) {
        diagramCode += `  ${participantTypes[i].display}${i} ->> ${participantTypes[i + 1].display}${i + 1}: Message ${i}\n`;
      }
      imgSnapshotTest(diagramCode, { look, sequence: { diagramMarginX: 50, diagramMarginY: 10 } });
    });

    it('should render all interaction types', () => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += getParticipantLine('A', 'actor');
      diagramCode += getParticipantLine('B', 'boundary');
      interactionTypes.forEach((interaction, index) => {
        diagramCode += `  A ${interaction} B: ${interaction} message ${index}\n`;
      });
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render participant creation and destruction', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.forEach((pt, index) => {
        const name = `${pt.display}${index}`;
        diagramCode += getParticipantLine('A', pt.type);
        diagramCode += getParticipantLine('B', pt.type);
        diagramCode += `  create participant ${name}@{ "type" : "${pt.type}" }\n`;
        diagramCode += `  A ->> ${name}: Hello ${pt.display}\n`;
        if (index % 2 === 0) {
          diagramCode += `  destroy ${name}\n`;
        }
      });
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render notes in all positions', () => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += getParticipantLine('A', 'actor');
      diagramCode += getParticipantLine('B', 'boundary');
      notePositions.forEach((position, index) => {
        diagramCode += `  Note ${position} A: Note ${position} ${index}\n`;
      });
      diagramCode += `  A ->> B: Message with notes\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render parallel interactions', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.slice(0, 4).forEach((pt, index) => {
        diagramCode += getParticipantLine(`${pt.display}${index}`, pt.type);
      });
      diagramCode += `  par Parallel actions\n`;
      for (let i = 0; i < 3; i += 2) {
        diagramCode += `    ${participantTypes[i].display}${i} ->> ${participantTypes[i + 1].display}${i + 1}: Message ${i}\n`;
        if (i < participantTypes.length - 2) {
          diagramCode += `    and\n`;
        }
      }
      diagramCode += `  end\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render alternative flows', () => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += getParticipantLine('A', 'actor');
      diagramCode += getParticipantLine('B', 'boundary');
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
      participantTypes.slice(0, 3).forEach((pt, index) => {
        diagramCode += getParticipantLine(`${pt.display}${index}`, pt.type);
      });
      diagramCode += `  loop For each participant\n`;
      for (let i = 0; i < 3; i++) {
        diagramCode += `    ${participantTypes[0].display}0 ->> ${participantTypes[1].display}1: Message ${i}\n`;
      }
      diagramCode += `  end\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render boxes around groups', () => {
      let diagramCode = `sequenceDiagram\n`;
      diagramCode += `  box Group 1\n`;
      participantTypes.slice(0, 3).forEach((pt, index) => {
        diagramCode += `    ${getParticipantLine(`${pt.display}${index}`, pt.type)}`;
      });
      diagramCode += `  end\n`;
      diagramCode += `  box rgb(200,220,255) Group 2\n`;
      participantTypes.slice(3, 6).forEach((pt, index) => {
        diagramCode += `    ${getParticipantLine(`${pt.display}${index}`, pt.type)}`;
      });
      diagramCode += `  end\n`;
      diagramCode += `  ${participantTypes[0].display}0 ->> ${participantTypes[3].display}0: Cross-group message\n`;
      imgSnapshotTest(diagramCode, { look });
    });

    it('should render with different font settings', () => {
      let diagramCode = `sequenceDiagram\n`;
      participantTypes.slice(0, 3).forEach((pt, index) => {
        diagramCode += getParticipantLine(`${pt.display}${index}`, pt.type);
      });
      diagramCode += `  ${participantTypes[0].display}0 ->> ${participantTypes[1].display}1: Regular message\n`;
      diagramCode += `  Note right of ${participantTypes[1].display}1: Regular note\n`;
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

    it('should render participant creation and destruction with different types', () => {
      imgSnapshotTest(`
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
      `);
    });

    it('should handle complex interactions between different participant types', () => {
      imgSnapshotTest(
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

    it('should render parallel processes with different participant types', () => {
      imgSnapshotTest(
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
  });
  it('should render different participant types with notes and loops', () => {
    imgSnapshotTest(
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

  it('should render different participant types with alternative flows', () => {
    imgSnapshotTest(
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

  it('should render different participant types with wrapping text', () => {
    imgSnapshotTest(
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

  describe('Sequence Diagram - New Participant Types with Long Notes and Messages', () => {
    it('should render long notes left of boundary', () => {
      imgSnapshotTest(
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

    it('should render wrapped long notes left of control', () => {
      imgSnapshotTest(
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

    it('should render long notes right of entity', () => {
      imgSnapshotTest(
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

    it('should render wrapped long notes right of database', () => {
      imgSnapshotTest(
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

    it('should render long notes over collections', () => {
      imgSnapshotTest(
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

    it('should render wrapped long notes over queue', () => {
      imgSnapshotTest(
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

    it('should render notes over actor and boundary', () => {
      imgSnapshotTest(
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

    it('should render long messages from database to collections', () => {
      imgSnapshotTest(
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

    it('should render wrapped long messages from control to entity', () => {
      imgSnapshotTest(
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

    it('should render long messages from queue to boundary', () => {
      imgSnapshotTest(
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

    it('should render wrapped long messages from actor to database', () => {
      imgSnapshotTest(
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
  });

  describe('svg size', () => {
    it('should render a sequence diagram when useMaxWidth is true (default)', () => {
      renderGraph(
        `
      sequenceDiagram
        actor Alice
        participant Bob@{ "type" : "boundary" }
        participant John@{ "type" : "control" }
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
        participant Bob@{ "type" : "boundary" }
        participant John@{ "type" : "control" }
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

    describe('Central Connection Rendering Tests', () => {
      it('should render central connection circles on actor vertical lines', () => {
        imgSnapshotTest(
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

      it('should render central connections with different arrow types', () => {
        imgSnapshotTest(
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

      it('should render central connections with bidirectional arrows', () => {
        imgSnapshotTest(
          `sequenceDiagram
        participant Alice
        participant Bob
        Alice ()<<->>() Bob: Bidirectional solid
        Alice ()<<-->>() Bob: Bidirectional dotted`,
          { look: 'classic', sequence: { diagramMarginX: 50, diagramMarginY: 10 } }
        );
      });

      it('should render central connections with activations', () => {
        imgSnapshotTest(
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

      it('should render central connections mixed with normal messages', () => {
        imgSnapshotTest(
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

      it('should render central connections with notes', () => {
        imgSnapshotTest(
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

      it('should render central connections with loops and alternatives', () => {
        imgSnapshotTest(
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

      it('should render central connections with different participant types', () => {
        imgSnapshotTest(
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
    });
  });
});
