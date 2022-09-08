import pieDb from './pieDb';
import pie from './pieParser';
import { setConfig } from '../../config';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing pie', function () {
  beforeEach(function () {
    pieDb.clear();
  });
  it('should handle simple pie', function () {
    pie.parser.parse(`pie
"ash" : 100
`);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(100);
  });
  it('should handle pie', function () {
    pie.parser.parse(`pie
"ash" : 60
"bat" : 40
`);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });
  it('should handle pie with comments', function () {
    pie.parser.parse(`pie
      %% comments
  "ash" : 60
  "bat" : 40
  `);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });

  it('should handle pie with a directive', function () {
    pie.parser.parse(`%%{init: {'logLevel':0}}%%
  pie
  "ash" : 60
  "bat" : 40
  `);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });

  it('should handle pie with a title and emoji', function () {
    pie.parser.parse(`pie title a 60/40 pie ❤️
  "ash" : 60
  "bat" : 40
  `);
    const sections = pieDb.getSections();
    const title = pieDb.getDiagramTitle();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
    expect(title).toBe('a 60/40 pie ❤️');
  });

  it('should handle pie with an acc title  (accTitle)', function () {
    pie.parser.parse(`pie title a neat chart
    accTitle: Hello World
  "ash" : 60
  "bat" : 40
  `);

    const description = pieDb.getAccDescription();
    const title = pieDb.getAccTitle();
    expect(title).toBe('Hello World');
    expect(description).toBe('');
  });

  it('should handle pie with an acc description (accDescr)', function () {
    pie.parser.parse(`pie title a neat chart
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

  it('should handle pie with a multiline acc description (accDescr)', function () {
    pie.parser.parse(`pie title a neat chart
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

  it('should handle pie with positive decimal', function () {
    pie.parser.parse(`pie
  "ash" : 60.67
  "bat" : 40
  `);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60.67);
  });

  it('should handle pie with invalid decimal', function () {
    expect(() => {
      pie.parser.parse(`pie
  "ash" : 60.67
  "bat" : 40..12
  `);
    }).toThrowError();
  });

  it('should handle pie with negative decimal', function () {
    expect(() => {
      pie.parser.parse(`pie
  "ash" : 60.67
  "bat" : -40.12
  `);
    }).toThrowError();
  });
});
