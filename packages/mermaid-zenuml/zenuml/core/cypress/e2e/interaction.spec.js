/* eslint-disable no-undef */
import 'cypress-plugin-snapshots/commands';
describe('Smoke test', function () {
  it('interaction', function () {
    cy.visit('http://127.0.0.1:8080/cy/smoke-interaction.html');
    cy.wait(1500);
    cy.document().toMatchImageSnapshot({
      imageConfig: { threshold: 0.01 },
      capture: 'viewport',
    });
  });
});
