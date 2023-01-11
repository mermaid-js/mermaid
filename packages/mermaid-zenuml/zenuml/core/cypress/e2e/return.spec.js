/* eslint-disable no-undef */
import 'cypress-plugin-snapshots/commands';
describe('Smoke test', function () {
  it('return', function () {
    cy.visit('http://127.0.0.1:8080/cy/smoke-return.html');
    cy.wait(1500);
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.01 },
      capture: 'viewport',
    });
  });
});
