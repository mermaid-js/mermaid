// cspell:ignore usecase usecases usecasediagram
import type { DiagramMetadata } from '../types.js';

export default {
  id: 'usecase',
  name: 'Use Case Diagram',
  description: 'Visualize relationships between actors and system use cases',
  examples: [
    {
      title: 'Basic Use Case',
      isDefault: true,
      code: `usecaseDiagram
    actor "Customer" as C
    actor "Admin" as A

    system "E-Commerce System" {
        usecase "Login" as UC1
        usecase "Checkout" as UC2
        usecase "View Orders" as UC3
    }

    C --> UC1
    C --> UC2
    A --> UC3
    include: UC2 --> UC1`,
    },
    {
      title: 'ATM System',
      code: `usecaseDiagram
    actor "Customer" as C
    actor "Technician" as T
    external "Bank Server" as S

    system "ATM System" {
        usecase "Withdraw Cash" as UC1
        usecase "Check Balance" as UC2
        usecase "Login" as UC3
    }

    note "Requires PIN" as N1

    C --> UC1; UC2
    T --> UC3
    include: UC1 --> UC3
    dependency: UC1 --> S
    generalization: T --> C
    anchor: N1 --> UC3`,
    },
    {
      title: 'Security Portal',
      code: `%%{init: { 'themeVariables': {
    'primaryColor': '#b3e5fc',
    'primaryBorderColor': '#01579b',
    'primaryTextColor': '#000000',
    'secondaryColor': '#e3f2fd',
    'tertiaryColor': '#fff9c4',
    'lineColor': '#01579b'
}}}%%
usecaseDiagram
    actor "Admin" as A

    system "Security Portal" {
        usecase "View Logs" as UC1
        usecase "Audit Session" as UC2
    }

    note "Only for SuperAdmins" as N1

    A --> UC1
    A --> UC2
    include: UC1 --> UC2
    anchor: N1 --> UC1`,
    },
  ],
} satisfies DiagramMetadata;