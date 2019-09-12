/* eslint-env jasmine */
import pieDb from '../pieDb';
import pie from './pie';
import { setConfig } from '../../../config';

setConfig({
  securityLevel: 'strict'
});

describe('when parsing pie', function() {
  beforeEach(function() {
    pie.parser.yy = pieDb;
    pie.parser.yy.clear();
  });
  it('should handle simple pie', function() {
    const res = pie.parser.parse('pie \n"ash" : 60\n"bat" : 40\n');
    const sections = pieDb.getSections();
    console.log('sections: ', sections);
    const section1 = sections['ash'];
    expect(section1).toBe(60);
  });

  it('should handle simple pie with positive decimal', function() {
    const res = pie.parser.parse('pie \n"ash" : 60.67\n"bat" : 40\n');
    const sections = pieDb.getSections();
    console.log('sections: ', sections);
    const section1 = sections['ash'];
    expect(section1).toBe(60.67);
  });

  it('should handle simple pie with negative decimal', function() {
    expect(() => {
      pie.parser.parse('pie \n"ash" : 60.67\n"bat" : 40..12\n');
    }).toThrowError();
  });
});
