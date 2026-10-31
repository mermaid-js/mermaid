import type { DiagramMetadata } from '../types.js';

export default {
  id: 'usecase',
  name: 'Use Case Diagram',
  description: 'Show actors, use cases, system boundaries, and associations',
  examples: [
    {
      title: 'Basic Use Cases',
      isDefault: true,
      code: `usecase-beta
actor User("User")
actor Admin("Administrator")
Login("Log in")
ViewProfile("View profile")
ManageUsers("Manage users")
ViewReports("View reports")
User --> Login
User --> ViewProfile
Admin --> ManageUsers
Admin --> ViewReports`,
    },
    {
      title: 'System Boundaries',
      code: `usecase-beta
actor Customer("Customer")
actor SupportAgent("Support agent")
systemBoundary "E-commerce System"
  BrowseProducts("Browse products")
  PlaceOrder("Place order")
  TrackOrder("Track order")
end
systemBoundary "Admin Panel"
  ProcessOrders("Process orders")
  HandleReturns("Handle returns")
end
Admin_Panel@{ type: package }
Customer --> BrowseProducts
Customer --> PlaceOrder
Customer --> TrackOrder
SupportAgent --> ProcessOrders
SupportAgent --> HandleReturns`,
    },
    {
      title: 'Actor Collaboration',
      code: `usecase-beta
actor Developer("Developer")
actor Reviewer("Reviewer")
actor Manager("Release manager")
WriteCode("Write code")
ReviewCode("Review code")
ApproveRelease("Approve release")
Developer --> WriteCode
Reviewer --> ReviewCode
Manager --> ApproveRelease
Developer -- "collaborates with" --> Reviewer
Manager --> Developer`,
    },
  ],
} satisfies DiagramMetadata;
