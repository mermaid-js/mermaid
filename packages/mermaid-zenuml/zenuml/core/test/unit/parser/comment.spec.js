const { Fixture } = require('./fixture/Fixture');
test('one line of comment', () => {
  expect(Fixture.firstStatement('//C1\nA.m').getComment()).toBe('C1\n');
});

test('two lines of comment', () => {
  expect(Fixture.firstStatement('//C1\n//C2\nA.m').getComment()).toBe('C1\nC2\n');
});

test('comment only block is valid', () => {
  let message = Fixture.firstStatement('A.method() { // comment \n }').message();
  let braceBlock = message.braceBlock();
  expect(braceBlock.getComment()).toBe(' comment \n');
});

test('comment after method call is valid', () => {
  let message = Fixture.firstStatement('A.method() { internal() \n// comment \n }').message();
  let braceBlock = message.braceBlock();
  expect(braceBlock.getComment()).toBe(' comment \n');
});
