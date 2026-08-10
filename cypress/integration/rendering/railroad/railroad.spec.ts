import { imgSnapshotTest } from '../../../helpers/util.ts';

function shouldHaveRailroadContent($svg: JQuery<SVGSVGElement>) {
  const svgElement = $svg[0];
  expect(svgElement.nodeName).equal('svg');
  expect(svgElement.getElementsByClassName('railroad-rule').length).to.be.greaterThan(0);
  expect(svgElement.getElementsByClassName('railroad-line').length).to.be.greaterThan(0);
}

describe('railroad diagrams', () => {
  describe('IR syntax (railroad-beta)', () => {
    it('renders a simple rule', () => {
      imgSnapshotTest(
        `railroad-beta
digit = terminal("0") ;
        `,
        {},
        undefined,
        shouldHaveRailroadContent
      );
    });

    it('renders sequences and choices', () => {
      imgSnapshotTest(
        `railroad-beta
expression = sequence(
    nonterminal("term"),
    zeroOrMore(choice(
        sequence(terminal("+"), nonterminal("term")),
        sequence(terminal("-"), nonterminal("term"))
    ))
) ;
term = choice(nonterminal("number"), sequence(terminal("("), nonterminal("expression"), terminal(")"))) ;
number = oneOrMore(nonterminal("digit")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2")) ;
        `,
        {},
        undefined,
        shouldHaveRailroadContent
      );
    });

    it('renders optional and repetition operators', () => {
      imgSnapshotTest(
        `railroad-beta
sign = choice(terminal("+"), terminal("-")) ;
number = sequence(optional(nonterminal("sign")), oneOrMore(nonterminal("digit"))) ;
list = sequence(terminal("["), optional(sequence(nonterminal("number"), zeroOrMore(sequence(terminal(","), nonterminal("number"))))), terminal("]")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3")) ;
        `,
        {},
        undefined,
        shouldHaveRailroadContent
      );
    });

    it('renders multiple rules in one diagram', () => {
      imgSnapshotTest(
        `railroad-beta
json = nonterminal("element") ;
element = choice(nonterminal("object"), nonterminal("array"), nonterminal("string"), nonterminal("number"), terminal("true"), terminal("false"), terminal("null")) ;
object = sequence(terminal("{"), optional(sequence(nonterminal("member"), zeroOrMore(sequence(terminal(","), nonterminal("member"))))), terminal("}")) ;
array = sequence(terminal("["), optional(sequence(nonterminal("element"), zeroOrMore(sequence(terminal(","), nonterminal("element"))))), terminal("]")) ;
member = sequence(nonterminal("string"), terminal(":"), nonterminal("element")) ;
number = oneOrMore(nonterminal("digit")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3"), terminal("4"), terminal("5"), terminal("6"), terminal("7"), terminal("8"), terminal("9")) ;
        `,
        {},
        undefined,
        shouldHaveRailroadContent
      );
    });

    it('adapts to dark theme colors', () => {
      imgSnapshotTest(
        `railroad-beta
value = choice(nonterminal("string"), nonterminal("number"), nonterminal("object"), nonterminal("array"), terminal("true"), terminal("false"), terminal("null")) ;
number = oneOrMore(nonterminal("digit")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3")) ;
        `,
        { theme: 'dark' },
        undefined,
        shouldHaveRailroadContent
      );
    });
  });

  describe('EBNF syntax (railroad-ebnf-beta)', () => {
    it('renders sequences and choices', () => {
      imgSnapshotTest(
        `railroad-ebnf-beta
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

    it('renders ISO 14977 notation', () => {
      imgSnapshotTest(
        `railroad-ebnf-beta
identifier = letter , { letter | digit | "_" } ;
letter = "a" | "b" | "c" ;
digit = "0" | "1" | "2" ;
        `,
        {},
        undefined,
        shouldHaveRailroadContent
      );
    });
  });

  describe('ABNF syntax (railroad-abnf-beta)', () => {
    it('renders alternation and repetition', () => {
      imgSnapshotTest(
        `railroad-abnf-beta
scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ) ;
digit = "0" / "1" / "2" / "3" ;
        `,
        {},
        undefined,
        shouldHaveRailroadContent
      );
    });
  });

  describe('PEG syntax (railroad-peg-beta)', () => {
    it('renders ordered choice and suffixes', () => {
      imgSnapshotTest(
        `railroad-peg-beta
Expression <- Term (("+" / "-") Term)* ;
Term <- Factor (("*" / "/") Factor)* ;
Factor <- Number / "(" Expression ")" ;
Number <- Digit+ ;
Digit <- "0" / "1" / "2" / "3" ;
        `,
        {},
        undefined,
        shouldHaveRailroadContent
      );
    });
  });
});
