import { parser } from './parser/exampleDiagram';
import db from './exampleDiagramDb';
describe('when parsing an info graph it', function () {
  let ex;
  beforeEach(function () {
    ex = parser;
    ex.yy = db;
  });

  it('should handle an info definition', function () {
    let str = `info
    showInfo`;

    ex.parse(str);
  });
});
