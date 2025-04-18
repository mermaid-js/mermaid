import { parser } from './pieParser.js';
import { DEFAULT_PIE_DB, db } from './pieDb.js';
import { setConfig } from '../../diagram-api/diagramAPI.js';

setConfig({
  securityLevel: 'strict',
});

describe('pie', () => {
  beforeEach(() => db.clear());

  describe('parse', () => {
    it('should handle very simple pie', async () => {
      await parser.parse(`pie
      "ash": 100
      `);

      const sections = db.getSections();
      expect(sections.get('ash')).toBe(100);
    });

    it('should handle simple pie', async () => {
      await parser.parse(`pie
      "ash" : 60
      "bat" : 40
      `);

      const sections = db.getSections();
      expect(sections.get('ash')).toBe(60);
      expect(sections.get('bat')).toBe(40);
    });

    it('should handle simple pie with showData', async () => {
      await parser.parse(`pie showData
      "ash" : 60
      "bat" : 40
      `);

      expect(db.getShowData()).toBeTruthy();

      const sections = db.getSections();
      expect(sections.get('ash')).toBe(60);
      expect(sections.get('bat')).toBe(40);
    });

    it('should handle simple pie with comments', async () => {
      await parser.parse(`pie
      %% comments
      "ash" : 60
      "bat" : 40
      `);

      const sections = db.getSections();
      expect(sections.get('ash')).toBe(60);
      expect(sections.get('bat')).toBe(40);
    });

    it('should handle simple pie with a title', async () => {
      await parser.parse(`pie title a 60/40 pie
      "ash" : 60
      "bat" : 40
      `);

      expect(db.getDiagramTitle()).toBe('a 60/40 pie');

      const sections = db.getSections();
      expect(sections.get('ash')).toBe(60);
      expect(sections.get('bat')).toBe(40);
    });

    it('should handle simple pie with an acc title (accTitle)', async () => {
      await parser.parse(`pie title a neat chart
      accTitle: a neat acc title
      "ash" : 60
      "bat" : 40
      `);

      expect(db.getDiagramTitle()).toBe('a neat chart');

      expect(db.getAccTitle()).toBe('a neat acc title');

      const sections = db.getSections();
      expect(sections.get('ash')).toBe(60);
      expect(sections.get('bat')).toBe(40);
    });

    it('should handle simple pie with an acc description (accDescr)', async () => {
      await parser.parse(`pie title a neat chart
      accDescr: a neat description
      "ash" : 60
      "bat" : 40
      `);

      expect(db.getDiagramTitle()).toBe('a neat chart');

      expect(db.getAccDescription()).toBe('a neat description');

      const sections = db.getSections();
      expect(sections.get('ash')).toBe(60);
      expect(sections.get('bat')).toBe(40);
    });

    it('should handle simple pie with a multiline acc description (accDescr)', async () => {
      await parser.parse(`pie title a neat chart
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
      expect(sections.get('ash')).toBe(60);
      expect(sections.get('bat')).toBe(40);
    });

    it('should handle simple pie with positive decimal', async () => {
      await parser.parse(`pie
      "ash" : 60.67
      "bat" : 40
      `);

      const sections = db.getSections();
      expect(sections.get('ash')).toBe(60.67);
      expect(sections.get('bat')).toBe(40);
    });

    it('should handle simple pie with negative decimal', async () => {
      await expect(async () => {
        await parser.parse(`pie
        "ash" : -60.67
        "bat" : 40.12
        `);
      }).rejects.toThrowError();
    });

    it('should handle unsafe properties', async () => {
      await expect(
        parser.parse(`pie title Unsafe props test
        "__proto__" : 386
        "constructor" : 85
        "prototype" : 15`)
      ).resolves.toBeUndefined();
      expect([...db.getSections().keys()]).toEqual(['__proto__', 'constructor', 'prototype']);
    });
  });

  describe('config', () => {
    it.todo('setConfig', () => {
      // db.setConfig({ useWidth: 850, useMaxWidth: undefined });

      const config = db.getConfig();
      expect(config.useWidth).toBe(850);
      expect(config.useMaxWidth).toBeTruthy();
    });

    it('getConfig', () => {
      expect(db.getConfig()).toStrictEqual(DEFAULT_PIE_DB.config);
    });

    it.todo('resetConfig', () => {
      // db.setConfig({ textPosition: 0 });
      // db.resetConfig();
      expect(db.getConfig().textPosition).toStrictEqual(DEFAULT_PIE_DB.config.textPosition);
    });
  });
});
