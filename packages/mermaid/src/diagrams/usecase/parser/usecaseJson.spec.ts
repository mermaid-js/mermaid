import { describe, expect, it } from 'vitest';
import { parseOrderedJsonObject, UsecaseJsonError } from './usecaseJson.js';

const captureJsonError = (parse: () => unknown): UsecaseJsonError => {
  try {
    parse();
  } catch (error) {
    expect(error).toBeInstanceOf(UsecaseJsonError);
    return error as UsecaseJsonError;
  }
  throw new Error('Expected JSON parsing to fail');
};

describe('parseOrderedJsonObject', () => {
  it('collects escaped JSON Pointer order for nested objects and objects inside arrays', () => {
    const result = parseOrderedJsonObject(
      `{
        "a/b": {
          "items": [
            { "~name": "first", "id": 1 },
            { "id": 2, "details": { "enabled": true } }
          ]
        },
        "last": null
      }`,
      1,
      1
    );

    expect(result.value).toEqual({
      'a/b': {
        items: [
          { '~name': 'first', id: 1 },
          { id: 2, details: { enabled: true } },
        ],
      },
      last: null,
    });
    expect(result.propertyOrder).toEqual({
      '': ['a/b', 'last'],
      '/a~1b': ['items'],
      '/a~1b/items/0': ['~name', 'id'],
      '/a~1b/items/1': ['id', 'details'],
      '/a~1b/items/1/details': ['enabled'],
    });
  });

  it('preserves source order for integer-like property names', () => {
    const result = parseOrderedJsonObject('{"10":"ten","2":"two","1":"one","plain":true}', 1, 1);

    expect(Object.keys(result.value)).toEqual(['1', '2', '10', 'plain']);
    expect(result.propertyOrder).toEqual({ '': ['10', '2', '1', 'plain'] });
  });

  it('keeps a duplicate key first in order while retaining its last value and nested order', () => {
    const result = parseOrderedJsonObject(
      `{
        "entry": { "discarded": { "old": true } },
        "tail": 0,
        "entry": { "second": 2, "first": 1, "\\u0073econd": 3 }
      }`,
      1,
      1
    );

    expect(result.value).toEqual({ entry: { second: 3, first: 1 }, tail: 0 });
    expect(result.propertyOrder).toEqual({
      '': ['entry', 'tail'],
      '/entry': ['second', 'first'],
    });
    expect(result.propertyOrder).not.toHaveProperty('/entry/discarded');
  });

  it('records empty objects and accepts empty arrays and strings as property values', () => {
    const result = parseOrderedJsonObject(
      '{"emptyObject":{},"emptyArray":[],"emptyString":""}',
      4,
      9
    );

    expect(result.value).toEqual({ emptyObject: {}, emptyArray: [], emptyString: '' });
    expect(result.propertyOrder).toEqual({
      '': ['emptyObject', 'emptyArray', 'emptyString'],
      '/emptyObject': [],
    });
  });

  it('ignores braces, brackets, and escaped quotes inside string values', () => {
    const result = parseOrderedJsonObject(
      String.raw`{"text":"a } and { plus [brackets] and \"quotes\"","nested":{"value":"{\"key\": 1}"}}`,
      1,
      1
    );

    expect(result.value).toEqual({
      text: 'a } and { plus [brackets] and "quotes"',
      nested: { value: '{"key": 1}' },
    });
    expect(result.propertyOrder).toEqual({
      '': ['text', 'nested'],
      '/nested': ['value'],
    });
  });

  it.each([
    ['scalar', 'true'],
    ['null', 'null'],
    ['array', '[{"nested":true}]'],
  ])('rejects a %s root', (_description, jsonText) => {
    const error = captureJsonError(() => parseOrderedJsonObject(jsonText, 12, 5));

    expect(error).toMatchObject({
      name: 'UsecaseJsonError',
      line: 12,
      column: 5,
    });
    expect(error.message).toContain('JSON value must have an object root');
  });

  it('maps a malformed JSON offset across physical lines into diagram coordinates', () => {
    const error = captureJsonError(() =>
      parseOrderedJsonObject(
        `{
  "valid": true,
  "invalid":
}`,
        20,
        7
      )
    );

    expect(error).toMatchObject({
      name: 'UsecaseJsonError',
      line: 23,
      column: 1,
    });
    expect(error.message).toContain('Invalid JSON');
  });

  it('adds the token start column to malformed JSON on its first line', () => {
    const error = captureJsonError(() => parseOrderedJsonObject('{"key":,}', 8, 12));

    expect(error).toMatchObject({
      line: 8,
      column: 19,
    });
  });

  it('maps CRLF as one physical line break', () => {
    const error = captureJsonError(() => parseOrderedJsonObject('{\r\n  "key": true,\r\n}', 30, 4));

    expect(error).toMatchObject({
      line: 32,
      column: 1,
    });
  });
});
