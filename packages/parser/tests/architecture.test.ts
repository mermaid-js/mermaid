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
      expect(result.value.$type).toBe(Architecture.$type);
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
      expect(result.value.$type).toBe(Architecture.$type);

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
      expect(result.value.$type).toBe(Architecture.$type);

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
      expect(result.value.$type).toBe(Architecture.$type);

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
      expect(result.value.$type).toBe(Architecture.$type);

      const { title, accTitle, accDescr } = result.value;
      expect(title).toBe('sample title');
      expect(accTitle).toBe('sample accTitle');
      expect(accDescr).toBe('sample accDescr');
    });
  });

  describe('should handle service titles with quotes', () => {
    it('should handle service with quoted title using double quotes', () => {
      const context = `architecture-beta
            service db(database)["Database"] in api
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const service = result.value.services?.[0];
      expect(service).toBeDefined();
      expect(service?.title).toBe('Database');
    });

    it('should handle service with quoted title using single quotes', () => {
      const context = `architecture-beta
            service db(database)['Database'] in api
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const service = result.value.services?.[0];
      expect(service).toBeDefined();
      expect(service?.title).toBe('Database');
    });

    it('should handle service with unquoted title (backward compatibility)', () => {
      const context = `architecture-beta
            service db(database)[Database] in api
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const service = result.value.services?.[0];
      expect(service).toBeDefined();
      expect(service?.title).toBe('Database');
    });

    it('should handle group with quoted title', () => {
      const context = `architecture-beta
            group api(cloud)["API"]
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const group = result.value.groups?.[0];
      expect(group).toBeDefined();
      expect(group?.title).toBe('API');
    });
    it('should preserve apostrophes in service titles', () => {
      const context = `architecture-beta
            service db(database)["John's Database"] in api
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const service = result.value.services?.[0];
      expect(service).toBeDefined();
      expect(service?.title).toBe("John's Database");
    });

    it('should preserve inner quotes in service titles when escaped', () => {
      const context = `architecture-beta
            service api(server)["The \\"Main\\" API"] in cloud
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const service = result.value.services?.[0];
      expect(service).toBeDefined();
      expect(service?.title).toBe('The "Main" API');
    });
  });
});
