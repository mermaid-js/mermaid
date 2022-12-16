import { Fixture } from './fixture/Fixture';

let seqDsl = require('../../../src/parser/index');

test('Keyword "return" - in method block', () => {
  const ret = Fixture.firstStatement('A.method() { return x1 }')
    .message()
    .braceBlock()
    .block()
    .stat()[0]
    .ret();
  let returnedValue = ret.expr();
  expect(returnedValue.getText()).toBe('x1');
  expect(ret.ReturnTo()).toBe('_STARTER_');
});

test('defect - not returning to provided from', () => {
  const ret = Fixture.firstStatement('@Starter(M) A->B.method() { return x1 }')
    .message()
    .braceBlock()
    .block()
    .stat()[0]
    .ret();
  let returnedValue = ret.expr();
  expect(returnedValue.getText()).toBe('x1');
  expect(ret.ReturnTo()).toBe('A');
});

test('Keyword "return" - in alt block', () => {
  let returnedValue = Fixture.firstStatement('if(condition) { return y1 }')
    .alt()
    .ifBlock()
    .braceBlock()
    .block()
    .stat()[0]
    .ret()
    .expr();
  expect(returnedValue.getText()).toBe('y1');
});

test('Keyword "return" - in alt block - if + else if + else', () => {
  expect(seqDsl.RootContext).not.toBeNull();
  let returnedValueIf = Fixture.firstStatement(
    'if(condition) { return y1 } else if (condition1) { return y2 } else { return y3 }'
  )
    .alt()
    .ifBlock()
    .braceBlock()
    .block()
    .stat()[0]
    .ret()
    .expr();
  expect(returnedValueIf.getText()).toBe('y1');
  let returnedValueElseIf = Fixture.firstStatement(
    'if(condition) { return y1 } else if (condition1) { return y2 } else { return y3 }'
  )
    .alt()
    .elseIfBlock()[0]
    .braceBlock()
    .block()
    .stat()[0]
    .ret()
    .expr();
  expect(returnedValueElseIf.getText()).toBe('y2');
  let returnedValueElse = Fixture.firstStatement(
    'if(condition) { return y1 } else if (condition1) { return y2 } else { return y3 }'
  )
    .alt()
    .elseBlock()
    .braceBlock()
    .block()
    .stat()[0]
    .ret()
    .expr();
  expect(returnedValueElse.getText()).toBe('y3');
});

test('Keyword "return" - in loop block', () => {
  let returnedValue = Fixture.firstStatement('while(condition) { return z1 }')
    .loop()
    .braceBlock()
    .block()
    .stat()[0]
    .ret()
    .expr();
  expect(returnedValue.getText()).toBe('z1');
});
