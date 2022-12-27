let seqDsl = require('../../../src/parser/index');

test('Empty `loop`', () => {
  let rootContext = seqDsl.RootContext('while(x) {}');
  let block = rootContext.block();
  let loop = block.stat()[0].loop();
  expect(loop.getText()).toBe('while(x){}');
  expect(loop.parExpr().getText()).toBe('(x)');
  expect(loop.braceBlock().getText()).toBe('{}');
});

test('`loop` with comments', () => {
  let rootContext = seqDsl.RootContext('while(x) { // comment \n\r}');
  let block = rootContext.block();
  expect(block.stat()[0].loop().braceBlock().getComment()).toBe(' comment \n');
});

test('`loop` with block', () => {
  let rootContext = seqDsl.RootContext('while(x) { doSomething() \n\r}');
  let block = rootContext.block();
  expect(block.stat()[0].loop().braceBlock().block().stat()[0].getText()).toBe('doSomething()');
});
