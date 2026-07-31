import type { DiagramMetadata } from '../types.js';

export default {
  id: 'journey',
  name: 'User Journey Diagram',
  description: 'Visualize user interactions and experiences with a system',
  examples: [
    {
      title: 'My Working Day',
      isDefault: true,
      code: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`,
    },
    {
      title: 'Online Grocery Shopping',
      code: `journey
    title Ordering groceries online
    section Browse and select
      Search for items: 6: Customer
      Compare prices: 4: Customer
      Add to basket: 7: Customer
    section Checkout
      Choose delivery slot: 5: Customer
      Pay for order: 3: Customer
    section Fulfilment
      Pick items in store: 4: Store staff
      Deliver groceries: 5: Driver
      Unpack at home: 7: Customer`,
    },
  ],
} satisfies DiagramMetadata;
