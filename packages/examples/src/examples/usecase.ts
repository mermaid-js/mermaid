import type { DiagramMetadata } from '../types.js';

export default {
  id: 'usecase',
  name: 'Use Case Diagram',
  description: 'Visualize system functionality and actor interactions',
  examples: [
    {
      title: 'Basic Use Case',
      isDefault: true,
      code: `usecaseDiagram
    actor "Customer" as C
    actor "Admin" as A
    system "Shop System" {
        usecase "Browse Products" as BP
        usecase "Add to Cart" as AC
        usecase "Checkout" as CO
        usecase "Login" as LG
        usecase "Manage Products" as MP
    }
    C --> BP; AC; CO
    A --> MP
    include: CO-->LG; AC-->LG
    extend: BP-->AC`,
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
      title: 'All Relationship Types',
      code: `usecaseDiagram
    actor "User" as U
    actor "Admin" as ADM
    external "Payment API" as PAY
    system "All Line Types" {
        usecase "Login" as LG
        usecase "Pay" as PY
        usecase "Verify ID" as VID
        usecase "Place Order" as PO
        usecase "Refund" as RF
        usecase "Audit Log" as AL
        usecase "Internal Log" as IL
    }
    note "Requires Auth" as N1
    U --> LG; PO
    ADM --> AL; RF
    include: PO-->LG; PO-->PY
    extend: RF-->PO
    generalization: ADM-->U
    dependency: PY-->PAY
    realization: AL-->LG
    anchor: N1-->LG
    constraint: IL-->PY
    containment: PO-->IL`,
    },
  ],
} satisfies DiagramMetadata;
