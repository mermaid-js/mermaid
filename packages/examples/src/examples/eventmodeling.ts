import type { DiagramMetadata } from '../types.js';

export default {
  id: 'eventmodeling',
  name: 'Event Modeling Diagram',
  description:
    'Describe systems using an example of how information has changed within them over time',
  examples: [
    {
      title: 'Shopping Cart Story',
      isDefault: true,
      code: `eventmodeling

tf 01 ui ShopUI
tf 02 cmd AddItemToCart
tf 03 evt ItemAdded
tf 04 rmo CartView ->> 03
tf 05 ui CheckoutUI
tf 06 cmd PlaceOrder
tf 07 evt OrderPlaced
tf 08 rmo OrderStatus ->> 07
`,
    },
    {
      title: 'Cross-System Flow with Data',
      code: `eventmodeling

tf 01 ui CartUI
tf 02 cmd AddItem [[AddItem01]]
tf 03 evt ItemAdded [[ItemAdded]]

rf 04 evt Warehouse.StockChanged
tf 05 pcr StockProcessor
tf 06 cmd UpdateAvailability
tf 07 evt Shop.AvailabilityUpdated

data AddItem01 {
  sku: 'SHIRT-M'
  quantity: 2
}

data ItemAdded {
  sku: string
  quantity: number
}
`,
    },
  ],
} satisfies DiagramMetadata;
