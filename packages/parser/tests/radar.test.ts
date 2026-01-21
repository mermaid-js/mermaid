import { describe, expect, it } from 'vitest';

import { Radar } from '../src/language/index.js';
import { expectNoErrorsOrAlternatives, radarParse as parse } from './test-util.js';
import { parse as parseAsync, MermaidParseError } from '../src/parse.js';

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

describe('radar', () => {
  it.each([
    ...mutateGlobalSpacing('radar-beta'),
    ...mutateGlobalSpacing('radar-beta:'),
    ...mutateGlobalSpacing('radar-beta :'),
  ])('should handle regular radar', (context: string) => {
    const result = parse(context);
    expectNoErrorsOrAlternatives(result);
    expect(result.value.$type).toBe(Radar);
  });

  describe('should handle title, accDescr, and accTitle', () => {
    it.each([
      ...mutateGlobalSpacing(' title My Title'),
      ...mutateGlobalSpacing('\n  title My Title'),
    ])('should handle title', (context: string) => {
      const result = parse(`radar-beta${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { title } = result.value;
      expect(title).toBe('My Title');
    });

    it.each([
      ...mutateGlobalSpacing(' accDescr: My Accessible Description'),
      ...mutateGlobalSpacing('\n  accDescr: My Accessible Description'),
    ])('should handle accDescr', (context: string) => {
      const result = parse(`radar-beta${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { accDescr } = result.value;
      expect(accDescr).toBe('My Accessible Description');
    });

    it.each([
      ...mutateGlobalSpacing(' accTitle: My Accessible Title'),
      ...mutateGlobalSpacing('\n  accTitle: My Accessible Title'),
    ])('should handle accTitle', (context: string) => {
      const result = parse(`radar-beta${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { accTitle } = result.value;
      expect(accTitle).toBe('My Accessible Title');
    });

    it.each([
      ...mutateGlobalSpacing(
        ' title My Title\n  accDescr: My Accessible Description\n  accTitle: My Accessible Title'
      ),
      ...mutateGlobalSpacing(
        '\n  title My Title\n  accDescr: My Accessible Description\n  accTitle: My Accessible Title'
      ),
    ])('should handle title + accDescr + accTitle', (context: string) => {
      const result = parse(`radar-beta${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { title, accDescr, accTitle } = result.value;
      expect(title).toBe('My Title');
      expect(accDescr).toBe('My Accessible Description');
      expect(accTitle).toBe('My Accessible Title');
    });
  });

  describe('should handle axis', () => {
    it.each([`axis my-axis`, `axis my-axis["My Axis Label"]`])(
      'should handle one axis',
      (context: string) => {
        const result = parse(`radar-beta\n${context}`);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Radar);

        const { axes } = result.value;
        expect(axes).toHaveLength(1);
        expect(axes[0].$type).toBe('Axis');
        expect(axes[0].name).toBe('my-axis');
      }
    );

    it.each([
      `axis my-axis["My Axis Label"]
      axis my-axis2`,
      `axis my-axis, my-axis2`,
      `axis my-axis["My Axis Label"], my-axis2`,
      `axis my-axis, my-axis2["My Second Axis Label"]`,
    ])('should handle multiple axes', (context: string) => {
      const result = parse(`radar-beta\n${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { axes } = result.value;
      expect(axes).toHaveLength(2);
      expect(axes.every((axis) => axis.$type === 'Axis')).toBe(true);
      expect(axes[0].name).toBe('my-axis');
      expect(axes[1].name).toBe('my-axis2');
    });

    it.each([
      `axis my-axis["My Axis Label"]
      axis my-axis2["My Second Axis Label"]`,
      `axis my-axis ["My Axis Label"], my-axis2\t["My Second Axis Label"]`,
    ])('should handle axis labels', (context: string) => {
      const result = parse(`radar-beta\n${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { axes } = result.value;
      expect(axes).toHaveLength(2);
      expect(axes[0].name).toBe('my-axis');
      expect(axes[0].label).toBe('My Axis Label');
      expect(axes[1].name).toBe('my-axis2');
      expect(axes[1].label).toBe('My Second Axis Label');
    });

    it('should not allow empty axis names', () => {
      const result = parse(`radar-beta
      axis`);
      expect(result.parserErrors).not.toHaveLength(0);
    });

    it('should not allow non-comma separated axis names', () => {
      const result = parse(`radar-beta
      axis my-axis my-axis2`);
      expect(result.parserErrors).not.toHaveLength(0);
    });
  });

  describe('should handle curves', () => {
    it.each([
      `radar-beta
      curve my-curve`,
      `radar-beta
      curve my-curve["My Curve Label"]`,
    ])('should not allow curves without axes', (context: string) => {
      const result = parse(`radar-beta${context}`);
      expect(result.parserErrors).not.toHaveLength(0);
    });

    it.each([
      `radar-beta
      axis my-axis
      curve my-curve`,
      `radar-beta
      axis my-axis
      curve my-curve["My Curve Label"]`,
    ])('should not allow curves without entries', (context: string) => {
      const result = parse(`radar-beta${context}`);
      expect(result.parserErrors).not.toHaveLength(0);
    });

    it.each([
      `curve my-curve { 1 }`,
      `curve my-curve {
        1
      }`,
      `curve my-curve {

      1

      }`,
    ])('should handle one curve with one entry', (context: string) => {
      const result = parse(`radar-beta\naxis my-axis\n${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { curves } = result.value;
      expect(curves).toHaveLength(1);
      expect(curves[0].$type).toBe('Curve');
      expect(curves[0].name).toBe('my-curve');
      expect(curves[0].entries).toHaveLength(1);
      expect(curves[0].entries[0].$type).toBe('Entry');
      expect(curves[0].entries[0].value).toBe(1);
    });

    it.each([
      `curve my-curve { my-axis 1 }`,
      `curve my-curve { my-axis : 1 }`,
      `curve my-curve {
        my-axis: 1
      }`,
    ])('should handle one curve with one detailed entry', (context: string) => {
      const result = parse(`radar-beta\naxis my-axis\n${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { curves } = result.value;
      expect(curves).toHaveLength(1);
      expect(curves[0].$type).toBe('Curve');
      expect(curves[0].name).toBe('my-curve');
      expect(curves[0].entries).toHaveLength(1);
      expect(curves[0].entries[0].$type).toBe('Entry');
      expect(curves[0].entries[0].value).toBe(1);
      expect(curves[0].entries[0]?.axis?.$refText).toBe('my-axis');
    });

    it.each([
      `curve my-curve { ax1 1, ax2 2 }`,
      `curve my-curve {
        ax1 1,
        ax2 2
      }`,
      `curve my-curve["My Curve Label"] {
        ax1: 1, ax2: 2
      }`,
    ])('should handle one curve with multiple detailed entries', (context: string) => {
      const result = parse(`radar-beta\naxis ax1, ax1\n${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { curves } = result.value;
      expect(curves).toHaveLength(1);
      expect(curves[0].$type).toBe('Curve');
      expect(curves[0].name).toBe('my-curve');
      expect(curves[0].entries).toHaveLength(2);
      expect(curves[0].entries[0].$type).toBe('Entry');
      expect(curves[0].entries[0].value).toBe(1);
      expect(curves[0].entries[0]?.axis?.$refText).toBe('ax1');
      expect(curves[0].entries[1].$type).toBe('Entry');
      expect(curves[0].entries[1].value).toBe(2);
      expect(curves[0].entries[1]?.axis?.$refText).toBe('ax2');
    });

    it.each([
      `curve c1 { ax1 1, ax2 2 }
      curve c2 { ax1 3, ax2 4 }`,
      `curve c1 {
        ax1 1,
        ax2 2
      }
      curve c2 {
        ax1 3,
        ax2 4
      }`,
      `curve c1{ 1, 2 }, c2{ 3, 4 }`,
    ])('should handle multiple curves', (context: string) => {
      const result = parse(`radar-beta\naxis ax1, ax1\n${context}`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe(Radar);

      const { curves } = result.value;
      expect(curves).toHaveLength(2);
      expect(curves.every((curve) => curve.$type === 'Curve')).toBe(true);
      expect(curves[0].name).toBe('c1');
      expect(curves[1].name).toBe('c2');
    });

    it('should not allow empty curve names', () => {
      const result = parse(`radar-beta
      axis my-axis
      curve`);
      expect(result.parserErrors).not.toHaveLength(0);
    });

    it('should not allow number and detailed entries in the same curve', () => {
      const result = parse(`radar-beta
      axis ax1, ax2
      curve my-curve { 1, ax1 2 }`);
      expect(result.parserErrors).not.toHaveLength(0);
    });

    it('should not allow non-comma separated entries', () => {
      const result = parse(`radar-beta
      axis ax1, ax2
      curve my-curve { ax1 1 ax2 2 }`);
      expect(result.parserErrors).not.toHaveLength(0);
    });
  });

  describe('should handle options', () => {
    it.each([`ticks 5`, `min 50`, `max 50`])(
      `should handle number option %s`,
      (context: string) => {
        const result = parse(`radar-beta
      axis ax1, ax2
      curve c1 { ax1 1, ax2 2 }
      ${context}`);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Radar);

        const { options } = result.value;
        expect(options).toBeDefined();
        const option = options.find((option) => option.name === context.split(' ')[0]);
        expect(option).toBeDefined();
        expect(option?.value).toBe(Number(context.split(' ')[1]));
      }
    );

    it.each([`graticule circle`, `graticule polygon`])(
      `should handle string option %s`,
      (context: string) => {
        const result = parse(`radar-beta
      axis ax1, ax2
      curve c1 { ax1 1, ax2 2 }
      ${context}`);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Radar);

        const { options } = result.value;
        expect(options).toBeDefined();
        const option = options.find((option) => option.name === context.split(' ')[0]);
        expect(option).toBeDefined();
        expect(option?.value).toBe(context.split(' ')[1]);
      }
    );

    it.each([`showLegend true`, `showLegend false`])(
      `should handle boolean option %s`,
      (context: string) => {
        const result = parse(`radar-beta
      axis ax1, ax2
      curve c1 { ax1 1, ax2 2 }
      ${context}`);
        expectNoErrorsOrAlternatives(result);
        expect(result.value.$type).toBe(Radar);

        const { options } = result.value;
        expect(options).toBeDefined();
        const option = options.find((option) => option.name === context.split(' ')[0]);
        expect(option).toBeDefined();
        expect(option?.value).toBe(context.split(' ')[1] === 'true');
      }
    );
  });

  describe('error messages with line and column numbers', () => {
    it('should include line and column numbers in parser errors for radar diagrams', async () => {
      const invalidRadar = `radar-beta
  title Restaurant Comparison
  axis food["Food Quality"], service["Service"], price["Price"]
  axis ambiance["Ambiance"],

  curve a["Restaurant A"]{4, 3, 2, 4}`;

      try {
        await parseAsync('radar', invalidRadar);
        expect.fail('Should have thrown MermaidParseError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(MermaidParseError);
        expect(error.message).toMatch(/line \d+/);
        expect(error.message).toMatch(/column \d+/);
      }
    });

    it('should include line and column numbers for missing curve entries', async () => {
      const invalidRadar = `radar-beta
  axis my-axis
  curve my-curve`;

      try {
        await parseAsync('radar', invalidRadar);
        expect.fail('Should have thrown MermaidParseError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(MermaidParseError);
        // Line and column may be ? if not available
        expect(error.message).toMatch(/line (\d+|\?)/);
        expect(error.message).toMatch(/column (\d+|\?)/);
      }
    });

    it('should include line and column numbers for invalid axis syntax', async () => {
      const invalidRadar = `radar-beta
  axis my-axis my-axis2`;

      try {
        await parseAsync('radar', invalidRadar);
        expect.fail('Should have thrown MermaidParseError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(MermaidParseError);
        expect(error.message).toMatch(/line \d+/);
        expect(error.message).toMatch(/column \d+/);
      }
    });

    it('should handle lexer errors with line and column numbers', async () => {
      const invalidRadar = `radar-beta
  axis A
  curve B{1}
  invalid@symbol`;

      try {
        await parseAsync('radar', invalidRadar);
        expect.fail('Should have thrown MermaidParseError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(MermaidParseError);
        // Should have line and column in the error message
        expect(error.message).toMatch(/line (\d+|\?)/);
        expect(error.message).toMatch(/column (\d+|\?)/);
      }
    });

    it('should format error message with "Parse error on line X, column Y" prefix', async () => {
      const invalidRadar = `radar-beta
  axis`;

      try {
        await parseAsync('radar', invalidRadar);
        expect.fail('Should have thrown MermaidParseError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(MermaidParseError);
        // Line and column may be ? if not available
        expect(error.message).toMatch(/Parse error on line (\d+|\?), column (\d+|\?):/);
      }
    });
  });
});
