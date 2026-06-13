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
});
