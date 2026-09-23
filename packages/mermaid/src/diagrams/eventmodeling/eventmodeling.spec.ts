import { it, describe, expect } from 'vitest';

import { db } from './db.js';
import { parser } from './parser.js';

const { clear } = db;

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

  it('should reject a frame id reused by a reset frame', async () => {
    await parser.parse(`eventmodeling
      tf 09 ui PreviousDiagram`);

    await expect(
      parser.parse(`eventmodeling
        tf 01 ui UI
        tf 02 cmd Command
        rf 01 evt Event`)
    ).rejects.toThrow('Duplicate event modeling frame ID "01" on line 4');
    expect(() => db.getState()).toThrow('No data for EventModel');
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
});
