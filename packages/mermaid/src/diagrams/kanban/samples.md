```mermaid
kanban
  New
    Sometimes wrong Shape type is highlighted
  In progress


```

```mermaid
kanban
  Todo
    Create JISON
    Update DB function
    Create parsing tests
    define getData
    Create renderer
  In progress
    Design grammar

```

Adding ID

```mermaid
kanban
  id1[Todo]
    id2[Create JISON]
    id3[Update DB function]
    id4[Create parsing tests]
    id5[define getData]
    id6[Create renderer]
  id7[In progress]
    id8[Design grammar]

```

Background color for section

```mermaid
kanban
  id1[Todo]
    id2[Create JISON]
    id3[Update DB function]
    id4[Create parsing tests]
    id5[define getData]
    id6[Create renderer]
  id7[In progress]
    id8[Design grammar]

  style n2 stroke:#AA00FF,fill:#E1BEE7
```

Background color for section

```mermaid
kanban
  id1[Todo]
    id2[Create JISON]
    id3[Update DB function]
    id4[Create parsing tests]
    id5[define getData]
    id6[Create renderer]
  id7[In progress]
    id8[Design grammar]

  id2@{
    assigned: knsv
    icon: heart
    priority: high
    descr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  }
  style n1 stroke:#AA00FF,fill:#E1BEE7
```

Background color for section

```mermaid
---
config:
  kanban:
    showIds: true
    fields: [[title],[description][id, assigned]]
---
kanban
  id1[Todo]
    id2[Create JISON]
    id3[Update DB function]
    id4[Create parsing tests]
    id5[define getData]
    id6[Create renderer]
  id7[In progress]
    id8[Design grammar]

  id2@{
    assigned: knsv
    icon: heart
    priority: high
    descr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  }
  style n1 stroke:#AA00FF,fill:#E1BEE7
```

priority - dedicated
link - dedicated
