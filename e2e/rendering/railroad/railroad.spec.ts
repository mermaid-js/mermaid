import { test, expect, type Locator } from '@playwright/test';
import { imgSnapshotTest } from '../../helpers/util.ts';

async function shouldHaveRailroadContent(svg: Locator) {
  await expect(svg).toHaveJSProperty('nodeName', 'svg');
  expect(await svg.locator('.railroad-rule').count()).toBeGreaterThan(0);
  expect(await svg.locator('.railroad-line').count()).toBeGreaterThan(0);
}

test.describe('railroad diagrams', () => {
  test.describe('IR syntax (railroad-beta)', () => {
    test('renders a simple rule', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        `railroad-beta
digit = terminal("0") ;
        `,
        {},
        undefined,
        shouldHaveRailroadContent
      );
    });

    test('renders sequences and choices', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('renders optional and repetition operators', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('renders multiple rules in one diagram', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('adapts to dark theme colors', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

  test.describe('EBNF syntax (railroad-ebnf-beta)', () => {
    test('renders sequences and choices', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

    test('renders ISO 14977 notation', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

  test.describe('ABNF syntax (railroad-abnf-beta)', () => {
    test('renders alternation and repetition', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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

  test.describe('PEG syntax (railroad-peg-beta)', () => {
    test('renders ordered choice and suffixes', async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
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
