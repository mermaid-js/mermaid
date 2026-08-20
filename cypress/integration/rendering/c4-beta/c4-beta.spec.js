import { imgSnapshotTest } from '../../../helpers/util.ts';

describe('C4 diagram (beta)', () => {
  it('C4B.1 should render a context diagram', () => {
    imgSnapshotTest(
      `
      c4-beta context
      title Internet Banking System - System Context

      person customer "Personal Banking Customer" "A customer of the bank."
      softwareSystem banking "Internet Banking System" "Allows customers to view accounts and make payments."
      softwareSystem mainframe "Mainframe Banking System" "Stores core banking information." :::external
      softwareSystem email "E-mail System" "The internal e-mail system." :::external

      customer --> banking : "Views accounts using"
      banking --> mainframe : "Gets account information from" "XML/HTTPS"
      banking --> email : "Sends e-mail using" "SMTP"
      email --> customer : "Sends e-mails to"
      `,
      {}
    );
  });
  it('C4B.2 should render a container diagram with a nested boundary', () => {
    imgSnapshotTest(
      `
      c4-beta container
      title Internet Banking System - Containers

      person customer "Personal Banking Customer"
      softwareSystem banking "Internet Banking System" {
          container spa "Single-Page Application" "Provides banking functionality." "JavaScript/Angular"
          container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC"
          container db "Database" "Stores user credentials." "Oracle 12c"
      }
      softwareSystem mainframe "Mainframe Banking System" :::external

      customer --> spa : "Uses" "HTTPS"
      spa --> api : "Makes API calls to" "JSON/HTTPS"
      api --> db : "Reads from and writes to" "SQL/TCP"
      api --> mainframe : "Makes API calls to" "XML/HTTPS"
      `,
      {}
    );
  });
  it('C4B.3 should render bidirectional relationships and tags syntax', () => {
    imgSnapshotTest(
      `
      c4-beta context
      person user "User"
      softwareSystem core "Core System" "Main system."
      softwareSystem partner "Partner System" :::external

      user --> core : "Uses"
      core <--> partner : "Syncs with" "JSON/HTTPS"
      `,
      {}
    );
  });
  it('C4B.4 should render a dynamic diagram with numbered steps', () => {
    imgSnapshotTest(
      `
      c4-beta dynamic
      title Internet Banking System - Sign In

      container spa "Single-Page Application" "" "JavaScript/Angular"
      container api "API Application" "" "Java/Spring MVC"
      container db "Database" "" "Oracle 12c"

      spa --> api : "Submits credentials to" "JSON/HTTPS"
      api --> db : "Calls select * from users" "SQL/TCP"
      db --> api : "Returns user data to"
      4: api --> spa : "Sends back an authentication token to"
      `,
      {}
    );
  });
  it('C4B.5 should render a deployment diagram with nested nodes', () => {
    imgSnapshotTest(
      `
      c4-beta deployment
      title Internet Banking System - Deployment

      deploymentNode aws "Amazon Web Services" "" "AWS" {
          deploymentNode region "US-East-1" "" "AWS Region" {
              deploymentNode ecs "ECS Cluster" "" "AWS ECS" {
                  container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC"
              }
              deploymentNode rds "Database Server" "" "AWS RDS" {
                  container db "Database" "Stores user credentials." "Oracle 12c"
              }
          }
      }

      api --> db : "Reads from and writes to" "SQL/TCP"
      `,
      {}
    );
  });
  it('C4B.6 should render tag styles from style statements', () => {
    imgSnapshotTest(
      `
      c4-beta container
      style database shape:cylinder
      style async line:dashed
      style team-a fill:#1F2937, stroke:#111827

      container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC" :::team-a
      container db "Database" "Stores user credentials." "Oracle 12c" :::database

      api --> db : "Reads from and writes to" "SQL/TCP" :::async
      `,
      {}
    );
  });
  it('C4B.7 should render the live deployment example with instances and an infrastructure node', () => {
    imgSnapshotTest(
      `
      c4-beta deployment
      title Internet Banking System - Live Deployment

      deploymentNode mobile "Customer's mobile device" "" "Apple iOS" {
          container mobileApp "Mobile App" "Provides banking features." "Xamarin"
      }
      deploymentNode computer "Customer's computer" "" "Microsoft Windows or Apple macOS" {
          deploymentNode browser "Web Browser" "" "Chrome, Firefox, Safari or Edge" {
              container spa "Single-Page App" "Provides banking features." "JavaScript/Angular"
          }
      }
      deploymentNode dc "Big Bank plc data center" "" "Big Bank plc" {
          infrastructureNode lb "Load Balancer" "Routes requests to the web and API tiers." "nginx"
          deploymentNode webNode "bigbank-web***" "" "Ubuntu 16.04 LTS" instances "4" {
              deploymentNode webTomcat "Apache Tomcat" "" "Apache Tomcat 8.x" {
                  container webApp "Web Application" "Delivers the static content and the SPA." "Java/Spring MVC"
              }
          }
          deploymentNode apiNode "bigbank-api***" "" "Ubuntu 16.04 LTS" instances "8" {
              deploymentNode apiTomcat "Apache Tomcat" "" "Apache Tomcat 8.x" {
                  container apiApp "API Application" "Provides banking features via a JSON/HTTPS API." "Java/Spring MVC"
              }
          }
          deploymentNode db01 "bigbank-db01" "" "Ubuntu 16.04 LTS" {
              deploymentNode oraclePrimary "Oracle - Primary" "" "Oracle 12c" {
                  container dbPrimary "Database" "Stores user accounts and transactions." "Oracle 12c"
              }
          }
          deploymentNode db02 "bigbank-db02" "" "Ubuntu 16.04 LTS" instances "0..1" {
              deploymentNode oracleSecondary "Oracle - Secondary" "" "Oracle 12c" {
                  container dbSecondary "Database" "Stores user accounts and transactions." "Oracle 12c"
              }
          }
      }

      mobileApp --> lb : "Makes API calls to" "json/HTTPS"
      spa --> lb : "Makes API calls to" "json/HTTPS"
      lb --> webApp : "Forwards requests to" "HTTPS"
      lb --> apiApp : "Forwards requests to" "HTTPS"
      apiApp --> dbPrimary : "Reads from and writes to" "JDBC"
      dbPrimary --> dbSecondary : "Replicates data to"
      `,
      {}
    );
  });
});
