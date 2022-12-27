import { Fixture } from './fixture/Fixture';

let seqDsl = require('../../../src/parser/index');

test('Empty `if`', () => {
  let alt = Fixture.firstStatement('if(x) {}').alt();
  expectText(alt).toBe('if(x){}');
  let ifBlock = alt.ifBlock();
  expectText(ifBlock).toBe('if(x){}');
  expectText(ifBlock.parExpr()).toBe('(x)');
  expectText(ifBlock.braceBlock()).toBe('{}');
});

test('`if` with a block', () => {
  let braceBlock = braceBlockOfIf('if(x) { doSomething() \n\r}');
  expectText(braceBlock.block().stat()[0]).toBe('doSomething()');
});

test('`if` with comments only', () => {
  let braceBlock = braceBlockOfIf('if(x) { // comment \n\r}');
  expect(braceBlock.getComment()).toBe(' comment \n');
});

test('`if` with comments and a block', () => {
  let braceBlock = braceBlockOfIf('if(x) { // comment \n\r doSomething \n\r}');
  expect(braceBlock.getComment()).toBeNull();
});

describe('if - incomplete', () => {
  test('', () => {
    expect(Fixture.firstStatement('if(x)').alt().ifBlock().parExpr().condition().getText()).toBe(
      'x'
    );
  });
});

function braceBlockOfIf(code) {
  return Fixture.firstStatement(code).alt().ifBlock().braceBlock();
}

function expectText(context) {
  return expect(context.getText());
}
