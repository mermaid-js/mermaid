// @ts-ignore - jison doesn't export types
import { parser } from './parser/pie.jison';
import { DEFAULT_PIE_DB, db } from './pieDb.js';
import { setConfig } from '../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('pie chart', () => {
  beforeEach(() => {
    parser.yy = db;
    db.clear();
    db.reset();
  });

  describe('parse', () => {
    it('should handle very simple pie', () => {
      parser.parse(`pie
      "ash": 100
      `);

      const sections = db.getSections();
      expect(sections['ash']).toBe(100);
    });

    it('should handle simple pie', () => {
      parser.parse(`pie
      "ash" : 60
      "bat" : 40
      `);

      const sections = db.getSections();
      expect(sections['ash']).toBe(60);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with showData', () => {
      parser.parse(`pie showData
      "ash" : 60
      "bat" : 40
      `);

      expect(db.getShowData()).toBeTruthy();

      const sections = db.getSections();
      expect(sections['ash']).toBe(60);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with comments', () => {
      parser.parse(`pie
      %% comments
      "ash" : 60
      "bat" : 40
      `);

      const sections = db.getSections();
      expect(sections['ash']).toBe(60);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with a directive', () => {
      parser.parse(`%%{init: {'logLevel':0}}%%
      pie
      "ash" : 60
      "bat" : 40
      `);
      const sections = db.getSections();
      expect(sections['ash']).toBe(60);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with a title', () => {
      parser.parse(`pie title a 60/40 pie
      "ash" : 60
      "bat" : 40
      `);

      expect(db.getDiagramTitle()).toBe('a 60/40 pie');

      const sections = db.getSections();
      expect(sections['ash']).toBe(60);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with an acc title (accTitle)', () => {
      parser.parse(`pie title a neat chart
      accTitle: a neat acc title
      "ash" : 60
      "bat" : 40
      `);

      expect(db.getDiagramTitle()).toBe('a neat chart');

      expect(db.getAccTitle()).toBe('a neat acc title');

      const sections = db.getSections();
      expect(sections['ash']).toBe(60);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with an acc description (accDescr)', () => {
      parser.parse(`pie title a neat chart
      accDescr: a neat description
      "ash" : 60
      "bat" : 40
      `);

      expect(db.getDiagramTitle()).toBe('a neat chart');

      expect(db.getAccDescription()).toBe('a neat description');

      const sections = db.getSections();
      expect(sections['ash']).toBe(60);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with a multiline acc description (accDescr)', () => {
      parser.parse(`pie title a neat chart
      accDescr {
        a neat description
        on multiple lines
      }
      "ash" : 60
      "bat" : 40
    `);

      expect(db.getDiagramTitle()).toBe('a neat chart');

      expect(db.getAccDescription()).toBe('a neat description\non multiple lines');

      const sections = db.getSections();
      expect(sections['ash']).toBe(60);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with positive decimal', () => {
      parser.parse(`pie
      "ash" : 60.67
      "bat" : 40
      `);

      const sections = db.getSections();
      expect(sections['ash']).toBe(60.67);
      expect(sections['bat']).toBe(40);
    });

    it('should handle simple pie with negative decimal', () => {
      expect(() => {
        parser.parse(`pie
        "ash" : -60.67
        "bat" : 40.12
        `);
      }).toThrowError();
    });
  });

  describe('config', () => {
    it('setConfig', () => {
      db.setConfig({ useWidth: 850, useMaxWidth: undefined });

      const config = db.getConfig();
      expect(config.useWidth).toBe(850);
      expect(config.useMaxWidth).toBeTruthy();
    });

    it('getConfig', () => {
      expect(db.getConfig()).toStrictEqual(DEFAULT_PIE_DB.config);
    });

    it('reset', () => {
      db.setConfig({ textPosition: 0 });
      db.reset();
      expect(db.getConfig().textPosition).toStrictEqual(DEFAULT_PIE_DB.config.textPosition);
    });
  });
});
