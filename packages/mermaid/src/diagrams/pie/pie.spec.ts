import pieDb from './pieDb.js';
import { parse } from './pieParser.js';
import { setConfig } from '../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing pie', () => {
  beforeEach(() => {
    pieDb.clear();
  });

  it('should handle simple pie', () => {
    parse(`pie
    "ash" : 100
    `);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(100);
  });

  it('should handle pie', () => {
    parse(`pie
    "ash" : 60
    "bat" : 40
    `);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });

  it('should handle pie with comments', () => {
    parse(`pie
    %% comments
    "ash" : 60
    "bat" : 40
    `);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });

  it('should handle pie with a directive', () => {
    parse(`%%{init: {'logLevel':0}}%%
    pie
    "ash" : 60
    "bat" : 40
    `);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });

  it('should handle pie with a title and emoji', () => {
    parse(`pie title a 60/40 pie ❤️
    "ash" : 60
    "bat" : 40
    `);
    const sections = pieDb.getSections();
    const title = pieDb.getDiagramTitle();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
    expect(title).toBe('a 60/40 pie ❤️');
  });

  it('should handle pie with an acc title  (accTitle)', () => {
    parse(`pie title a neat chart
    accTitle: Hello World
    "ash" : 60
    "bat" : 40
    `);

    const description = pieDb.getAccDescription();
    const title = pieDb.getAccTitle();
    expect(title).toBe('Hello World');
    expect(description).toBe('');
  });

  it('should handle pie with an acc description (accDescr)', () => {
    parse(`pie title a neat chart
    accDescr: a neat description
    "ash" : 60
    "bat" : 40
    `);

    const sections = pieDb.getSections();
    const title = pieDb.getDiagramTitle();
    const description = pieDb.getAccDescription();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
    expect(title).toBe('a neat chart');
    expect(description).toBe('a neat description');
  });

  it('should handle pie with a multiline acc description (accDescr)', () => {
    parse(`pie title a neat chart
    accDescr {
      a neat description
      on multiple lines
    }
    "ash" : 60

    "bat" : 40

    `);

    const sections = pieDb.getSections();
    const title = pieDb.getDiagramTitle();
    const description = pieDb.getAccDescription();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
    expect(title).toBe('a neat chart');
    expect(description).toBe('a neat description\non multiple lines');
  });

  it('should handle pie with positive decimal', () => {
    parse(`pie
    "ash" : 60.67
    "bat" : 40
    `);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60.67);
  });

  it('should handle pie with invalid decimal', () => {
    expect(() => {
      parse(`pie
      "ash" : 60.67
      "bat" : 40..12
      `);
    }).toThrowError();
  });

  it('should handle pie with negative decimal', () => {
    expect(() => {
      parse(`pie
      "ash" : 60.67
      "bat" : -40.12
      `);
    }).toThrowError();
  });
});
