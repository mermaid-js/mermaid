import infoDb from './infoDb';
import infoParser from './infoParser';

describe('when parsing an info graph it', function () {
  beforeEach(() => {
    infoDb.clear();
  });

  it.each([
    // Without newlines
    `info
  showInfo`,

    // With newlines at beginning
    `
    info
  showInfo`,
    // Extra newlines
    `
    
    info
  
    showInfo
  
    `,
  ])('should handle valid info definitions', function (str: string = '') {
    expect(infoDb.getInfo()).toEqual(false);
    infoParser.parse(str);
    expect(infoDb.getInfo()).toEqual(true);
  });

  it('should throw an error when the info is not defined', function () {
    expect(() => {
      infoParser.parse(``);
    }).toThrow();
  });

  // TODO
  // it('should no throw an error when showInfo is not defined', function () {
  //   expect(() => {
  //     infoParser.parse('info');
  //   }).not.toThrow();
  //   expect(infoDb.getInfo()).toEqual(false);
  // });
});
