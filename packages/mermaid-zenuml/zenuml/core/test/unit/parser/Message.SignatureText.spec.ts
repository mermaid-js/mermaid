import { Fixture } from './fixture/Fixture';

/**
 * message -> messageBody -> func -> signature (DOT signature)*
 * "A.method1().method2()" should produce signature "method1().method2()"
 */
describe('Message', () => {
  it('produces signatureText', () => {
    let message = Fixture.firstStatement('A.m1.m2').message();
    expect(message.SignatureText()).toBe('m1.m2');
  });
});
