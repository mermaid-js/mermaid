import type { DiagramMetadata } from '../types.js';

export default {
  id: 'component',
  name: 'Component Diagram',
  description: 'Show components, interfaces, ports, packages, and how they connect',
  examples: [
    {
      title: 'Basic Components',
      isDefault: true,
      code: `component-beta
direction LR
component Web["Web shop"]
component Orders["Order service"] <<service>>
interface IOrders["Orders API"]
Web --( IOrders
Orders --() IOrders`,
    },
    {
      title: 'Ports and Packages',
      code: `component-beta
package Backend {
  component Payments {
    port api
  }
  component Ledger
}
interface IPay
Payments.api --() IPay
Payments ..> Ledger : writes to`,
    },
    {
      title: 'Notes and Styling',
      code: `component-beta
component Orders
note for Orders "handles checkout"
classDef hot fill:#f96,stroke:#333
class Orders hot`,
    },
  ],
} satisfies DiagramMetadata;
