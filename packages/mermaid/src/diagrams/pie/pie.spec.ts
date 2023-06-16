// @ts-ignore - jison doesn't export types
import { parser } from './parser/pie.jison';
import { db } from './pieDb.js';
import { setConfig } from '../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('pie chart', () => {
  beforeEach(() => {
    parser.yy = db;
    parser.yy.clear();
  });

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

    const title = db.getDiagramTitle();
    expect(title).toBe('a 60/40 pie');

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

    const title = db.getDiagramTitle();
    expect(title).toBe('a neat chart');

    const accTitle = db.getAccTitle();
    expect(accTitle).toBe('a neat acc title');

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

    const title = db.getDiagramTitle();
    expect(title).toBe('a neat chart');

    const description = db.getAccDescription();
    expect(description).toBe('a neat description');

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

    const title = db.getDiagramTitle();
    expect(title).toBe('a neat chart');

    const description = db.getAccDescription();
    expect(description).toBe('a neat description\non multiple lines');

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
