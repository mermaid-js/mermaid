import { describe, expect, it } from 'vitest';

import { Yearwheel } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, yearwheelParse as parse } from './test-util.js';

const mutateGlobalSpacing = (context: string) => {
  return [
    context,
    `  ${context}  `,
    `\t${context}\t`,
    `
    \t${context}
    `,
  ];
};

const expectErrors = (context: string) => {
  const result = parse(context);
  expect(result.lexerErrors.length + result.parserErrors.length).toBeGreaterThan(0);
};

describe('yearwheel', () => {
  describe('should handle declaration', () => {
    it.each([...mutateGlobalSpacing('yearwheel')])(
      'should parse declaration with spacing variants',
      (context: string) => {
        const result = parse(context);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Yearwheel.$type);
      }
    );

    it.each([
      `yearwheel %% yearly planning`,
      `%% comment before declaration
yearwheel`,
      `%%{init: {"theme":"base"}}%%
yearwheel`,
    ])('should parse declaration with comments', (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Yearwheel.$type);
    });

    it('should reject semicolon in declaration', () => {
      expectErrors(`yearwheel;`);
    });

    it.each([`yearwheel:`, `yearwheel-beta`])(
      'should reject near-miss declarations',
      (context: string) => {
        expectErrors(context);
      }
    );
  });

  describe('should handle baseDate', () => {
    it.each([
      `yearwheel
baseDate now`,
      `yearwheel
baseDate   now`,
      `yearwheel
baseDate now %% use current date`,
    ])('should parse baseDate now variants', (context: string) => {
      const result = parse(context);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.baseDate?.useNow).toBeTruthy();
      expect(result.value.baseDate?.date).toBeUndefined();
    });

    it('should parse fixed baseDate', () => {
      const result = parse(`yearwheel
baseDate 2026-01-01`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.baseDate?.useNow).toBeFalsy();
      expect(result.value.baseDate?.date).toBe('2026-01-01');
    });

    it.each([
      `yearwheel
baseDate`,
      `yearwheel
baseDate 2026-13-01`,
      `yearwheel
baseDate now
baseDate 2026-01-01`,
      `yearwheel
A("Task", "0 0 * * *")
baseDate now`,
    ])('should reject malformed baseDate statements', (context: string) => {
      expectErrors(context);
    });
  });

  describe('should handle events', () => {
    it('should parse events with baseDate', () => {
      const result = parse(`yearwheel
baseDate now

A("Verify yearwheel", "0 8 1 * 1")
B("Finance upgrade", "0 0 22 ? 1,4,7,10 6#3")
C("Maintenance upgrade", "0 12 * 3 *")`);
      expectNoErrorsOrAlternatives(result);

      expect(result.value.events).toHaveLength(3);
      expect(result.value.events[0].id).toBe('A');
      expect(result.value.events[0].label).toBe('Verify yearwheel');
      expect(result.value.events[0].cron).toBe('0 8 1 * 1');
      expect(result.value.events[1].id).toBe('B');
      expect(result.value.events[1].cron).toBe('0 0 22 ? 1,4,7,10 6#3');
      expect(result.value.events[2].id).toBe('C');
      expect(result.value.events[2].cron).toBe('0 12 * 3 *');
    });

    it('should parse events without baseDate', () => {
      const result = parse(`yearwheel
A("Ops window", "0 0 * * 2")`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.baseDate).toBeUndefined();
      expect(result.value.events).toHaveLength(1);
      expect(result.value.events[0].id).toBe('A');
    });

    it('should parse events with trailing comments', () => {
      const result = parse(`yearwheel
baseDate now %% use current date
A("Ops window", "0 0 * * 2") %% every Tuesday`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.events).toHaveLength(1);
      expect(result.value.events[0].id).toBe('A');
    });

    it.each([
      `yearwheel
A("Missing cron")`,
      `yearwheel
A("Bad cron", 0 0 * * *)`,
    ])('should reject malformed event statements', (context: string) => {
      expectErrors(context);
    });
  });

  describe('should handle title and accessibility', () => {
    it('should parse title, accTitle, and single-line accDescr', () => {
      const result = parse(`yearwheel
title Planned maintenance
accTitle: Yearwheel schedule
accDescr: Upcoming recurring maintenance work
A("Ops window", "0 0 * * 2")`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.title).toBe('Planned maintenance');
      expect(result.value.accTitle).toBe('Yearwheel schedule');
      expect(result.value.accDescr).toBe('Upcoming recurring maintenance work');
    });

    it('should parse multi-line accDescr', () => {
      const result = parse(`yearwheel
accDescr {
  Upcoming recurring maintenance work
}
A("Ops window", "0 0 * * 2")`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.accDescr).toBe('Upcoming recurring maintenance work');
    });

    it.each([
      `yearwheel
accTitle Missing colon`,
      `yearwheel
accDescr`,
      `yearwheel
accDescr {
  missing close`,
    ])('should reject malformed accessibility statements', (context: string) => {
      expectErrors(context);
    });
  });
});
