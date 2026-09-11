import { it, describe, expect } from 'vitest';

import { db } from './db.js';
import { parser } from './parser.js';

const { clear } = db;

// jsdom does not implement SVGElement.getBBox, which eventmodeling's getState()
// relies on for text measurement. Provide a stub returning non-zero dimensions so
// getState() can run in the test environment (the values do not affect swimlane logic).
Object.defineProperty(SVGElement.prototype, 'getBBox', {
  configurable: true,
  value: () => ({ x: 0, y: 0, width: 10, height: 10 }),
});

describe('eventmodeling diagrams', () => {
  beforeEach(() => {
    clear();
  });

  it('should handle a simple eventmodeling definition', async () => {
    const str = `eventmodeling
    tf 01 ui UI
    tf 02 cmd RunAction
    tf 03 evt ActionExecuted`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle data inline in frames', async () => {
    const str = `eventmodeling
    tf 01 cmd AddItem { productId: 7 }
    tf 02 evt ItemAdded { productId: 7 }`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle data block references', async () => {
    const str = `eventmodeling
    tf 01 cmd AddItem
    tf 02 evt ItemAdded [[ItemAddedData]]

data ItemAddedData
{
  productId: 7
}`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle qualified names', async () => {
    const str = `eventmodeling
    tf 01 ui CartUI
    tf 02 cmd Inventory.AddItem
    tf 03 evt Inventory.ItemAdded`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle multiple source frames', async () => {
    const str = `eventmodeling
    tf 01 ui CartUI
    tf 02 cmd AddItem
    tf 03 cmd RemoveItem
    tf 04 evt ItemChanged ->> 02 ->> 03`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle reset frames', async () => {
    const str = `eventmodeling
    rf 01 ui CartUI
    rf 02 cmd AddItem
    rf 03 evt ItemAdded`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should handle all entity types', async () => {
    const str = `eventmodeling
    tf 01 ui UI
    tf 02 ui UI2
    tf 03 cmd Command
    tf 04 command Command2
    tf 05 evt Event
    tf 06 event Event2
    tf 07 pcr Processor
    tf 08 processor Processor2
    tf 09 rmo ReadModel
    tf 10 readmodel ReadModel2`;
    await expect(parser.parse(str)).resolves.not.toThrow();
  });

  it('should reuse a namespace swimlane when the namespace re-enters its lane', async () => {
    // https://github.com/mermaid-js/mermaid/issues/7925
    // Order acts, Payment reacts, then Order returns to each band. Each
    // (namespace + band) pair must map to exactly one swimlane, so this flow
    // has 6 swimlanes (Order and Payment across the UI, command and event bands),
    // not 9 with Order duplicated in every band.
    const str = `eventmodeling
    tf 01 ui Order.NewOrderScreen
    tf 02 cmd Order.PlaceOrder
    tf 03 evt Order.OrderPlaced
    tf 04 pcr Payment.ChargeOnOrderPlaced
    tf 05 cmd Payment.Charge
    tf 06 evt Payment.Charged
    tf 07 pcr Order.ConfirmOnPaymentCharged
    tf 08 cmd Order.Confirm
    tf 09 evt Order.Confirmed`;
    await parser.parse(str);

    const { sortedSwimlanesArray } = db.getState();
    expect(sortedSwimlanesArray).toHaveLength(6);
    expect(sortedSwimlanesArray.filter((swimlane) => swimlane.namespace === 'Order')).toHaveLength(
      3
    );
    expect(
      sortedSwimlanesArray.filter((swimlane) => swimlane.namespace === 'Payment')
    ).toHaveLength(3);
  });
});
