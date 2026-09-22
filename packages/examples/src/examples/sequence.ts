import type { DiagramMetadata } from '../types.js';

export default {
  id: 'sequence',
  name: 'Sequence Diagram',
  description: 'Visualize interactions between objects over time',
  examples: [
    {
      title: 'Basic Sequence',
      isDefault: true,
      code: `sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`,
    },
    {
      title: 'Online Payment Flow',
      code: `sequenceDiagram
    autonumber
    actor Customer
    participant Shop as Web Shop
    participant Pay as Payment Service
    participant Bank

    Customer->>Shop: Place order
    activate Shop
    Shop->>Pay: Create payment request
    activate Pay
    Pay->>Bank: Authorize card
    Bank-->>Pay: Authorization result
    alt Payment approved
        Pay-->>Shop: Payment confirmed
        Shop-->>Customer: Show receipt
    else Payment declined
        Pay-->>Shop: Payment failed
        Shop-->>Customer: Ask for another card
    end
    deactivate Pay
    deactivate Shop`,
    },
    {
      title: 'Food Delivery with Parallel Actions',
      code: `sequenceDiagram
    participant App as Mobile App
    participant API as Order Service
    participant Kitchen
    actor Courier

    App->>API: Submit order
    Note right of API: Validate items,<br/>charge payment
    par Notify kitchen
        API->>Kitchen: New order ticket
    and Confirm to customer
        API-->>App: Order accepted, ETA 30 min
    end
    Kitchen-->>API: Order ready
    API->>Courier: Request pickup
    loop Until delivered
        Courier->>App: Share live location
    end
    Courier-->>App: Order delivered`,
    },
  ],
} satisfies DiagramMetadata;
