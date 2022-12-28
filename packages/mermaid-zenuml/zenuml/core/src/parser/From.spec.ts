import { Fixture } from '../../test/unit/parser/fixture/Fixture';

describe('From', () => {
  it('should parse from of a context: simple statement', () => {
    expect(Fixture.firstStatement('A.method').message().From()).toBe('_STARTER_');
    expect(Fixture.firstStatement('A->B.method').message().From()).toBe('A');
    expect(Fixture.firstStatement('A->B: message').asyncMessage().From()).toBe('A');
    expect(Fixture.firstStatement('new A').creation().From()).toBe('_STARTER_');

    expect(Fixture.firstChild('A.method { method }').message().From()).toBe('A');
    expect(Fixture.firstChild('A.method { B.method }').message().From()).toBe('A');
    expect(Fixture.firstChild('A.method { B->C.method }').message().From()).toBe('B');
    expect(Fixture.firstChild('A.method { B->C:method \n}').asyncMessage().From()).toBe('B');
    expect(Fixture.firstChild('A.method { new B }').creation().From()).toBe('A');
  });
});

describe('ProvidedFrom for MessageContext Only', () => {
  it('should parse ProvidedFrom for a Message', () => {
    expect(Fixture.firstStatement('A.method').message().ProvidedFrom()).toBe(undefined);
    expect(Fixture.firstStatement('A->B.method').message().ProvidedFrom()).toBe('A');
  });
});
