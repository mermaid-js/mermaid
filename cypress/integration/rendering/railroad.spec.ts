import { imgSnapshotTest } from '../../helpers/util.ts';

function shouldHaveRailroadContent($svg: JQuery<SVGSVGElement>) {
  const svgElement = $svg[0];
  expect(svgElement.nodeName).equal('svg');
  expect(svgElement.getElementsByClassName('railroad-rule').length).to.be.greaterThan(0);
  expect(svgElement.getElementsByClassName('railroad-line').length).to.be.greaterThan(0);
}

describe('railroad diagrams', () => {
  it('renders a simple rule', () => {
    imgSnapshotTest(
      `railroad-diagram
digit = "0" ;
      `,
      {},
      undefined,
      shouldHaveRailroadContent
    );
  });

  it('renders sequences and choices', () => {
    imgSnapshotTest(
      `railroad-diagram
expression = term ( "+" term | "-" term )* ;
term = number | "(" expression ")" ;
number = digit+ ;
digit = "0" | "1" | "2" ;
      `,
      {},
      undefined,
      shouldHaveRailroadContent
    );
  });

  it('renders optional and repetition operators', () => {
    imgSnapshotTest(
      `railroad-diagram
sign = "+" | "-" ;
number = sign? digit+ ;
list = "[" [ number ( "," number )* ] "]" ;
digit = "0" | "1" | "2" | "3" ;
      `,
      {},
      undefined,
      shouldHaveRailroadContent
    );
  });

  it('renders multiple rules in one diagram', () => {
    imgSnapshotTest(
      `railroad-diagram
json = element ;
element = object | array | string | number | "true" | "false" | "null" ;
object = "{" [ member ( "," member )* ] "}" ;
array = "[" [ element ( "," element )* ] "]" ;
member = string ":" element ;
string = "\\"" characters "\\"" ;
number = digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
      `,
      {},
      undefined,
      shouldHaveRailroadContent
    );
  });

  it('renders ISO 14977 notation', () => {
    imgSnapshotTest(
      `railroad-diagram
identifier = letter , { letter | digit | "_" } ;
letter = "a" | "b" | "c" ;
digit = "0" | "1" | "2" ;
      `,
      {},
      undefined,
      shouldHaveRailroadContent
    );
  });

  it('adapts to dark theme colors', () => {
    imgSnapshotTest(
      `railroad-diagram
value = string | number | object | array | "true" | "false" | "null" ;
string = "\\"" character* "\\"" ;
number = digit+ ;
digit = "0" | "1" | "2" | "3" ;
      `,
      { theme: 'dark' },
      undefined,
      shouldHaveRailroadContent
    );
  });
});
