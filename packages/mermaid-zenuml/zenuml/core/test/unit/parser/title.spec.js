import { RootContext } from '../../../src/parser/index';

test('`if` with a block', () => {
  let rootContext = RootContext('title my title');
  let title = rootContext.title();
  expect(title.content()).toBe('my title');
});
