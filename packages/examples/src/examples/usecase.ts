import type { DiagramMetadata } from '../types.js';

export default {
  id: 'usecase',
  name: 'Use Case Diagram',
  description: 'Visualize system functionality and user interactions',
  examples: [
    {
      title: 'Basic Use Case',
      isDefault: true,
      code: `usecase
actor User
actor Admin
User --> (Login)
User --> (View Profile)
Admin --> (Manage Users)
Admin --> (View Reports)`,
    },
    {
      title: 'System Boundary',
      code: `usecase
actor Customer
actor Support

SystemBoundary@{ type: rect } "E-commerce System" {
  Customer --> (Browse Products)
  Customer --> (Place Order)
  Customer --> (Track Order)
}

SystemBoundary@{ type: package } "Admin Panel" {
  Support --> (Process Orders)
  Support --> (Handle Returns)
}`,
    },
    {
      title: 'Actor Relationships',
      code: `usecase
actor Developer1
actor Developer2
actor Manager

Developer1 --> (Write Code)
Developer2 --> (Review Code)
Manager --> (Approve Release)

Developer1 --> Developer2
Manager --> Developer1`,
    },
  ],
} satisfies DiagramMetadata;
