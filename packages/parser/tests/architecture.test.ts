import { describe, expect, it } from 'vitest';

import { Architecture } from '../src/index.js';
import { expectNoErrorsOrAlternatives, architectureParse as parse } from './test-util.js';

describe('architecture', () => {
  it.each([
    `architecture-beta`,
    `  architecture-beta  `,
    `\tarchitecture-beta\t`,
    `
    \tarchitecture-beta
    `,
  ])('should handle regular architecture-beta', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);
  });

  it('should not allow architecture-beta & group in same line', () => {
    const result = parse(`architecture-beta group api(cloud)[API]`);
    expect(result.parserErrors).toHaveLength(1);
    expect(result.parserErrors[0].message).toBe(
      'Expecting: one of these possible Token sequences:\n' +
        '  1. [NEWLINE]\n' +
        '  2. [EOF]\n' +
        "but found: 'group'"
    );
  });

  it.each([
    `architecture-beta
    group api(cloud)[API]`,
    `architecture-beta
    group api(cloud)[API]
    `,
    `architecture-beta
    group api(cloud)[API]`,
    `architecture-beta
    group api(cloud)[API]
    `,
  ])('should handle architecture-beta + group in different line', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);

    const { groups } = result.value;
    expect(groups[0].title).toBe('API');
  });

  it.each([
    `architecture-beta
     group api(cloud)["a.b-t"]`,
    `architecture-beta
     group api(cloud)["user:password@some_domain.com"]
    `,
  ])('should handle special character in a title', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);

    const { groups } = result.value;
    expect(groups[0]).toBeTruthy();
  });

  it.each([
    `architecture-beta
     group api(cloud)["\`The **cat** in the hat\`"]`,
    `architecture-beta
     group api(cloud)["\`The *bat*
      in the chat\`"]
    `,
  ])('should handle markdown in a title', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);

    const { groups } = result.value;
    expect(groups[0].title).toBeTruthy();
  });

  it('should handle unicode', () => {
    const result = parse(`architecture-beta
     group api(cloud)["Начало"]`);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);

    const { groups } = result.value;
    expect(groups[0].title).toBe('Начало');
  });

  it('should handle escaping "', () => {
    const result = parse('architecture-beta\ngroup api(cloud)["\\"Начало\\""]');
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);

    const { groups } = result.value;
    expect(groups[0].title).toBe('"Начало"');
  });
});
