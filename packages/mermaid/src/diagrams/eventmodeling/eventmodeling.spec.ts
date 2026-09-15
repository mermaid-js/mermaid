import { it, describe, expect } from 'vitest';

import { db, stripInlineValue, stripBlockValue } from './db.js';
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

describe('stripInlineValue', () => {
  it('keeps the last character of an inline data spec', () => {
    // cspell:ignore quantit
    // Regression: previously `substring(0, lastIndexOf('}') - 1)` chopped
    // the last char, so "{item, quantity}" rendered as "item, quantit".
    expect(stripInlineValue('{item, quantity}')).toBe('item, quantity');
  });

  it('returns content verbatim for multi-field specs', () => {
    expect(stripInlineValue('{cartId, item, quantity}')).toBe('cartId, item, quantity');
  });

  it('handles a single-character content', () => {
    // Edge case where the off-by-one was easiest to spot: a single char
    // body became the empty string under the old behavior.
    expect(stripInlineValue('{x}')).toBe('x');
  });

  it('handles an empty body', () => {
    expect(stripInlineValue('{}')).toBe('');
  });

  it('preserves leading/trailing whitespace inside the braces', () => {
    expect(stripInlineValue('{ item, quantity }')).toBe(' item, quantity ');
  });
});

describe('stripBlockValue', () => {
  it('keeps the last character of a block data spec', () => {
    // Block notation: `data Foo {\n  ...lines...\n}`. The buggy version
    // chopped the trailing newline (and on the last line, the last char).
    const input = '{\n  item: string\n  quantity: number\n}';
    expect(stripBlockValue(input)).toBe('  item: string\n  quantity: number\n');
  });

  it('keeps single-line block content intact', () => {
    expect(stripBlockValue('{\n  field: value\n}')).toBe('  field: value\n');
  });
});
