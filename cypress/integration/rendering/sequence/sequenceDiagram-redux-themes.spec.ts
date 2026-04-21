import { imgSnapshotTest } from '../../../helpers/util.ts';

const reduxThemes = ['redux', 'redux-color', 'redux-dark', 'redux-dark-color'] as const;
const looks = ['neo'] as const;

const complexSequenceDiagram = `
  sequenceDiagram
    box rgb(40,150,150) Authentication
      actor User
      participant LoginUI@{ "type": "boundary" }
      participant AuthService@{ "type": "control" }
      participant UserDB@{ "type": "database" }
    end

    box rgb(200,55,22) Order Processing
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

describe('Sequence Diagram - Redux Themes with Neo Look', () => {
  reduxThemes.forEach((theme) => {
    looks.forEach((look) => {
      describe(`Theme: ${theme}, Look: ${look}`, () => {
        it('should render complex sequence with all features', () => {
          imgSnapshotTest(complexSequenceDiagram, { theme, look });
        });

        it('should render all participant types', () => {
          const diagramCode = `
            sequenceDiagram
              participant P@{ "type": "participant" }
              actor A
              participant B@{ "type": "boundary" }
              participant C@{ "type": "control" }
              participant E@{ "type": "entity" }
              participant D@{ "type": "database" }
              participant Col@{ "type": "collections" }
              participant Q@{ "type": "queue" }

              P ->> A: Message 1
              A ->> B: Message 2
              B ->> C: Message 3
              C ->> E: Message 4
              E ->> D: Message 5
              D ->> Col: Message 6
              Col ->> Q: Message 7
          `;
          imgSnapshotTest(diagramCode, { theme, look });
        });

        it('should render participant creation and destruction', () => {
          const diagramCode = `
            sequenceDiagram
              participant Alice@{ "type": "boundary" }
              Alice->>Bob: Hello Bob, how are you?
              Bob->>Alice: Fine, thank you. And you?
              create participant Carl@{ "type": "control" }
              Alice->>Carl: Hi Carl!
              create actor D as Donald
              Carl->>D: Hi!
              destroy Carl
              Alice-xCarl: We are too many
              destroy Bob
              Bob->>Alice: I agree
          `;
          imgSnapshotTest(diagramCode, { theme, look });
        });

        it('should render with notes and loops', () => {
          const diagramCode = `
            sequenceDiagram
              actor Admin
              participant Dashboard
              participant AuthService@{ "type": "boundary" }
              participant UserManager@{ "type": "control" }
              participant UserProfile@{ "type": "entity" }
              participant UserDB@{ "type": "database" }
              participant Logs@{ "type": "collections" }

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
          `;
          imgSnapshotTest(diagramCode, { theme, look });
        });

        it('should render parallel processes', () => {
          const diagramCode = `
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
          `;
          imgSnapshotTest(diagramCode, { theme, look });
        });
      });
    });
  });
});
