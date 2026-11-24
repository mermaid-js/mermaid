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

  describe('should handle ids that start with a direction letter', () => {
    it.each([
      `architecture-beta
            service TH(disk)
            `,
      `architecture-beta
            service LH(disk)
            `,
      `architecture-beta
            service RH(disk)
            `,
      `architecture-beta
            service BH(disk)
            `,
      `architecture-beta
            junction T
            `,
      `architecture-beta
            group T(server)[T]
            `,
    ])(
      'should handle regular architecture + an id starting with L, R, T or B',
      (context: string) => {
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Architecture.$type);
      }
    );

    it('should still read direction letters on edge ports', () => {
      const context = `architecture-beta
            service a(disk)
            service b(disk)
            a:B --> T:b
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const edge = result.value.edges?.[0];
      expect(edge?.lhsDir).toBe('B');
      expect(edge?.rhsDir).toBe('T');
    });

    it.each([
      `architecture-beta
            service T(disk)
            service a(disk)
            T:R -- L:a
            `,
      `architecture-beta
            service a(disk)
            service Backend(disk)
            a:R -- L:Backend
            `,
      `architecture-beta
            service a(disk)
            service b(disk)
            a:R--L:b
            `,
      `architecture-beta
            service a(disk)
            service b(disk)
            a:R-[title]-L:b
            `,
      `architecture-beta
            service a(disk)
            service B-api(disk)
            a:R -- L:B-api
            `,
    ])(
      'should read an edge endpoint whose id starts with a direction letter',
      (context: string) => {
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Architecture.$type);
        expect(result.value.edges).toHaveLength(1);
      }
    );

    it('should read direction letters separated from their colon by whitespace', () => {
      const context = `architecture-beta
            service a(disk)
            service b(disk)
            a: B -- T :b
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const edge = result.value.edges?.[0];
      expect(edge?.lhsDir).toBe('B');
      expect(edge?.rhsDir).toBe('T');
    });
  });

  describe('should handle non-ASCII and punctuation in unquoted titles', () => {
    it.each([
      '采集器',
      'Hello 世界',
      'Сервер',
      'Café',
      'Structure + Src',
      'Multi-Agent',
      'A, B, C',
      'TCP/IP: v6',
    ])('should handle a service title containing "%s"', (title: string) => {
      const context = `architecture-beta
            service a(server)[${title}] in g1
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const service = result.value.services?.[0];
      expect(service).toBeDefined();
      expect(service?.title).toBe(title);
    });

    it('should handle a group title containing Chinese characters', () => {
      const context = `architecture-beta
            group g1(server)[你好世界]
            `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture.$type);

      const group = result.value.groups?.[0];
      expect(group).toBeDefined();
      expect(group?.title).toBe('你好世界');
    });
  });
});
