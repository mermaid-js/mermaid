import pieDb from '../pieDb.js';
import pie from './pie.jison';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('when parsing pie', function () {
  beforeEach(function () {
    pie.parser.yy = pieDb;
    pie.parser.yy.clear();
  });
  it('should handle very simple pie', function () {
    const res = pie.parser.parse(`pie
"ash" : 100
`);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(100);
  });
  it('should handle simple pie', function () {
    const res = pie.parser.parse(`pie
"ash" : 60
"bat" : 40
`);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });
  it('should handle simple pie with comments', function () {
    const res = pie.parser.parse(`pie
    %% comments
"ash" : 60
"bat" : 40
`);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });

  it('should handle simple pie with a directive', function () {
    const res = pie.parser.parse(`%%{init: {'logLevel':0}}%%
pie
"ash" : 60
"bat" : 40
`);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });

  it('should handle simple pie with a title', function () {
    const res = pie.parser.parse(`pie title a 60/40 pie
"ash" : 60
"bat" : 40
`);
    const sections = pieDb.getSections();
    const title = pieDb.getDiagramTitle();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
    expect(title).toBe('a 60/40 pie');
  });

  it('should handle simple pie without an acc description  (accDescr)', function () {
    const res = pie.parser.parse(`pie title a neat chart
"ash" : 60
"bat" : 40
`);

    const sections = pieDb.getSections();
    const title = pieDb.getDiagramTitle();
    const description = pieDb.getAccDescription();
    const section1 = sections['ash'];
    expect(section1).toBe(60);
    expect(title).toBe('a neat chart');
    expect(description).toBe('');
  });

  it('should handle simple pie with an acc description (accDescr)', function () {
    const res = pie.parser.parse(`pie title a neat chart
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
  it('should handle simple pie with a multiline acc description (accDescr)', function () {
    const res = pie.parser.parse(`pie title a neat chart
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

  it('should handle simple pie with positive decimal', function () {
    const res = pie.parser.parse(`pie
"ash" : 60.67
"bat" : 40
`);
    const sections = pieDb.getSections();
    const section1 = sections['ash'];
    expect(section1).toBe(60.67);
  });

  it('should handle simple pie with negative decimal', function () {
    expect(() => {
      pie.parser.parse(`pie
"ash" : 60.67
"bat" : 40..12
`);
    }).toThrowError();
  });
});
