import { describe, expect, it } from 'vitest';

import { Architecture } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, architectureParse as parse } from './test-util.js';

describe('architecture', () => {
  describe('should handle architecture definition', () => {
    it.each([
      `architecture-beta`,
      `  architecture-beta  `,
      `\tarchitecture-beta\t`,
      `
        \tarchitecture-beta
        `,
    ])('should handle regular architecture', (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
    });
  });

  describe('should handle TitleAndAccessibilities', () => {
    it.each([
      `architecture-beta title sample title`,
      `  architecture-beta  title sample title  `,
      `\tarchitecture-beta\ttitle sample title\t`,
      `architecture-beta
            \ttitle sample title
            `,
    ])('should handle regular architecture + title in same line', (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { title } = result.value;
      expect(title).toBe('sample title');
    });

    it.each([
      `architecture-beta
            title sample title`,
      `architecture-beta
            title sample title
            `,
    ])('should handle regular architecture + title in next line', (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { title } = result.value;
      expect(title).toBe('sample title');
    });

    it('should handle regular architecture + title + accTitle + accDescr', () => {
      const context = `architecture-beta
            title sample title
            accTitle: sample accTitle
            accDescr: sample accDescr
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { title, accTitle, accDescr } = result.value;
      expect(title).toBe('sample title');
      expect(accTitle).toBe('sample accTitle');
      expect(accDescr).toBe('sample accDescr');
    });

    it('should handle regular architecture + title + accTitle + multi-line accDescr', () => {
      const context = `architecture-beta
            title sample title
            accTitle: sample accTitle
            accDescr {
                sample accDescr
            }
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);

      const { title, accTitle, accDescr } = result.value;
      expect(title).toBe('sample title');
      expect(accTitle).toBe('sample accTitle');
      expect(accDescr).toBe('sample accDescr');
    });
  });

  describe('should handle special characters in service titles', () => {
  it('should handle service with dot in title', () => {
    const context = `architecture-beta
      service dns1(internet)[www.mywebs]
    `;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.services[0].title).toBe('www.mywebs');
  });

  it('should handle service with multiple special characters', () => {
    const context = `architecture-beta
      service api(server)[api-gateway_v2.0]
    `;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.services[0].title).toBe('api-gateway_v2.0');
  });

  it('should handle service with colons and slashes', () => {
    const context = `architecture-beta
      service db(database)[db:5432/primary]
    `;
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.services[0].title).toBe('db:5432/primary');
  });
});


});
