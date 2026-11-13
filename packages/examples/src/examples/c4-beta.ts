import type { DiagramMetadata } from '../types.js';

export default {
  id: 'c4beta',
  name: 'C4 Diagram (beta)',
  description: 'Visualize software architecture with the C4 model',
  examples: [
    {
      title: 'System Context',
      isDefault: true,
      code: `c4-beta context
title Internet Banking System - System Context

person customer "Personal Banking Customer" "A customer of the bank."
softwareSystem banking "Internet Banking System" "Allows customers to view accounts and make payments."
softwareSystem mainframe "Mainframe Banking System" "Stores core banking information." :::external
softwareSystem email "E-mail System" "The internal e-mail system." :::external

customer --> banking : "Views accounts using"
banking --> mainframe : "Gets account information from" "XML/HTTPS"
banking --> email : "Sends e-mail using" "SMTP"
email --> customer : "Sends e-mails to"`,
    },
    {
      title: 'Container Diagram',
      code: `c4-beta container
title Internet Banking System - Containers

person customer "Personal Banking Customer"
softwareSystem banking "Internet Banking System" {
    container spa "Single-Page Application" "Provides banking functionality." "JavaScript/Angular"
    container api "API Application" "Provides a JSON/HTTPS API." "Java/Spring MVC"
    container db "Database" "Stores user credentials." "Oracle 12c"
}
softwareSystem mainframe "Mainframe Banking System" :::external

customer --> spa : "Views account balances using" "HTTPS"
spa --> api : "Makes API calls to" "JSON/HTTPS"
api --> db : "Reads from and writes to" "SQL/TCP"
api --> mainframe : "Makes API calls to" "XML/HTTPS"`,
    },
  ],
} satisfies DiagramMetadata;
