import { imgSnapshotTest } from '../../../helpers/util.ts';

describe('C4 diagram (beta)', () => {
  it('C4B.1 should render a context diagram', () => {
    imgSnapshotTest(
      `
      c4-beta context
      title Internet Banking System - System Context

      person customer "Personal Banking Customer" "A customer of the bank."
      system banking "Internet Banking System" "Allows customers to view accounts and make payments."
      external system mainframe "Mainframe Banking System" "Stores core banking information."
      external system email "E-mail System" "The internal e-mail system."

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
      system banking "Internet Banking System" {
          container spa "Single-Page Application" "Provides banking functionality." "JavaScript/Angular"
          container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC"
          container db "Database" "Stores user credentials." "Oracle 12c"
      }
      external system mainframe "Mainframe Banking System"

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
      system core "Core System" "Main system."
      external system partner "Partner System" :::external

      user --> core : "Uses"
      core <--> partner : "Syncs with" "JSON/HTTPS"
      `,
      {}
    );
  });
});
