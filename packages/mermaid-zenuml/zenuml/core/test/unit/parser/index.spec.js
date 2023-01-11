import { RootContext, Participants } from '../../../src/parser/index';

import { Fixture } from './fixture/Fixture';

test('seqDsl should parse the to and method', () => {
  const messageBody = Fixture.firstStatement('"b:B".method()').message().messageBody();
  let func = messageBody.func();
  expect(messageBody.to().getText()).toBe('"b:B"');
  expect(func.signature()[0].getText()).toBe('method()');
});

test('seqDsl should get all participants', () => {
  let rootContext = RootContext('A\r\n @Starter(C)\r\nC.method()\r\nnew B()');

  let participants = Participants(rootContext);
  expect(participants.Names().length).toBe(3);
  expect(participants.Names()[0]).toBe('A');
  expect(participants.Names()[1]).toBe('C');
  expect(participants.Names()[2]).toBe('B');
});

test('seqDsl should parse Starter', () => {
  let rootContext = RootContext('@Starter(X) A a = new A()');
  let starter = rootContext.head().starterExp();
  expect(starter.getText()).toBe('@Starter(X)');
});

test('seqDsl should parse Description allowing @', () => {
  let rootContext = RootContext('// title \r\n// Comment allows @ \r\n @Starter(X) A a = new A()');
  let starter = rootContext.head().starterExp();
  expect(starter.starter().getText()).toBe('X');

  let comment = starter.getComment();
  expect(comment).toBe(' title \r\n Comment allows @ \r\n');
});

test('Description should allow multi-lines', () => {
  let rootContext = RootContext(
    '//first line\r\n// 2nd line \r\n// 3rd line\r\n  @Starter(X) A a = new A()'
  );
  let starterExp = rootContext.head().starterExp();
  expect(starterExp.starter().getText()).toBe('X');
  let comments = rootContext.head().starterExp().getComment();
  expect(comments).toBe('first line\r\n 2nd line \r\n 3rd line\r\n');
});

test('Async message', () => {
  let rootContext = RootContext('A->B:message');
  let block = rootContext.block();
  expect(block.getText()).toBe('A->B:message');
  expect(block.stat()[0].asyncMessage().from().getText()).toBe('A');
  expect(block.stat()[0].asyncMessage().to().getText()).toBe('B');
  expect(block.stat()[0].asyncMessage().content().getText()).toBe('message');
});
