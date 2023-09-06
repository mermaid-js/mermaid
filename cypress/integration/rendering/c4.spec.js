import { imgSnapshotTest, renderGraph } from '../../helpers/util.ts';

describe('C4 diagram', () => {
  it('should render a simple C4Context diagram', () => {
    imgSnapshotTest(
      `
      C4Context
      accTitle: C4 context demo
      accDescr: Many large C4 diagrams

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

      UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
      UpdateRelStyle(customerA, SystemAA, $textColor="blue", $lineColor="blue", $offsetX="5")
      UpdateRelStyle(SystemC, customerA, $textColor="red", $lineColor="red", $offsetX="-50", $offsetY="20")
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render a simple C4Container diagram', () => {
    imgSnapshotTest(
      `
      C4Container
      title Container diagram for Internet Banking System

      System_Ext(email_system, "E-Mail System", "The internal Microsoft Exchange system", $tags="v1.0")
      Person(customer, Customer, "A customer of the bank, with personal bank accounts", $tags="v1.0")

      Container_Boundary(c1, "Internet Banking") {
          Container(spa, "Single-Page App", "JavaScript, Angular", "Provides all the Internet banking functionality to customers via their web browser")
      }

      Rel(customer, spa, "Uses", "HTTPS")
      Rel(email_system, customer, "Sends e-mails to")
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render a simple C4Component diagram', () => {
    imgSnapshotTest(
      `
      C4Component
      title Component diagram for Internet Banking System - API Application

      Container(spa, "Single Page Application", "javascript and angular", "Provides all the internet banking functionality to customers via their web browser.")

      Container_Boundary(api, "API Application") {
        Component(sign, "Sign In Controller", "MVC Rest Controller", "Allows users to sign in to the internet banking system")
      }

      Rel_Back(spa, sign, "Uses", "JSON/HTTPS")
      UpdateRelStyle(spa, sign, $offsetY="-40")
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render a simple C4Dynamic diagram', () => {
    imgSnapshotTest(
      `
      C4Dynamic
      title Dynamic diagram for Internet Banking System - API Application

      ContainerDb(c4, "Database", "Relational Database Schema", "Stores user registration information, hashed authentication credentials, access logs, etc.")
      Container(c1, "Single-Page Application", "JavaScript and Angular", "Provides all of the Internet banking functionality to customers via their web browser.")
      Container_Boundary(b, "API Application") {
        Component(c3, "Security Component", "Spring Bean", "Provides functionality Related to signing in, changing passwords, etc.")
        Component(c2, "Sign In Controller", "Spring MVC Rest Controller", "Allows users to sign in to the Internet Banking System.")
      }
      Rel(c1, c2, "Submits credentials to", "JSON/HTTPS")
      Rel(c2, c3, "Calls isAuthenticated() on")
      Rel(c3, c4, "select * from users where username = ?", "JDBC")

      UpdateRelStyle(c1, c2, $textColor="red", $offsetY="-40")
      UpdateRelStyle(c2, c3, $textColor="red", $offsetX="-40", $offsetY="60")
      UpdateRelStyle(c3, c4, $textColor="red", $offsetY="-40", $offsetX="10")
      `,
      {}
    );
    cy.get('svg');
  });
  it('should render a simple C4Deployment diagram', () => {
    imgSnapshotTest(
      `
      C4Deployment
      title Deployment Diagram for Internet Banking System - Live

      Deployment_Node(mob, "Customer's mobile device", "Apple IOS or Android"){
          Container(mobile, "Mobile App", "Xamarin", "Provides a limited subset of the Internet Banking functionality to customers via their mobile device.")
      }

      Deployment_Node(plc, "Big Bank plc", "Big Bank plc data center"){
          Deployment_Node(dn, "bigbank-api*** x8", "Ubuntu 16.04 LTS"){
              Deployment_Node(apache, "Apache Tomcat", "Apache Tomcat 8.x"){
                  Container(api, "API Application", "Java and Spring MVC", "Provides Internet Banking functionality via a JSON/HTTPS API.")
              }
          }
      }

      Rel(mobile, api, "Makes API calls to", "json/HTTPS")
      `,
      {}
    );
    cy.get('svg');
  });
});
