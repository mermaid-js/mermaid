let seqDsl = require('../../../src/parser/index');

test('`if` with a block', () => {
  let rootContext = seqDsl.RootContext('title my title');
  let title = rootContext.title();
  expect(title.content()).toBe('my title');
});
