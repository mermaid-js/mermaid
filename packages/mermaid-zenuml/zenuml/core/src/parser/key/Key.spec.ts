import { Fixture } from '../../../test/unit/parser/fixture/Fixture';

describe('get key for any context', () => {
  it('should return the key for a context', () => {
    const message = Fixture.firstStatement('A.method').message();
    expect(message.Key()).toBe('0:7');
  });
});
