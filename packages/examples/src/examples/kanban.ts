import type { DiagramMetadata } from '../types.js';

export default {
  id: 'kanban',
  name: 'Kanban Diagram',
  description: 'Visualize work items in a Kanban board',
  examples: [
    {
      title: 'Mermaid Sprint Board',
      isDefault: true,
      code: `---
config:
  kanban:
    ticketBaseUrl: 'https://github.com/mermaid-js/mermaid/issues/#TICKET#'
---
kanban
  todo[Todo]
    docs[Create documentation]
    blog[Write blog post about the new diagram]@{ priority: 'Low' }
  inProgress[In progress]
    renderer[Improve renderer for edge cases]@{ assigned: 'knsv', priority: 'High' }
  readyForTest[Ready for test]
    parserTests[Create parsing tests]@{ ticket: 2038, assigned: 'K.Sveidqvist', priority: 'High' }
  done[Done]
    grammar[Design grammar]@{ assigned: 'knsv' }
    longTitle[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: 2036, priority: 'Very High' }
    dbFunction[Update DB function]@{ ticket: 2037, assigned: 'knsv', priority: 'High' }`,
    },
    {
      title: 'Personal Task Board',
      code: `kanban
  Todo
    [Buy groceries]
    [Book dentist appointment]
  [In progress]
    [Plan weekend trip]
  Done
    [Pay electricity bill]
    [Renew gym membership]`,
    },
  ],
} satisfies DiagramMetadata;
