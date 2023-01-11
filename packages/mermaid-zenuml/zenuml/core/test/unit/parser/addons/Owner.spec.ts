import { Fixture } from '../fixture/Fixture';

describe('Owner', () => {
  it('for sync message', () => {
    const stat = Fixture.firstStatement('A.m');
    expect(stat.message().Owner()).toBe('A');
  });

  it('for sync self message', () => {
    const stat = Fixture.firstChild('A.m {self}');
    expect(stat.message().Owner()).toBe('A');
  });

  it('for async message', () => {
    const stat = Fixture.firstStatement('B->A:m');
    expect(stat.asyncMessage().Owner()).toBe('A');
  });

  it('for creation message', () => {
    const stat = Fixture.firstStatement('new A');
    expect(stat.creation().Owner()).toBe('A');
  });
});
