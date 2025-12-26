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

  describe('should handle services', () => {
    it('should handle service with icon', () => {
      const context = `architecture-beta
        service TH(disk)
      `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      expect(result.value.services).toHaveLength(1);
      expect(result.value.services?.[0].id).toBe('TH');
      expect(result.value.services?.[0].icon).toBe('disk');
    });

    it('should handle service with icon starting with arrow direction letters', () => {
      const context = `architecture-beta
        service T(disk)
        service TH(database)
        service L(server)
        service R(cloud)
        service B(internet)
        service TOP(disk)
        service LEFT(disk)
        service RIGHT(disk)
        service BOTTOM(disk)
      `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      expect(result.value.services).toHaveLength(9);
    });

    it('should handle service with icon and title', () => {
      const context = `architecture-beta
        service db(database)[Database]
      `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      expect(result.value.services).toHaveLength(1);
      expect(result.value.services?.[0].id).toBe('db');
      expect(result.value.services?.[0].icon).toBe('database');
      expect(result.value.services?.[0].title).toBe('Database');
    });

    it('should handle service in a group', () => {
      const context = `architecture-beta
        group api(cloud)[API]
        service db(database)[Database] in api
      `;
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Architecture);
      expect(result.value.services).toHaveLength(1);
      expect(result.value.services?.[0].id).toBe('db');
      expect(result.value.services?.[0].in).toBe('api');
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
});
