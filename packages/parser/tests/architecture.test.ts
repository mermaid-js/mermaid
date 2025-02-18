import { describe, expect, it } from 'vitest';

import { Architecture } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, architectureParse as parse } from './test-util.js';

describe('architecture', () => {
  it.each([
    `architecture-beta`,
    `  architecture-beta  `,
    `\tarchitecture-beta\t`,
    `
    \tarchitecture-beta
    `,
    `


    \tarchitecture-beta



    `,
  ])('should handle regular architecture', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);
  });

  it.each([
    `architecture-beta

      group foo(cloud)`,
    `architecture-beta

      service foo(server)

      `,
  ])('should handle group and service', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);
  });

  it.each([
    `architecture-beta
      service foo(cloud)[Foo]
      service bar(cloud)[Foo-Bar]
      service bar2(cloud)[Foo/Bar]
      service bar3(cloud)[Foo:Bar]
      service bar4(cloud)["Foo:Bar"]
      `,
  ])('should handle labels with non-alpha characters', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Architecture);
  });
});
