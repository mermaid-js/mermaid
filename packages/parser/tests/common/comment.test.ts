import { describe, expect, it } from 'vitest';

import {
  createInfoTestServices,
  createJourneyTestServices,
  createPieTestServices,
  createTimelineTestServices,
} from '../test-utils.js';

describe('comments', () => {
  const { parse: infoParse } = createInfoTestServices();
  const { parse: journeyParse } = createJourneyTestServices();
  const { parse: pieParse } = createPieTestServices();
  const { parse: timelineParse } = createTimelineTestServices();

  describe('info', () => {
    describe('single line', () => {
      it('should handle empty comment', () => {
        const context = `info %%`;
        const result = infoParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `info %% comment`;
        const result = infoParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });

    describe('multi line', () => {
      it('should handle empty comment', () => {
        const context = `info %%**%%`;
        const result = infoParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `info %%*
        multi line comment
        *%%`;
        const result = infoParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });
  });

  describe('journey', () => {
    describe('single line', () => {
      it('should handle empty comment', () => {
        const context = `journey %%`;
        const result = journeyParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `journey %% comment`;
        const result = journeyParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });

    describe('multi line', () => {
      it('should handle empty comment', () => {
        const context = `journey %%**%%`;
        const result = journeyParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `journey %%*
        multi line comment
        *%%`;
        const result = journeyParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });
  });

  describe('pie', () => {
    describe('single line', () => {
      it('should handle empty comment', () => {
        const context = `pie %%`;
        const result = pieParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `pie %% comment`;
        const result = pieParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });

    describe('multi line', () => {
      it('should handle empty comment', () => {
        const context = `pie %%**%%`;
        const result = pieParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `pie %%*
        multi line comment
        *%%`;
        const result = pieParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });
  });

  describe('timeline', () => {
    describe('single line', () => {
      it('should handle empty comment', () => {
        const context = `timeline %%`;
        const result = timelineParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `timeline %% comment`;
        const result = timelineParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });

    describe('multi line', () => {
      it('should handle empty comment', () => {
        const context = `timeline %%**%%`;
        const result = timelineParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });

      it('should handle regular comment', () => {
        const context = `timeline %%*
        multi line comment
        *%%`;
        const result = timelineParse(context);
        expect(result.parserErrors).toHaveLength(0);
        expect(result.lexerErrors).toHaveLength(0);
      });
    });
  });
});
