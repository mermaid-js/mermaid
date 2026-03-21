import type { DiagramMetadata } from '../types.js';

export default {
  id: 'useCase', 
  name: 'Use Case Diagram',
  description: 'Visualize relationships between actors and system use cases',
  examples: [
    {
      title: 'Basic Use Case',
      isDefault: true,
      code: `useCaseDiagram
    actor Admin
    actor Customer
    
    package "E-Commerce System" {
      usecase "Login" as UC1
      usecase "Checkout" as UC2
      usecase "View Orders" as UC3
    }

    Customer --> UC1
    Customer --> UC2
    Admin --> UC3
    UC2 ..> UC1 : <<include>>`,
    },
    {
      title: 'Extended Use Case',
      code: `useCaseDiagram
    actor "Bank Clerk" as Clerk
    usecase "Process Loan" as PL
    usecase "Verify Identity" as VI
    
    Clerk -> PL
    PL <.. VI : <<include>>`,
    },
  ],
} satisfies DiagramMetadata;