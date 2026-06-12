import { imgSnapshotTest } from '../../../helpers/util.ts';

const unified = { c4: { useUnifiedRenderer: true } };

describe('C4 diagram (unified renderer)', () => {
  it('C4U.1 should render a C4Context diagram with nested boundaries', () => {
    imgSnapshotTest(
      `
      C4Context
      title System Context diagram for Internet Banking System

      Enterprise_Boundary(b0, "BankBoundary0") {
          Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")

          System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

          Enterprise_Boundary(b1, "BankBoundary") {
            System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
          }
        }

      BiRel(customerA, SystemAA, "Uses")
      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
      Rel(SystemC, customerA, "Sends e-mails to")
      `,
      unified
    );
  });
  it('C4U.2 should render element styles applied via UpdateElementStyle and UpdateRelStyle', () => {
    imgSnapshotTest(
      `
      C4Context
      Person(customerA, "Banking Customer A", "A customer of the bank.")
      System(SystemAA, "Internet Banking System", "Allows customers to make payments.")
      Rel(customerA, SystemAA, "Uses")
      UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
      UpdateRelStyle(customerA, SystemAA, $textColor="blue", $lineColor="blue")
      `,
      unified
    );
  });
  it('C4U.3 should render db and queue shape variants', () => {
    imgSnapshotTest(
      `
      C4Container
      Person(customer, "Customer", "A customer of the bank.")
      Container(spa, "Single-Page App", "JavaScript, Angular", "Provides banking functionality.")
      ContainerDb(database, "Database", "Oracle 12c", "Stores user information.")
      ContainerQueue(queue, "Queue", "RabbitMQ", "Transaction events.")
      Rel(customer, spa, "Uses", "HTTPS")
      Rel(spa, database, "Reads from and writes to", "SQL/TCP")
      Rel(spa, queue, "Publishes to", "AMQP")
      `,
      unified
    );
  });
  it('C4U.4 should render a deployment diagram with nested deployment nodes', () => {
    imgSnapshotTest(
      `
      C4Deployment
      title Deployment Diagram for Internet Banking System

      Deployment_Node(aws, "Amazon Web Services", "Cloud") {
        Deployment_Node(ec2, "EC2", "Ubuntu 22.04") {
          Container(api, "API Application", "Java, Spring", "Provides banking functionality via API.")
        }
        Deployment_Node(rds, "RDS", "Oracle 12c") {
          ContainerDb(db, "Database", "Oracle", "Stores user information.")
        }
      }
      Rel(api, db, "Reads from and writes to", "SQL/TCP")
      `,
      unified
    );
  });
  it('C4U.5 should keep the rendered diagram within sane dimensions', () => {
    imgSnapshotTest(
      `
      C4Context
      Enterprise_Boundary(b0, "BankBoundary0") {
        Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")
        System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
      }
      BiRel(customerA, SystemAA, "Uses")
      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
      `,
      unified
    );
    cy.get('svg')
      .last()
      .should((svg) => {
        const [, , width, height] = svg.attr('viewBox').split(' ').map(Number);
        // Guard against the layout blowup seen in earlier rewrite attempts
        expect(width).to.be.lessThan(2200);
        expect(height).to.be.lessThan(2200);
      });
  });
  it('C4U.7 should style elements and rels via AddElementTag and AddRelTag', () => {
    imgSnapshotTest(
      `
      C4Context
      AddElementTag(deprecated, $bgColor="grey", $fontColor="white", $borderColor="red")
      AddRelTag(async, $textColor="green", $lineColor="green")
      Person(customerA, "Banking Customer A", "A customer of the bank.")
      System(SystemAA, "Internet Banking System", "Allows customers to make payments.", $tags="deprecated")
      Rel(customerA, SystemAA, "Uses", $tags="async")
      `,
      unified
    );
  });
});
