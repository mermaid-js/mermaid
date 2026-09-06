import { test } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

test.describe('Domain Storytelling Diagram', () => {
  test('1: should render a simple domain story', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta
A_Customer : 01 -- "places" -> W_Order
A_Service : 02 -- "processes" -> W_Order
      `
    );
  });

  test('2: should render actors and work objects with icons and labels', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta
A_Customer "Customer" person
A_System "System" system
W_Order "Order" document
W_Payment "Payment" folder

A_Customer : 01 -- "places" -> W_Order
A_System : 02 -- "processes" -> W_Payment
      `
    );
  });

  test('3: should render groups with members', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta
W_Order document
W_Package folder
group G_Frontend "Customer Area"
group G_Backoffice "Backoffice"

A_Customer person in G_Frontend
A_SalesClerk person in G_Backoffice
A_Warehouse system in G_Backoffice

A_Customer : 01 -- "places" -> W_Order
A_SalesClerk : 02 -- "processes" -> W_Order
A_Warehouse : 03 -- "packs" -> W_Package -- "for" -> W_Order
      `
    );
  });

  test('4: should render nested groups', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta
W_Task document
W_Build folder
W_Report info
group G_Company "Company"
group G_Engineering "Engineering" in G_Company
group G_QA "Quality Assurance" in G_Company

A_Manager people in G_Company
A_Dev person in G_Engineering
A_QA person in G_QA

A_Manager : 01 -- "assigns" -> W_Task
A_Dev : 02 -- "implements" -> W_Task -- "produces" -> W_Build
A_QA : 03 -- "verifies" -> W_Build -- "writes" -> W_Report
      `
    );
  });

  test('5: should render group block with member sentences', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta

group G_Backoffice "Backoffice" {
  A_SalesClerk : 01 -- "creates" -> W_Order
  A_Warehouse : 02 -- "packs" -> W_Package
  A_Warehouse : 03 -- "labels" -> W_Label in G_Logistics
}

group G_Logistics "Logistics"

A_Shipping : 04 -- "ships" -> W_Package
      `
    );
  });

  test('6: should render mixed continuation segments', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta
A_D : 01 -- "collaborates on" -> W_W <- "collaborates on" -- A_E <- "collaborates on" -- A_F
A_D : 02 -- "works on" -> W_X -- "using" -> W_Y -- "writing" -> W_Z
      `
    );
  });

  test('7: should render annotations on actors, groups, sentences, and work objects', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta
group G_Service "Service Desk"
A_Agent "Support Agent" in G_Service
A_Customer "Customer"

A_Customer : 01 -- "reports" -> W_Ticket id S_ReportTicket
A_Agent : 02 -- "triages" -> W_Backlog id S_Triage
A_Agent : 03 -- "updates" -> W_Ticket id S_UpdateTicket
A_Agent : 03 -- "closes" -> W_Ticket id S_CloseTicket

annotate actor A_Agent "Handles edge cases and escalation."

annotate group G_Service "Team policy and context."

annotate sentence 01 "Initial ticket creation."

annotate sentence S_CloseTicket "Closing path uses sentence id."

annotate workobject W_Ticket@01 "Initial ticket instance."

annotate workobject W_Ticket@S_CloseTicket "Closed ticket instance."
      `
    );
  });

  test('8: should render with custom domainstorytelling config and title', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
---
title: Going to the movies
config:
  domainstorytelling:
    rankdir: TB
    nodeSpacing: 50
    rankSpacing: 100
---
domainstorytelling-beta

A_Cashier "Cashier" person
A_Moviegoer "Moviegoer" person
A_Usher "Usher" person
W_Ticket "Ticket" document

group G_TicketSales "Ticket Sales" {
  A_Moviegoer : 01 -- "buys" -> W_Ticket -- "from" -> A_Cashier
}

group G_Entrance "Entrance Control" {
  A_Moviegoer : 02 -- "shows" -> W_Ticket -- "to" -> A_Usher
  A_Usher : 03 -- "checks" -> W_Ticket
}
      `
    );
  });

  test('9: should render actors and work objects without prior declaration', async ({
    page,
  }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta
A_Anna : 01 -- "writes" -> W_Email -- "to" -> A_Bob
A_Bob : 02 -- "replies to" -> W_Email
      `
    );
  });

  test('10: should render all built-in notation icons', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `domainstorytelling-beta
A_Customer "Customer" person
A_SupportTeam "Support Team" people
A_CRM "CRM System" system
W_Request "Request" conversation
W_Call "Phone Call" call
W_Mail "Confirmation Mail" email
W_Case "Support Case" document
W_Archive "Case Archive" folder
W_Notice "Status Notice" info

A_Customer : 01 -- "starts" -> W_Request
A_Customer : 02 -- "makes" -> W_Call -- "answered by" -> A_SupportTeam
A_SupportTeam : 03 -- "records" -> W_Case -- "in" -> A_CRM
A_CRM : 04 -- "sends" -> W_Mail -- "to" -> A_Customer
A_SupportTeam : 05 -- "files" -> W_Case -- "into" -> W_Archive
A_CRM : 06 -- "publishes" -> W_Notice
      `
    );
  });

  test('11: should render with the ELK layout (config.layout: elk)', async ({ page }, testInfo) => {
    await imgSnapshotTest(
      page,
      testInfo,
      `
---
title: Service Desk — ELK layout
config:
  layout: elk
---
domainstorytelling-beta
group G_Service "Service Desk"
group G_Engineering "Engineering"

A_Customer "Customer" person in G_Service
A_Agent "Support Agent" person in G_Service
A_Engineer "Engineer" person in G_Engineering
W_Ticket "Ticket" document
W_Fix "Fix" info

A_Customer : 01 -- "reports" -> W_Ticket in G_Service -- "to" -> A_Agent id S_Report
A_Agent : 02 -- "escalates" -> W_Ticket -- "to" -> A_Engineer id S_Escalate
A_Engineer : 03 -- "implements" -> W_Fix in G_Engineering -- "for" -> W_Ticket in G_Engineering id S_Fix

annotate actor A_Engineer "Owns root-cause analysis and the fix."

annotate sentence 01 "Entry point of the story."
      `
    );
  });
});
